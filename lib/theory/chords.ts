import { Chord, Note } from "tonal";
import { STANDARD_TUNING, DEFAULT_FRET_COUNT, midiAt } from "./fretboard";
import { intervalToDegree } from "./scaleProjection";
import type { Marker } from "./types";

/**
 * Curriculum-relevant chord types. `type` is the tonal chord symbol appended to
 * the root (e.g. "C" + "maj7" → "Cmaj7", "C" + "" → "C major triad). Every
 * symbol here is verified to resolve in tonal (Chord.get(...).empty === false).
 */
export const CHORD_TYPES: { id: string; label: string }[] = [
  { id: "", label: "大三和弦 Major" },
  { id: "m", label: "小三和弦 Minor" },
  { id: "maj7", label: "大七 Maj7" },
  { id: "7", label: "屬七 Dom7" },
  { id: "m7", label: "小七 m7" },
  { id: "m7b5", label: "半減七 m7b5" },
  { id: "dim7", label: "減七 dim7" },
  { id: "sus2", label: "掛二 sus2" },
  { id: "sus4", label: "掛四 sus4" },
  { id: "aug", label: "增三 Aug" },
  { id: "6", label: "大六 6" },
  { id: "add9", label: "加九 add9" },
];

export interface ChordProjectionOptions {
  tuning?: readonly string[];
  fromFret?: number;
  toFret?: number;
}

/**
 * Project a chord's tones onto the fretboard as a list of markers.
 * Matching is done by chroma (0-11) so enharmonic spelling never causes misses;
 * the displayed pitchClass uses the chord's own spelling (e.g. "Bb" not "A#").
 * Degrees come from the chord intervals via intervalToDegree (1/3/5/7…), and
 * roles reuse the scale palette: "root" (red) for the root, "scale" otherwise.
 */
export function chordMarkers(
  root: string,
  type: string,
  opts: ChordProjectionOptions = {},
): Marker[] {
  const tuning = opts.tuning ?? STANDARD_TUNING;
  const fromFret = opts.fromFret ?? 0;
  const toFret = opts.toFret ?? DEFAULT_FRET_COUNT;

  const chord = Chord.get(`${root}${type}`);
  if (chord.empty || chord.notes.length === 0) return [];

  const rootChroma = Note.chroma(root);
  const degreeByChroma = new Map<number, string>();
  const spellingByChroma = new Map<number, string>();
  chord.notes.forEach((n, i) => {
    const c = Note.chroma(n);
    if (c == null) return;
    degreeByChroma.set(c, intervalToDegree(chord.intervals[i]));
    spellingByChroma.set(c, Note.pitchClass(n));
  });

  const markers: Marker[] = [];
  tuning.forEach((open, stringIdx) => {
    for (let fret = fromFret; fret <= toFret; fret++) {
      const midi = midiAt(open, fret);
      const chroma = midi % 12;
      if (!degreeByChroma.has(chroma)) continue;
      const isRoot = chroma === rootChroma;
      markers.push({
        string: stringIdx,
        fret,
        pitchClass: spellingByChroma.get(chroma)!,
        octave: Math.floor(midi / 12) - 1,
        degree: degreeByChroma.get(chroma),
        role: isRoot ? "root" : "scale",
        isRoot,
      });
    }
  });
  return markers;
}
