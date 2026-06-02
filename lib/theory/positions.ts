import { Note } from "tonal";
import { chromaAt } from "./fretboard";
import { cagedWindows } from "./caged";

/**
 * Scale positions ("把位") as fret windows the player can box the view into.
 *
 * Two well-defined systems are exposed, chosen per scale:
 *
 *  - Pentatonic (minor & major): the 5 standard boxes. Minor-pentatonic boxes
 *    are 2-notes-per-string shapes anchored to the root on the low-E string and
 *    stacked monotonically up the neck. Major pentatonic reuses the same boxes
 *    via its relative minor (a major key shares all 5 pentatonic boxes with the
 *    minor key a minor-3rd below, e.g. C major pent ≡ A minor pent).
 *    Verified: A minor pentatonic box 1 = frets 5–8 (root A on the low E at
 *    fret 5). Ref: appliedguitartheory.com/lessons/a-minor-pentatonic-scale,
 *    fretjam.com/pentatonic-scale-patterns.
 *
 *  - Major scale and its modes: the 5 CAGED-aligned positions (NOT 3-notes-per-
 *    string). We deliberately reuse the exact CAGED chord windows (lib/theory/
 *    caged.ts) so the scale "把位" and the CAGED view share one mental model and
 *    one verified anchor math, rather than introducing a second, independent
 *    position system. A mode's positions use the parent major key's windows
 *    shifted to the mode's own tonic via its relative major.
 *
 * Anything else (blues, harmonic/melodic minor) has no single canonical box
 * system, so scalePositions returns [] and the UI shows whole-neck only.
 */

export interface ScalePosition {
  index: number;
  label: string;
  from: number;
  to: number;
}

// Minor-pentatonic scale-degree semitone offsets from the root.
const MINOR_PENT_OFFSETS = [0, 3, 5, 7, 10];

// Modes → semitones from the mode tonic UP to the parent major (Ionian) tonic.
// e.g. D dorian's parent major is C, which is 10 semitones above D.
const MODE_TO_MAJOR: Record<string, number> = {
  ionian: 0,
  major: 0,
  dorian: 10,
  phrygian: 8,
  lydian: 7,
  mixolydian: 5,
  aeolian: 3,
  minor: 3,
  locrian: 1,
};

function pc(chroma: number): string {
  return Note.fromMidi(60 + chroma).replace(/\d+$/, "");
}

/**
 * The 5 pentatonic boxes for a *minor* pentatonic root, as fret windows.
 * Boxes are anchored to the root on the low-E string (string index 5) in frets
 * 1–12, then each subsequent box starts on the next pentatonic degree up the
 * low-E string (monotonic). Each box is the 2-notes-per-string shape: per string
 * the two scale notes whose lower note is the smallest fret ≥ (anchor − 1).
 */
function minorPentBoxes(minorRoot: string): ScalePosition[] {
  const rc = Note.chroma(minorRoot);
  if (rc == null) return [];
  const inScale = (chroma: number) =>
    MINOR_PENT_OFFSETS.some((o) => (rc + o) % 12 === chroma);

  // Box 1 anchor: lowest low-E fret in 1..12 that is the root.
  let base: number | null = null;
  for (let f = 1; f <= 12; f++) {
    if (chromaAt("E2", f) === rc) {
      base = f;
      break;
    }
  }
  if (base == null) return [];

  // Ascending anchors on the low E: root, then next 4 pentatonic notes upward.
  const anchors = [base];
  for (let f = base + 1; anchors.length < 5; f++) {
    if (inScale(chromaAt("E2", f))) anchors.push(f);
  }

  return anchors.map((anchor, i) => {
    const used: number[] = [];
    for (let s = 0; s < 6; s++) {
      const open = STRING_OPEN[s];
      const notes: number[] = [];
      for (let fr = Math.max(0, anchor - 1); fr <= anchor + 5; fr++) {
        if (inScale(chromaAt(open, fr))) notes.push(fr);
      }
      notes.slice(0, 2).forEach((fr) => used.push(fr));
    }
    return {
      index: i,
      label: `第${i + 1}把位`,
      from: Math.min(...used),
      to: Math.max(...used),
    };
  });
}

// Standard-tuning open strings, index 0 = high E … 5 = low E (mirrors fretboard).
const STRING_OPEN = ["E4", "B3", "G3", "D3", "A2", "E2"] as const;

/**
 * Position windows for a scale, or [] if the scale has no canonical box system.
 * `scaleName` matches the ids used in FretboardExplorer's SCALES list.
 */
export function scalePositions(
  root: string,
  scaleName: string,
): ScalePosition[] {
  if (Note.chroma(root) == null) return [];

  if (scaleName === "minor pentatonic") {
    return minorPentBoxes(root);
  }
  if (scaleName === "major pentatonic") {
    // Major pent shares the 5 boxes of the relative minor (minor-3rd below =
    // +9 semitones). Anchor the boxes there; the windows are identical.
    const relMinor = pc((Note.chroma(root)! + 9) % 12);
    return minorPentBoxes(relMinor);
  }

  // Major scale + modes → CAGED-aligned 5 positions.
  if (scaleName in MODE_TO_MAJOR) {
    const parentMajor = pc((Note.chroma(root)! + MODE_TO_MAJOR[scaleName]) % 12);
    return cagedWindows(parentMajor).map((w, i) => ({
      index: i,
      label: `第${i + 1}把位`,
      from: w.from,
      to: w.to,
    }));
  }

  // No canonical position system (blues, harmonic/melodic minor): whole-neck only.
  return [];
}
