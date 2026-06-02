import { Note } from "tonal";

// Fretboard geometry. Pure functions, no rendering, no React.
// String index 0 = string 1 = high E (drawn as the top row).
// String index 5 = string 6 = low E (bottom row). This matches tab convention.
export const STANDARD_TUNING = ["E4", "B3", "G3", "D3", "A2", "E2"] as const;
export const DEFAULT_FRET_COUNT = 15;

/** MIDI number of a fretted note. */
export function midiAt(openNote: string, fret: number): number {
  const m = Note.midi(openNote);
  if (m == null) throw new Error(`Invalid open-string note: ${openNote}`);
  return m + fret;
}

/** Full note name with octave, e.g. "A2". Uses sharps (raw MIDI spelling). */
export function noteNameAt(openNote: string, fret: number): string {
  return Note.fromMidi(midiAt(openNote, fret));
}

/** Pitch class only, e.g. "A". */
export function pitchClassAt(openNote: string, fret: number): string {
  return Note.pitchClass(noteNameAt(openNote, fret));
}

/** Pitch-class integer 0-11 (C=0), matching tonal's Note.chroma. */
export function chromaAt(openNote: string, fret: number): number {
  return midiAt(openNote, fret) % 12;
}
