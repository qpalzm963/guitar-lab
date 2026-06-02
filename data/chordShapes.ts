// A small, self-managed set of common guitar fingerings. NOT a chord library.
// Each shape lists one fret per string.
//
//   frets[i]: index 0 = string 1 (high E) … index 5 = string 6 (low E).
//             -1 = muted (x), 0 = open (o), >0 = fret number.
//   fingers[i] (optional): fretting-hand finger (1-4) for that string; 0 = none.
//
// `id` keys a shape to a (root, type) pair so ChordExplorer can show the box
// when the current selection has a curated fingering. `type` matches CHORD_TYPES
// ids in lib/theory/chords.ts ("" = major, "m" = minor, "7", "m7", "maj7").

export interface ChordShape {
  id: string;
  /** Display name, e.g. "C", "Am", "F". */
  name: string;
  /** Root pitch class, matches NOTES in ChordExplorer (sharps), e.g. "C", "F". */
  root: string;
  /** Chord type id from CHORD_TYPES, e.g. "" (major), "m", "7". */
  type: string;
  /** One fret per string; index 0 = high E … 5 = low E. -1 muted, 0 open. */
  frets: number[];
  /** Optional finger per string (1-4), 0 = open/none. Same indexing as frets. */
  fingers?: number[];
}

export const CHORD_SHAPES: ChordShape[] = [
  // Open major triads
  { id: "C", name: "C", root: "C", type: "", frets: [0, 1, 0, 2, 3, -1], fingers: [0, 1, 0, 2, 3, 0] },
  { id: "A", name: "A", root: "A", type: "", frets: [0, 2, 2, 2, 0, -1], fingers: [0, 3, 2, 1, 0, 0] },
  { id: "G", name: "G", root: "G", type: "", frets: [3, 0, 0, 0, 2, 3], fingers: [3, 0, 0, 0, 1, 2] },
  { id: "E", name: "E", root: "E", type: "", frets: [0, 0, 1, 2, 2, 0], fingers: [0, 0, 1, 3, 2, 0] },
  { id: "D", name: "D", root: "D", type: "", frets: [2, 3, 2, 0, -1, -1], fingers: [1, 3, 2, 0, 0, 0] },

  // Open minor triads
  { id: "Am", name: "Am", root: "A", type: "m", frets: [0, 1, 2, 2, 0, -1], fingers: [0, 1, 3, 2, 0, 0] },
  { id: "Em", name: "Em", root: "E", type: "m", frets: [0, 0, 0, 2, 2, 0], fingers: [0, 0, 0, 3, 2, 0] },
  { id: "Dm", name: "Dm", root: "D", type: "m", frets: [1, 3, 2, 0, -1, -1], fingers: [1, 3, 2, 0, 0, 0] },

  // Open dominant sevenths
  { id: "A7", name: "A7", root: "A", type: "7", frets: [0, 2, 0, 2, 0, -1], fingers: [0, 2, 0, 1, 0, 0] },
  { id: "E7", name: "E7", root: "E", type: "7", frets: [0, 0, 1, 0, 2, 0], fingers: [0, 0, 1, 0, 2, 0] },

  // Barre chords (E-shape, low E root)
  { id: "F", name: "F", root: "F", type: "", frets: [1, 1, 2, 3, 3, 1], fingers: [1, 1, 2, 4, 3, 1] },
  // Barre chord (A-shape, A-string root)
  { id: "Bm", name: "Bm", root: "B", type: "m", frets: [2, 3, 4, 4, 2, -1], fingers: [1, 2, 4, 3, 1, 0] },
];

/** Find the curated shape for a (root, type) selection, or undefined. */
export function findChordShape(
  root: string,
  type: string,
): ChordShape | undefined {
  return CHORD_SHAPES.find((s) => s.root === root && s.type === type);
}
