// Metronome: pure scheduling/decision logic + a thin Tone.js engine wrapper.
//
// The top half is PURE (no `tone` import) so it is unit-testable in node without
// a browser AudioContext. The bottom half (MetronomeEngine) wraps Tone.js and is
// only ever constructed inside client components from a user gesture. `tone` is
// imported dynamically inside start() so it NEVER loads at module scope — keeping
// it out of SSR and out of every bundle that doesn't actually play sound.

// ---------------------------------------------------------------------------
// Pure config + helpers (no Tone, safe to import anywhere / test in node)
// ---------------------------------------------------------------------------

/** Subdivision choices, mapped to Tone transport notation. */
export type Subdivision = "4n" | "8n" | "16n" | "8t";

export const SUBDIVISIONS: { id: Subdivision; label: string }[] = [
  { id: "4n", label: "四分音符" },
  { id: "8n", label: "八分音符" },
  { id: "16n", label: "十六分音符" },
  { id: "8t", label: "三連音" },
];

/** How many subdivision steps fall within one quarter-note beat. */
export function stepsPerBeat(sub: Subdivision): number {
  switch (sub) {
    case "4n":
      return 1;
    case "8n":
      return 2;
    case "16n":
      return 4;
    case "8t":
      return 3;
  }
}

export type AccentMode = "downbeat" | "2and4" | "none";

export const ACCENT_MODES: { id: AccentMode; label: string }[] = [
  { id: "downbeat", label: "重音在第一拍" },
  { id: "2and4", label: "重音在 2 & 4 拍" },
  { id: "none", label: "無重音" },
];

export const BEATS_PER_BAR_OPTIONS = [2, 3, 4, 6] as const;

export const BPM_MIN = 40;
export const BPM_MAX = 240;

/**
 * Whether the click on a given beat (0-based) is accented, given the mode and
 * the number of beats per bar. `beat` is the quarter-note beat index within the
 * bar, NOT the subdivision step — only on-beat steps are ever accented.
 *
 * - downbeat: only beat 0 (the bar's "1").
 * - 2and4: beats 1 and 3 (musical 2 & 4) — only meaningful in 4/4-ish meters;
 *   for meters without a beat 3 (e.g. 2 beats) it falls back to just beat 1.
 * - none: never.
 */
export function isAccented(
  beat: number,
  mode: AccentMode,
  beatsPerBar: number,
): boolean {
  if (mode === "none") return false;
  if (mode === "downbeat") return beat === 0;
  // 2and4: musical beats 2 and 4 → 0-based indices 1 and 3, but only if the
  // meter actually has them.
  return (beat === 1 || beat === 3) && beat < beatsPerBar;
}

/** A subdivision step is "on the beat" when it's the first step of a beat. */
export function isBeatStep(step: number, sub: Subdivision): boolean {
  return step % stepsPerBeat(sub) === 0;
}

/** The quarter-note beat index (within the bar) that a subdivision step lands on. */
export function beatOfStep(
  step: number,
  sub: Subdivision,
  beatsPerBar: number,
): number {
  return Math.floor(step / stepsPerBeat(sub)) % beatsPerBar;
}

/** Total subdivision steps in one bar. */
export function stepsPerBar(sub: Subdivision, beatsPerBar: number): number {
  return stepsPerBeat(sub) * beatsPerBar;
}

export interface TempoRamp {
  enabled: boolean;
  /** BPM added each time `everyBars` bars complete. */
  step: number;
  /** Ramp the tempo after this many bars. */
  everyBars: number;
  /** Never exceed this BPM. */
  max: number;
}

/**
 * The BPM after `barsCompleted` bars, starting from `startBpm`, applying a ramp
 * of `step` BPM every `everyBars` bars, capped at `max`. Pure — used both to
 * drive the live engine and to unit-test the ramp curve.
 *
 * Guards: a non-positive `everyBars` or `step<=0` (or a disabled ramp) means no
 * change, so the metronome can never divide-by-zero or run away.
 */
export function rampedBpm(
  startBpm: number,
  barsCompleted: number,
  ramp: TempoRamp,
): number {
  if (!ramp.enabled || ramp.step <= 0 || ramp.everyBars <= 0) return startBpm;
  const increments = Math.floor(barsCompleted / ramp.everyBars);
  const next = startBpm + increments * ramp.step;
  return Math.min(next, ramp.max);
}

export function clampBpm(bpm: number): number {
  if (Number.isNaN(bpm)) return BPM_MIN;
  return Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(bpm)));
}

export interface MetronomeConfig {
  bpm: number;
  beatsPerBar: number;
  subdivision: Subdivision;
  accentMode: AccentMode;
  ramp: TempoRamp;
}

// ---------------------------------------------------------------------------
// Tone.js engine wrapper (client-only; `tone` imported lazily inside start)
// ---------------------------------------------------------------------------

// Pitches/velocities for the click. Accent = higher pitch + louder.
const ACCENT_PITCH = "C5";
const ACCENT_VELOCITY = 1;
const BEAT_PITCH = "C4";
const BEAT_VELOCITY = 0.7;
const OFFBEAT_PITCH = "C4";
const OFFBEAT_VELOCITY = 0.35;

// Minimal structural types so this file's pure part needs no Tone types. The
// real instances come from the dynamic import at runtime.
type MembraneSynthLike = {
  triggerAttackRelease: (
    note: string,
    dur: string,
    time: number,
    velocity?: number,
  ) => void;
  toDestination: () => MembraneSynthLike;
  dispose: () => void;
};

/**
 * Drives the audible clicks and reports each beat for the UI. Construct it, then
 * call start() (which awaits Tone.start() — MUST be inside a user gesture). The
 * onBeat callback is invoked via Tone.getDraw() so the UI indicator stays in
 * sync with audio without calling setState from the audio callback.
 */
export class MetronomeEngine {
  private synth: MembraneSynthLike | null = null;
  private repeatId: number | null = null;
  private step = 0;
  private config: MetronomeConfig;
  private startBpm: number;
  private onBeat: (beatInBar: number, accented: boolean) => void;
  private running = false;

  constructor(
    config: MetronomeConfig,
    onBeat: (beatInBar: number, accented: boolean) => void,
  ) {
    this.config = config;
    this.startBpm = config.bpm;
    this.onBeat = onBeat;
  }

  /** Update tempo/meter/accent live without restarting (where possible). */
  setConfig(config: MetronomeConfig) {
    const meterChanged =
      config.beatsPerBar !== this.config.beatsPerBar ||
      config.subdivision !== this.config.subdivision;
    this.config = config;
    this.startBpm = config.bpm;
    return meterChanged;
  }

  get isRunning() {
    return this.running;
  }

  async start() {
    // Lazy import keeps Tone out of module scope (SSR-safe, smaller bundles).
    const Tone = await import("tone");
    // CRITICAL: resume the AudioContext from within the user gesture, before
    // starting the transport. This is the #1 "no sound" bug if skipped.
    await Tone.start();

    if (!this.synth) {
      this.synth = new Tone.MembraneSynth({
        envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.05 },
        octaves: 4,
      }).toDestination() as unknown as MembraneSynthLike;
    }

    const transport = Tone.getTransport();
    const draw = Tone.getDraw();
    transport.bpm.value = this.startBpm;

    this.step = 0;
    const sub = this.config.subdivision;

    this.repeatId = transport.scheduleRepeat((time) => {
      const cfg = this.config;
      const beat = beatOfStep(this.step, cfg.subdivision, cfg.beatsPerBar);
      const onBeatStep = isBeatStep(this.step, cfg.subdivision);
      const accented = onBeatStep && isAccented(beat, cfg.accentMode, cfg.beatsPerBar);

      // Choose pitch/velocity. Use the PASSED `time` — never Tone.now() here.
      const pitch = accented
        ? ACCENT_PITCH
        : onBeatStep
          ? BEAT_PITCH
          : OFFBEAT_PITCH;
      const velocity = accented
        ? ACCENT_VELOCITY
        : onBeatStep
          ? BEAT_VELOCITY
          : OFFBEAT_VELOCITY;
      this.synth?.triggerAttackRelease(pitch, "32n", time, velocity);

      // Drive the UI on beat steps only, synced to audio via getDraw.
      if (onBeatStep) {
        draw.schedule(() => this.onBeat(beat, accented), time);
      }

      // Advance step; on bar boundary apply the tempo ramp.
      const perBar = stepsPerBar(cfg.subdivision, cfg.beatsPerBar);
      this.step += 1;
      if (this.step % perBar === 0) {
        const barsDone = this.step / perBar;
        const next = rampedBpm(this.startBpm, barsDone, cfg.ramp);
        // Ramp at the scheduled time so tempo change is sample-accurate.
        transport.bpm.setValueAtTime(next, time);
      }
    }, sub);

    transport.start();
    this.running = true;
  }

  /** Stop playback and clear scheduled events (synth kept for fast restart). */
  async stop() {
    if (!this.running) return;
    const Tone = await import("tone");
    const transport = Tone.getTransport();
    transport.stop();
    transport.cancel();
    if (this.repeatId !== null) {
      transport.clear(this.repeatId);
      this.repeatId = null;
    }
    this.step = 0;
    this.running = false;
  }

  /** Full teardown for unmount: stop + dispose the synth. No leaks. */
  async dispose() {
    await this.stop();
    this.synth?.dispose();
    this.synth = null;
  }
}
