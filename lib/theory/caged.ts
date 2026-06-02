import { Chord, Note } from "tonal";
import { STANDARD_TUNING, midiAt } from "./fretboard";
import { intervalToDegree } from "./scaleProjection";
import type { Marker } from "./types";

/**
 * CAGED system: the 5 movable chord shapes (C, A, G, E, D) that tile the neck.
 *
 * Each shape is a *template* derived from the corresponding open chord voicing
 * (the same voicings used in data/chordShapes.ts). To play an arbitrary root R
 * with a given shape, the template is shifted up by a barre offset so its root
 * lands on R; open strings (fret 0) become barred at the offset, muted strings
 * stay muted. The shape's fret window is then [min, max] of the shifted frets.
 *
 * Verified against references (C major):
 *   C-shape 0–3, A-shape 3–5, G-shape 5–8, E-shape 8–10, D-shape 10–13.
 * Adjacent shapes share a fret (3, 5, 8, 10) — they connect/overlap as CAGED
 * shapes must. G major's E-shape root sits on the low E string at fret 3.
 * Refs: appliedguitartheory.com/lessons/caged-guitar-theory-system,
 *       fretboardknowledge.com C-major CAGED, premierguitar guitarists-guide-to-caged.
 *
 * Minor uses the SAME 5 neck regions as major: a CAGED minor shape is its major
 * counterpart with the 3rd flatted one fret, which never reaches outside the
 * major shape's fret window. So we derive every window from the major templates
 * and only swap the chord chroma set when placing markers — this keeps the
 * windows contiguous (a separate set of minor voicings would leave gaps because
 * the stretchy Cm/Gm forms drop their filler notes).
 * Ref: appliedguitartheory.com/lessons/minor-caged-system.
 */

export type CagedShape = "C" | "A" | "G" | "E" | "D";
export type CagedQuality = "major" | "minor";

// CAGED order up the neck.
const CAGED_ORDER: CagedShape[] = ["C", "A", "G", "E", "D"];

// Open-chord templates, index 0 = string 1 (high E) … 5 = string 6 (low E).
// -1 = muted. These mirror the open voicings in data/chordShapes.ts.
interface Template {
  /** Open voicing frets, index 0 = high E … 5 = low E. -1 muted. */
  frets: number[];
  /** Pitch class the open template is rooted on (e.g. "C" for the C shape). */
  rootPc: string;
}

// The CAGED windows come from the major open voicings for BOTH qualities (see
// header note): the open strings, when barred up, fill the regions so adjacent
// shapes stay contiguous.
const SHAPE_TEMPLATES: Record<CagedShape, Template> = {
  C: { frets: [0, 1, 0, 2, 3, -1], rootPc: "C" },
  A: { frets: [0, 2, 2, 2, 0, -1], rootPc: "A" },
  G: { frets: [3, 0, 0, 0, 2, 3], rootPc: "G" },
  E: { frets: [0, 0, 1, 2, 2, 0], rootPc: "E" },
  D: { frets: [2, 3, 2, 0, -1, -1], rootPc: "D" },
};

/** Barre offset (0–11) that shifts a template's root pitch class onto `root`. */
function shiftFor(templateRootPc: string, root: string): number {
  const tgt = Note.chroma(root);
  const base = Note.chroma(templateRootPc);
  if (tgt == null || base == null) return 0;
  return ((tgt - base) % 12 + 12) % 12;
}

export interface CagedWindow {
  shape: CagedShape;
  from: number;
  to: number;
}

/**
 * The 5 CAGED fret windows for `root`, ordered ascending up the neck. Windows
 * are quality-independent (minor occupies the same regions — see header note);
 * the lowest window comes first, which is a different shape depending on `root`.
 * The windows are the basis both for CAGED chord rendering (here) and for the
 * major-scale "5 positions" in positions.ts.
 */
export function cagedWindows(root: string): CagedWindow[] {
  const wins = CAGED_ORDER.map((shape) => {
    const t = SHAPE_TEMPLATES[shape];
    const shift = shiftFor(t.rootPc, root);
    const moved = t.frets.filter((f) => f >= 0).map((f) => f + shift);
    return { shape, from: Math.min(...moved), to: Math.max(...moved) };
  });
  return wins.sort((a, b) => a.from - b.from || a.to - b.to);
}

export interface CagedShapeResult extends CagedWindow {
  markers: Marker[];
}

/**
 * For each of the 5 CAGED shapes, the chord-tone markers that fall inside that
 * shape's fret window. Matching is by chroma (enharmonic-robust), spelling and
 * degrees come from tonal — identical approach to chords.ts so the two stay
 * consistent. The root keeps role "root" (red); other tones use "scale".
 */
export function cagedShapes(
  root: string,
  quality: CagedQuality = "major",
): CagedShapeResult[] {
  const symbol = quality === "minor" ? "m" : "";
  const chord = Chord.get(`${root}${symbol}`);
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

  return cagedWindows(root).map((win) => {
    const markers: Marker[] = [];
    STANDARD_TUNING.forEach((open, stringIdx) => {
      for (let fret = win.from; fret <= win.to; fret++) {
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
    return { ...win, markers };
  });
}
