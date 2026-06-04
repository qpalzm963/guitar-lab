// Note/interval/chord player: pure note-name math (tonal) + a thin Tone.js
// engine wrapper.
//
// The top half is PURE (only `tonal`, no `tone` import) so it is unit-testable
// in node without a browser AudioContext. The bottom half (NotePlayer) wraps
// Tone.js and is only ever constructed inside client components from a user
// gesture. `tone` is imported dynamically inside ensureReady() so it NEVER loads
// at module scope — keeping it out of SSR/static export and out of every bundle
// that doesn't actually play sound.

import { Note, Chord } from "tonal";

// ---------------------------------------------------------------------------
// Pure note-name helpers (only tonal — safe to import anywhere / test in node)
// ---------------------------------------------------------------------------

/**
 * The two notes (root + transposed) for an interval, each WITH octave.
 * `intervalName` is tonal interval shorthand, e.g. "3M", "5P", "4A", "8P".
 * tonal parses flats/double-flats directly, so no enharmonic pre-mapping is
 * needed for the root (e.g. "Bb", "Db" pass straight through).
 *
 * Examples: ("C","3M")→["C4","E4"]; ("Bb","5P")→["Bb4","F5"];
 *           ("C","4A")→["C4","F#4"]; ("C","8P")→["C4","C5"].
 */
export function intervalNotes(
  root: string,
  intervalName: string,
  octave = 4,
): [string, string] {
  const rootNote = `${root}${octave}`;
  return [rootNote, Note.transpose(rootNote, intervalName)];
}

/**
 * The notes of a chord, each WITH an ascending octave. `Chord.get(...).notes`
 * returns BARE pitch-classes (no octave); we attach octaves so the chord sounds
 * as a stacked voicing rather than collapsing into one octave.
 *
 * Octave rule (CRITICAL): start at `octave`; for each subsequent pitch-class,
 * compare its LETTER (C,D,E,F,G,A,B) — not chroma — to the previous note's
 * letter; if it didn't ascend, the pitch wrapped past B, so bump the running
 * octave by 1. (Letter, not chroma: an enharmonic like Cb has chroma 11 yet its
 * letter C has already wrapped — comparing chroma would wrongly keep it low, so
 * e.g. Abm would sound its 3rd a 6th BELOW the root.) This keeps each note above
 * the last — e.g. add9's 9th lands in the next octave (D5), not a 2nd below.
 *
 * Enharmonic spellings are preserved as tonal returns them (e.g. dim7 keeps the
 * double-flat "Bbb4"); we never normalize to a "nicer" enharmonic.
 *
 * Examples: ("C","maj7")→["C4","E4","G4","B4"]; ("C","add9")→["C4","E4","G4","D5"];
 *           ("C","dim7")→["C4","Eb4","Gb4","Bbb4"]; ("Bb","m7")→["Bb4","Db5","F5","Ab5"].
 */
// Letter → diatonic step (C=0 … B=6). Octave stacking keys off the note LETTER,
// not chroma, so enharmonic spellings (Cb, Fb, E#) wrap octaves correctly.
const LETTER_STEP: Record<string, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
};

export function chordNotes(root: string, type: string, octave = 4): string[] {
  const pcs = Chord.get(`${root}${type}`).notes;
  let runningOctave = octave;
  let prevStep = -1;
  return pcs.map((pc) => {
    const step = LETTER_STEP[pc[0]] ?? 0; // letter only — spelling-aware
    // Letter didn't ascend ⇒ we crossed an octave boundary; bump up.
    if (prevStep >= 0 && step <= prevStep) runningOctave += 1;
    prevStep = step;
    return `${pc}${runningOctave}`;
  });
}

export type PlayMode = "ascending" | "descending" | "together";

// ---------------------------------------------------------------------------
// Tone.js engine wrapper (client-only; `tone` imported lazily inside methods)
// ---------------------------------------------------------------------------

// Minimal structural types so this file's pure part needs no Tone types. The
// real instances come from the dynamic import at runtime.
type PolySynthLike = {
  triggerAttackRelease: (note: string, dur: string, time?: number) => void;
  releaseAll: () => void;
  connect: (node: unknown) => PolySynthLike;
  dispose: () => void;
};
type GainLike = {
  toDestination: () => GainLike;
  dispose: () => void;
};

/** Default seconds between successive notes in ascending/descending playback. */
const DEFAULT_GAP = 0.6;
const DEFAULT_DURATION = "8n";
const GAIN = 0.3;

/**
 * Plays single notes, intervals (two notes), or chords through a shared
 * PolySynth → Gain → destination chain. Construct it, then call any play method
 * (which awaits Tone.start() — MUST be inside a user gesture). The synth is
 * built once and reused; dispose() tears it down for unmount.
 */
export class NotePlayer {
  private synth: PolySynthLike | null = null;
  private gain: GainLike | null = null;

  /**
   * Lazily import Tone, resume the AudioContext (the #1 "no sound" bug if
   * skipped), and build the synth chain once. Returns Tone so callers can use
   * Tone.now() for scheduling.
   */
  private async ensureReady() {
    const Tone = await import("tone");
    // CRITICAL: resume the AudioContext from within the user gesture.
    await Tone.start();

    if (!this.synth) {
      // Keep real Tone types local through .connect() (which needs a real
      // InputNode), then stash behind the minimal structural types so the
      // pure-import boundary stays clean.
      const gain = new Tone.Gain(GAIN).toDestination();
      const synth = new Tone.PolySynth(Tone.Synth).connect(gain);
      this.gain = gain as unknown as GainLike;
      this.synth = synth as unknown as PolySynthLike;
    }
    return Tone;
  }

  /** Play one note. `note` is e.g. "C4", "F#4", "Bbb4". */
  async playNote(note: string, duration = DEFAULT_DURATION): Promise<void> {
    const Tone = await this.ensureReady();
    this.synth?.triggerAttackRelease(note, duration, Tone.now());
  }

  /**
   * Play several notes ascending (default), descending, or together. Releases
   * any in-flight voices first so rapid re-clicks don't stack. Scheduling uses
   * Tone.now() (no Transport — matches Drone/this file's Transport-free design).
   */
  async playNotes(
    notes: string[],
    mode: PlayMode = "ascending",
    opts?: { gap?: number; duration?: string },
  ): Promise<void> {
    // Drop any currently-sounding voices before re-triggering.
    await this.stop();
    const Tone = await this.ensureReady();
    const gap = opts?.gap ?? DEFAULT_GAP;
    const duration = opts?.duration ?? DEFAULT_DURATION;
    const now = Tone.now();

    if (mode === "together") {
      for (const note of notes) {
        this.synth?.triggerAttackRelease(note, duration, now);
      }
      return;
    }

    const ordered = mode === "descending" ? [...notes].reverse() : notes;
    ordered.forEach((note, i) => {
      this.synth?.triggerAttackRelease(note, duration, now + i * gap);
    });
  }

  /** Release all sounding voices (synth kept for fast replay). */
  async stop(): Promise<void> {
    this.synth?.releaseAll();
  }

  /** Full teardown for unmount: stop + dispose the synth and gain. No leaks. */
  async dispose(): Promise<void> {
    await this.stop();
    this.synth?.dispose();
    this.gain?.dispose();
    this.synth = null;
    this.gain = null;
  }
}
