import { describe, it, expect } from "vitest";
import { Note, Scale } from "tonal";
import {
  LICKS,
  SCALES,
  STYLES,
  filterLicks,
  type ScaleId,
  type StyleId,
} from "./data";

// Do NOT import @coderline/alphatab here — it needs the browser (Worker/Audio
// APIs). These tests guard the DATA contract the viewer relies on; the alphaTex
// strings' renderability was verified separately against alphaTab's real importer.

const SCALE_IDS = new Set<ScaleId>(SCALES.map((s) => s.id));
const STYLE_IDS = new Set<StyleId>(STYLES.map((s) => s.id));

// The viewer ships a curated library; too few would make the two-axis filter feel
// empty. 8 is the floor the phase commits to.
const MIN_LICKS = 8;

describe("licks data integrity", () => {
  it("ships at least the minimum curated count", () => {
    expect(LICKS.length).toBeGreaterThanOrEqual(MIN_LICKS);
  });

  it("every lick id is unique", () => {
    // Ids are the React keys AND the selection key in the viewer; a duplicate
    // would make two licks share one selection slot and mis-render on switch.
    const ids = LICKS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every lick has a non-empty title and alphaTex", () => {
    // An empty alphaTex would hand alphaTab nothing to render — a blank player.
    for (const l of LICKS) {
      expect(l.title.trim().length).toBeGreaterThan(0);
      expect(l.alphaTex.trim().length).toBeGreaterThan(0);
    }
  });

  it("every scale tag is one of the known scales", () => {
    // The scale axis selector is built from SCALES; a lick tagged off-list would
    // be unreachable through that axis (filtered out by every scale button).
    for (const l of LICKS) expect(SCALE_IDS.has(l.scale)).toBe(true);
  });

  it("every style tag is one of the known styles", () => {
    // Same contract as scale, for the 曲風 axis.
    for (const l of LICKS) expect(STYLE_IDS.has(l.style)).toBe(true);
  });

  it("every tempo is a positive BPM", () => {
    // Tempo is shown to the learner and seeds the player's speed reference; a
    // non-positive tempo would be nonsense musically and in the UI.
    for (const l of LICKS) {
      expect(l.tempo).toBeGreaterThan(0);
      expect(Number.isFinite(l.tempo)).toBe(true);
    }
  });
});

describe("filterLicks two-axis filter", () => {
  it("returns everything when no axis is constrained", () => {
    expect(filterLicks(null, null)).toHaveLength(LICKS.length);
    expect(filterLicks()).toHaveLength(LICKS.length);
  });

  it("filtering by scale returns exactly the licks of that scale", () => {
    const scale: ScaleId = "minor-pentatonic";
    const got = filterLicks(scale, null);
    const expected = LICKS.filter((l) => l.scale === scale);
    expect(got).toEqual(expected);
    // Guard the WHY: the subset is non-empty AND strictly that scale, so the
    // selector actually narrows rather than returning all or nothing.
    expect(got.length).toBeGreaterThan(0);
    expect(got.every((l) => l.scale === scale)).toBe(true);
  });

  it("filtering by style returns exactly the licks of that style", () => {
    const style: StyleId = "Blues";
    const got = filterLicks(null, style);
    expect(got).toEqual(LICKS.filter((l) => l.style === style));
    expect(got.length).toBeGreaterThan(0);
    expect(got.every((l) => l.style === style)).toBe(true);
  });

  it("returns a real empty array when no lick matches both axes", () => {
    // The viewer's empty-state path depends on a true [] (not undefined/null).
    // minor-pentatonic licks are Blues/Rock only, so × Jazz yields nothing.
    const got = filterLicks("minor-pentatonic", "Jazz");
    expect(Array.isArray(got)).toBe(true);
    expect(got).toHaveLength(0);
  });

  it("both axes intersect (AND, not OR)", () => {
    const scale: ScaleId = "minor-pentatonic";
    const style: StyleId = "Blues";
    const got = filterLicks(scale, style);
    // Intersection ⊆ each single-axis subset, and every result matches BOTH.
    expect(got.every((l) => l.scale === scale && l.style === style)).toBe(true);
    expect(got.length).toBeLessThanOrEqual(filterLicks(scale, null).length);
    expect(got.length).toBeLessThanOrEqual(filterLicks(null, style).length);
  });
});

describe("scale × style coverage", () => {
  it("spans multiple scales and multiple styles", () => {
    // The two-axis index is the viewer's differentiator; a library that collapsed
    // onto one scale or one style would make the second axis pointless.
    expect(new Set(LICKS.map((l) => l.scale)).size).toBeGreaterThanOrEqual(3);
    expect(new Set(LICKS.map((l) => l.style)).size).toBeGreaterThanOrEqual(3);
  });
});

// --- theory correctness: a lick's notes must belong to its labeled scale -----
// Standard tuning open-string chromas by alphaTex string number (1 = high E …
// 6 = low E). A note at fret f on string s has chroma (OPEN[s] + f) % 12.
const OPEN_CHROMA: Record<number, number> = {
  1: 4,
  2: 11,
  3: 7,
  4: 2,
  5: 9,
  6: 4,
};

// ScaleId → tonal scale name (the key supplies the root; a trailing minor "m" is
// stripped so "Am" → A, "Dm" → D).
const TONAL_SCALE: Record<ScaleId, string> = {
  "minor-pentatonic": "minor pentatonic",
  "major-pentatonic": "major pentatonic",
  blues: "blues",
  major: "major",
  dorian: "dorian",
};

function scaleChromas(key: string, scale: ScaleId): Set<number> {
  const root = key.replace(/m$/, "");
  const notes = Scale.get(`${root} ${TONAL_SCALE[scale]}`).notes;
  return new Set(notes.map((n) => Note.chroma(n)!));
}

// Pull fret.string note tokens out of an alphaTex string. Skips durations (:8),
// rests (r), tempo, bar lines, and effect groups like {b (0 4)} / {h} — those
// have no `digit.string` form so the regex never matches them.
function lickNoteChromas(alphaTex: string): number[] {
  const out: number[] = [];
  for (const m of alphaTex.matchAll(/(\d+)\.([1-6])\b/g)) {
    out.push((OPEN_CHROMA[Number(m[2])] + Number(m[1])) % 12);
  }
  return out;
}

describe("lick notes match the labeled scale (theory correctness)", () => {
  it("every lick parses to at least one note", () => {
    // Guards the parser itself: if the token regex broke, the in-scale assertion
    // below would vacuously pass on zero notes.
    for (const l of LICKS) {
      expect(
        lickNoteChromas(l.alphaTex).length,
        `${l.id} parsed no notes`,
      ).toBeGreaterThan(0);
    }
  });

  it("a lick WITHOUT hasChromatic uses only notes of its labeled scale", () => {
    // This is the test that would have caught the shipped wrong-note bugs: the Am
    // pentatonic licks playing F# (fret 7 B-string) and the G major pentatonic
    // lick playing C#/C. A teaching tool must not present out-of-scale notes as
    // scale content.
    for (const l of LICKS) {
      if (l.hasChromatic) continue;
      const scale = scaleChromas(l.key, l.scale);
      for (const ch of lickNoteChromas(l.alphaTex)) {
        expect(
          scale.has(ch),
          `${l.id} (${l.key} ${l.scale}) has out-of-scale chroma ${ch}`,
        ).toBe(true);
      }
    }
  });

  it("a lick flagged hasChromatic genuinely leaves its scale", () => {
    // Keep the flag honest: a lick marked chromatic must actually contain an
    // out-of-scale note, else the "含半音音" badge is misleading and the flag
    // should be removed.
    for (const l of LICKS) {
      if (!l.hasChromatic) continue;
      const scale = scaleChromas(l.key, l.scale);
      const hasOut = lickNoteChromas(l.alphaTex).some((ch) => !scale.has(ch));
      expect(hasOut, `${l.id} is flagged hasChromatic but stays in scale`).toBe(
        true,
      );
    }
  });
});
