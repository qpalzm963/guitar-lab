// Microphone tuner engine: RAW Web Audio (NOT Tone.js — Tone has no mic-input
// path). It opens the mic, runs an analyser, and reports a detected frequency
// (or null when the frame is silent/unpitched) on every animation frame. The
// pure DSP lives in lib/audio/pitch.ts; this file is only the browser plumbing.
//
// SSR/static-export safety: every browser API (navigator, AudioContext, rAF) is
// touched ONLY inside instance methods, never at module scope, so importing this
// module during the Next.js build never references a missing global. The React
// component additionally only constructs/imports this from a user gesture.

import { detectPitch } from "./pitch";

export type TunerStatus =
  | "idle"
  | "requesting"
  | "listening"
  | "denied"
  | "error"
  | "unsupported";

// webkitAudioContext is still the only AudioContext on older iOS Safari, so we
// fall back to it. Typed locally (the standard lib only declares AudioContext).
type AudioContextCtor = typeof AudioContext;
function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

export class TunerEngine {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  // Typed with an explicit ArrayBuffer backing: AnalyserNode.getFloatTimeDomainData
  // (current DOM lib) requires Float32Array<ArrayBuffer>, not the wider
  // ArrayBufferLike default of a bare `Float32Array`.
  private buf: Float32Array<ArrayBuffer> | null = null;
  private rafId: number | null = null;

  // Reported on every frame: the detected fundamental in Hz, or null for a
  // silent/unpitched frame. The component maps this to a note + cents.
  constructor(private onFrequency: (hz: number | null) => void) {}

  /**
   * Whether this browser can do mic-input tuning at all. Guards getUserMedia and
   * AudioContext (incl. the webkit prefix). Safe to call inside an effect; does
   * not prompt for permission or touch the mic — just feature-detects.
   */
  static isSupported(): boolean {
    if (typeof navigator === "undefined") return false;
    if (typeof navigator.mediaDevices?.getUserMedia !== "function") return false;
    return getAudioContextCtor() !== null;
  }

  /**
   * Open the mic and start the detection loop. MUST be called from a user
   * gesture — getUserMedia() raises the permission prompt and the AudioContext
   * can only resume inside a gesture (autoplay policy / iOS). Throws on denial or
   * any setup failure so the caller can surface the right status; on throw the
   * engine is left torn down (no leaked mic/context).
   */
  async start(): Promise<void> {
    if (this.rafId !== null) return; // already listening

    const AudioCtor = getAudioContextCtor();
    if (!AudioCtor) throw new Error("AudioContext unsupported");

    // This is the permission prompt. Disable the browser's voice DSP — echo
    // cancellation / noise suppression / AGC all distort a sustained musical
    // tone and would skew the pitch estimate.
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
    } catch (err) {
      await this.stop();
      throw err; // NotAllowedError / SecurityError / etc. — classified by caller
    }
    this.stream = stream;

    try {
      const ctx = new AudioCtor();
      this.ctx = ctx;
      // Resume from the gesture; a fresh context can start "suspended".
      if (ctx.state === "suspended") await ctx.resume();

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      // No smoothing: we do our own time-domain analysis per frame and want the
      // raw waveform, not a smeared one.
      analyser.smoothingTimeConstant = 0;
      // Source → analyser ONLY. Never connect to ctx.destination — routing the
      // mic to the speakers would feed back / echo.
      source.connect(analyser);
      this.source = source;
      this.analyser = analyser;

      const buf = new Float32Array(analyser.fftSize);
      this.buf = buf;

      const tick = () => {
        const a = this.analyser;
        const b = this.buf;
        const c = this.ctx;
        if (!a || !b || !c) return;
        a.getFloatTimeDomainData(b);
        this.onFrequency(detectPitch(b, c.sampleRate));
        this.rafId = requestAnimationFrame(tick);
      };
      this.rafId = requestAnimationFrame(tick);
    } catch (err) {
      await this.stop(); // release the mic we just opened
      throw err;
    }
  }

  /**
   * Stop the loop and FULLY release the mic + audio graph. Stopping the stream
   * tracks is what turns off the browser's red "mic in use" indicator, so this
   * must run on stop AND on unmount. Idempotent.
   */
  async stop(): Promise<void> {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.source?.disconnect();
    this.source = null;
    this.analyser = null;
    this.buf = null;
    // Stop every track → drops the mic, clears the recording indicator.
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    if (this.ctx) {
      try {
        await this.ctx.close();
      } catch {
        // A context already closed (or closing) throws; nothing left to free.
      }
      this.ctx = null;
    }
  }

  /** Full teardown for unmount. Releases the mic; safe to call more than once. */
  async dispose(): Promise<void> {
    await this.stop();
  }
}
