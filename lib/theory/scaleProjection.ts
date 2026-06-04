import { Scale, Note, Interval } from "tonal";
import { STANDARD_TUNING, DEFAULT_FRET_COUNT, midiAt } from "./fretboard";
import type { Marker } from "./types";

/**
 * Convert a tonal interval (e.g. "3m", "5P", "7m") to a scale-degree label
 * with accidentals relative to the major scale ("3", "b3", "5", "b7", "#4").
 * Uses the interval's alteration so it is enharmonically robust.
 */
export function intervalToDegree(ivl: string): string {
  const { num, alt } = Interval.get(ivl);
  // Interval.get on junk yields num: NaN (not null), and NaN == null is false, so
  // guard both — otherwise ((NaN-1)%7)+1 = NaN would render the label "NaN".
  if (num == null || Number.isNaN(num)) return ivl;
  const degNum = ((num - 1) % 7) + 1;
  const acc = !alt ? "" : alt < 0 ? "b".repeat(-alt) : "#".repeat(alt);
  return `${acc}${degNum}`;
}

export interface ProjectionOptions {
  tuning?: readonly string[];
  fromFret?: number;
  toFret?: number;
}

/**
 * Project a scale onto the fretboard as a list of markers.
 * Matching is done by chroma (0-11) so enharmonic spelling never causes misses;
 * the displayed pitchClass uses the scale's own spelling (e.g. "Bb" not "A#").
 */
export function scaleMarkers(
  root: string,
  scaleName: string,
  opts: ProjectionOptions = {},
): Marker[] {
  const tuning = opts.tuning ?? STANDARD_TUNING;
  const fromFret = opts.fromFret ?? 0;
  const toFret = opts.toFret ?? DEFAULT_FRET_COUNT;

  const scale = Scale.get(`${root} ${scaleName}`);
  if (scale.empty || scale.notes.length === 0) return [];

  const rootChroma = Note.chroma(root);
  const degreeByChroma = new Map<number, string>();
  const spellingByChroma = new Map<number, string>();
  scale.notes.forEach((n, i) => {
    const c = Note.chroma(n);
    if (c == null) return;
    degreeByChroma.set(c, intervalToDegree(scale.intervals[i]));
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
