// Shared music-theory + fretboard types.
// The Marker is the one first-class data model the SVG fretboard renders.
// Shapes (scale / CAGED / arpeggio) are generators that output Marker[];
// the rendering component stays dumb and never computes theory itself.

export type NoteRole = "root" | "scale" | "reference" | "custom";

export interface Marker {
  /** String index. 0 = string 1 (high E, top row). 5 = string 6 (low E, bottom). */
  string: number;
  /** Fret number. 0 = open string. */
  fret: number;
  /** Display spelling of the pitch class, e.g. "C", "F#", "Bb". */
  pitchClass: string;
  /** Octave number (scientific pitch), optional. */
  octave?: number;
  /** Scale/chord degree label, e.g. "1", "b3", "5", "b7". */
  degree?: string;
  role: NoteRole;
  /** Optional override label; falls back to pitchClass/degree at render time. */
  label?: string;
  isRoot: boolean;
}
