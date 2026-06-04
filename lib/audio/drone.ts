// Drone: a single sustained tone through a gain stage. Client-only — `tone` is
// imported lazily inside start() so it never loads at module scope (SSR-safe).

type SynthLike = {
  triggerAttack: (note: string, time?: number) => void;
  triggerRelease: (time?: number) => void;
  connect: (node: unknown) => SynthLike;
  dispose: () => void;
};
type GainLike = {
  toDestination: () => GainLike;
  dispose: () => void;
};

// Synth voicing for the drone. A `triangle` wave (soft, odd harmonics that roll
// off fast) gives a clean, organ-like reference tone. A `sawtooth` (every
// harmonic) sounded buzzy/harsh for a sustained tuning tone; triangle also stays
// audible at low octaves (A2 ≈ 110 Hz) where a pure sine nearly vanishes on
// laptop/phone speakers. Exported so the waveform choice is unit-testable.
export const DRONE_SYNTH_OPTIONS = {
  oscillator: { type: "triangle" as const },
  envelope: { attack: 0.05, decay: 0.1, sustain: 0.8, release: 0.3 },
};

/**
 * Holds one note on/off. start() awaits Tone.start() (MUST be in a user gesture)
 * and triggers a sustained note; stop() releases it; dispose() tears everything
 * down for unmount.
 */
export class DroneEngine {
  private synth: SynthLike | null = null;
  private gain: GainLike | null = null;
  private playing = false;

  get isPlaying() {
    return this.playing;
  }

  /** Start (or re-pitch) the sustained tone. `note` is e.g. "A2", "C3". */
  async start(note: string) {
    const Tone = await import("tone");
    // CRITICAL: resume AudioContext from the user gesture before any sound.
    await Tone.start();

    if (!this.synth) {
      // Keep the real Tone types local through .connect() (which needs a real
      // InputNode), then stash behind the minimal structural types for the rest
      // of the class so the pure-import boundary stays clean.
      const gain = new Tone.Gain(0.2).toDestination();
      const synth = new Tone.Synth(DRONE_SYNTH_OPTIONS).connect(gain);
      this.gain = gain as unknown as GainLike;
      this.synth = synth as unknown as SynthLike;
    }
    // Release any prior note before re-triggering (note change while playing).
    if (this.playing) this.synth.triggerRelease();
    this.synth.triggerAttack(note);
    this.playing = true;
  }

  async stop() {
    if (!this.playing) return;
    this.synth?.triggerRelease();
    this.playing = false;
  }

  async dispose() {
    await this.stop();
    this.synth?.dispose();
    this.gain?.dispose();
    this.synth = null;
    this.gain = null;
  }
}

// Curated octaves for a guitar drone. Default A2 ≈ open A string region.
export const DRONE_OCTAVES = [2, 3, 4] as const;
export const DEFAULT_DRONE_OCTAVE = 2;
