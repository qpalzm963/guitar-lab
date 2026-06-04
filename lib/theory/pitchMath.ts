// Frequency → note → cents mapping for the tuner. Pure music-math; no DOM.
// Two modes: "chromatic" snaps to the nearest semitone anywhere, "guitar" snaps
// only to the six open-string targets so a very flat/sharp string still reads as
// the string you're tuning instead of flipping to the adjacent semitone.

import { Note, Midi } from "tonal";
import { STANDARD_TUNING } from "./fretboard";

export type TunerMode = "chromatic" | "guitar";

// Within ±this many cents the string is considered in tune (green). 5¢ is below
// human pitch-discrimination for a sustained tone, so a "5¢ = in tune" call
// won't have the user chasing imperceptible drift.
export const IN_TUNE_CENTS = 5;

export interface PitchReading {
  frequency: number;
  midi: number;
  noteName: string;
  pitchClass: string;
  octave: number;
  cents: number;
  targetFrequency: number;
  inTune: boolean;
  /** 0..5, 0 = string 1 (high E4) … 5 = string 6 (low E2). Only in guitar mode. */
  stringIndex?: number;
}

/** Fractional MIDI number of a frequency. 440 Hz → exactly 69. */
export const freqToMidiFloat = (f: number) => 69 + 12 * Math.log2(f / 440);

/** Signed cents from frequency `f` to the (integer) `targetMidi`. */
export const centsBetween = (f: number, targetMidi: number) =>
  Math.round((freqToMidiFloat(f) - targetMidi) * 100);

// Open-string MIDI numbers, computed once. STANDARD_TUNING index already follows
// tab order (0 = high E4 … 5 = low E2), so stringIndex === tuning index.
const TUNING_MIDI: number[] = STANDARD_TUNING.map((noteName) => {
  const m = Note.midi(noteName);
  if (m == null) throw new Error(`Invalid tuning note: ${noteName}`);
  return m;
});

/** Build a reading for frequency `f` relative to a chosen target MIDI. */
function readingForTarget(
  f: number,
  targetMidi: number,
  stringIndex?: number,
): PitchReading {
  const noteName = Note.fromMidi(targetMidi);
  const cents = centsBetween(f, targetMidi);
  return {
    frequency: f,
    midi: targetMidi,
    noteName,
    pitchClass: Note.pitchClass(noteName),
    octave: Note.octave(noteName) ?? 0,
    cents,
    targetFrequency: Midi.midiToFreq(targetMidi),
    inTune: Math.abs(cents) <= IN_TUNE_CENTS,
    stringIndex,
  };
}

/**
 * Map a detected frequency to the note/cents the UI displays.
 *
 * - chromatic: nearest semitone anywhere on the scale.
 * - guitar: nearest of the six open strings. Snapping to STRINGS (not semitones)
 *   is the key UX guarantee — a low E that's a half-step flat (~80 Hz) must still
 *   read E2 / stringIndex 5 so the meter points the user back UP to E2, instead
 *   of flipping to D#2 and telling them the (correct) string is the wrong note.
 */
export function frequencyToReading(f: number, mode: TunerMode): PitchReading {
  if (mode === "guitar") {
    let bestIndex = 0;
    let bestAbsCents = Infinity;
    for (let i = 0; i < TUNING_MIDI.length; i++) {
      const c = Math.abs(centsBetween(f, TUNING_MIDI[i]));
      if (c < bestAbsCents) {
        bestAbsCents = c;
        bestIndex = i;
      }
    }
    return readingForTarget(f, TUNING_MIDI[bestIndex], bestIndex);
  }

  // chromatic: round the fractional MIDI to the nearest semitone.
  const targetMidi = Math.round(freqToMidiFloat(f));
  return readingForTarget(f, targetMidi);
}
