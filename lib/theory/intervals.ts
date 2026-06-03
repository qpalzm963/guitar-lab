import { Note, Interval } from "tonal";
import { STANDARD_TUNING, DEFAULT_FRET_COUNT, midiAt } from "./fretboard";
import { intervalToDegree } from "./scaleProjection";
import type { Marker } from "./types";

/**
 * The 13 intervals within one octave, with zh-TW labels mapped to tonal interval
 * names. The tritone is one row labelled 增四度/減五度 but stored as the single
 * tonal name "4A" (chroma 6) — it and "5d" share the same chroma, so picking
 * either spelling marks the same notes; "4A" keeps the # spelling teachers expect.
 */
export const INTERVALS: { id: string; label: string }[] = [
  { id: "1P", label: "完全一度 P1" },
  { id: "2m", label: "小二度 m2" },
  { id: "2M", label: "大二度 M2" },
  { id: "3m", label: "小三度 m3" },
  { id: "3M", label: "大三度 M3" },
  { id: "4P", label: "完全四度 P4" },
  { id: "4A", label: "增四度減五度(三全音) TT" },
  { id: "5P", label: "完全五度 P5" },
  { id: "6m", label: "小六度 m6" },
  { id: "6M", label: "大六度 M6" },
  { id: "7m", label: "小七度 m7" },
  { id: "7M", label: "大七度 M7" },
  { id: "8P", label: "完全八度 P8" },
];

export interface IntervalProjectionOptions {
  tuning?: readonly string[];
  fromFret?: number;
  toFret?: number;
}

/**
 * Project a root and one interval-from-the-root onto the fretboard as markers.
 * Marks EVERY occurrence of the root (role "root", red) and every occurrence of
 * the interval note (role "custom", blue, labelled with its degree e.g. "3",
 * "5", "b7"). Matching is by chroma (0-11) so enharmonic spelling never misses;
 * the displayed pitchClass uses tonal's transposed spelling (e.g. "C#", "Bb").
 *
 * The interval note's chroma is computed from the interval, not from re-deriving
 * a scale, so unison/octave (chroma == root chroma) produce only root markers —
 * there is no distinct interval note to add. Unknown interval names → [].
 */
export function intervalMarkers(
  root: string,
  intervalName: string,
  opts: IntervalProjectionOptions = {},
): Marker[] {
  const tuning = opts.tuning ?? STANDARD_TUNING;
  const fromFret = opts.fromFret ?? 0;
  const toFret = opts.toFret ?? DEFAULT_FRET_COUNT;

  const rootChroma = Note.chroma(root);
  const ivl = Interval.get(intervalName);
  if (rootChroma == null || ivl.empty || ivl.chroma == null) return [];

  // The interval note's spelling and chroma come from transposing the root.
  const intervalNote = Note.transpose(root, intervalName);
  const intervalChroma = Note.chroma(intervalNote);
  if (intervalChroma == null) return [];
  const intervalPc = Note.pitchClass(intervalNote);
  const degree = intervalToDegree(intervalName);

  const markers: Marker[] = [];
  tuning.forEach((open, stringIdx) => {
    for (let fret = fromFret; fret <= toFret; fret++) {
      const midi = midiAt(open, fret);
      const chroma = midi % 12;
      const octave = Math.floor(midi / 12) - 1;
      if (chroma === rootChroma) {
        markers.push({
          string: stringIdx,
          fret,
          pitchClass: Note.pitchClass(root),
          octave,
          degree: "1",
          role: "root",
          isRoot: true,
        });
      } else if (chroma === intervalChroma) {
        // Only reached when the interval note differs from the root (so unison /
        // octave add no extra markers — their chroma equals the root's).
        markers.push({
          string: stringIdx,
          fret,
          pitchClass: intervalPc,
          octave,
          degree,
          role: "custom",
          isRoot: false,
        });
      }
    }
  });
  return markers;
}
