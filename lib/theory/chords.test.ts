import { describe, it, expect } from "vitest";
import { Chord, Note } from "tonal";
import { chordMarkers, CHORD_TYPES } from "./chords";
import type { Marker } from "./types";

const chromaSet = (markers: Marker[]) =>
  new Set(markers.map((m) => Note.chroma(m.pitchClass)));
const expectedChromas = (notes: string[]) =>
  new Set(notes.map((n) => Note.chroma(n)));

// Map each marker's pitch class to its degree, deduped — lets us assert the
// chord's interval structure (1/3/5/7) regardless of how many times each tone
// recurs across the neck.
const degreeByChroma = (markers: Marker[]) => {
  const m = new Map<number, string>();
  for (const mk of markers) m.set(Note.chroma(mk.pitchClass)!, mk.degree ?? "");
  return m;
};

describe("CHORD_TYPES resolve in tonal", () => {
  // Guard: every offered chord type must actually produce notes, otherwise the
  // UI would silently render an empty fretboard for that selection.
  it.each(CHORD_TYPES)("C$id is a real chord", ({ id }) => {
    const chord = Chord.get(`C${id}`);
    expect(chord.empty).toBe(false);
    expect(chord.notes.length).toBeGreaterThan(0);
  });
});

describe("chordMarkers", () => {
  it("Cmaj7 tones = {C E G B} with degrees 1/3/5/7", () => {
    const markers = chordMarkers("C", "maj7");
    expect(chromaSet(markers)).toEqual(expectedChromas(["C", "E", "G", "B"]));
    const deg = degreeByChroma(markers);
    expect(deg.get(Note.chroma("C")!)).toBe("1");
    expect(deg.get(Note.chroma("E")!)).toBe("3");
    expect(deg.get(Note.chroma("G")!)).toBe("5");
    expect(deg.get(Note.chroma("B")!)).toBe("7");
  });

  it("C minor = {C Eb G} with degrees 1/b3/5", () => {
    const markers = chordMarkers("C", "m");
    expect(chromaSet(markers)).toEqual(expectedChromas(["C", "Eb", "G"]));
    const deg = degreeByChroma(markers);
    expect(deg.get(Note.chroma("C")!)).toBe("1");
    expect(deg.get(Note.chroma("Eb")!)).toBe("b3");
    expect(deg.get(Note.chroma("G")!)).toBe("5");
  });

  it("Cm7b5 = {C Eb Gb Bb} with degrees 1/b3/b5/b7", () => {
    const markers = chordMarkers("C", "m7b5");
    expect(chromaSet(markers)).toEqual(
      expectedChromas(["C", "Eb", "Gb", "Bb"]),
    );
    const deg = degreeByChroma(markers);
    expect(deg.get(Note.chroma("C")!)).toBe("1");
    expect(deg.get(Note.chroma("Eb")!)).toBe("b3");
    expect(deg.get(Note.chroma("Gb")!)).toBe("b5");
    expect(deg.get(Note.chroma("Bb")!)).toBe("b7");
  });

  it("C7 (dominant) carries a b7, not a major 7", () => {
    // The b7 is what makes a dominant chord — distinct from Cmaj7's natural 7.
    const deg = degreeByChroma(chordMarkers("C", "7"));
    expect(deg.get(Note.chroma("Bb")!)).toBe("b7");
    expect(deg.has(Note.chroma("B")!)).toBe(false);
  });

  it("every root marker shares the root chroma and is degree 1", () => {
    const roots = chordMarkers("A", "m").filter((m) => m.isRoot);
    expect(roots.length).toBeGreaterThan(0);
    for (const m of roots) {
      expect(Note.chroma(m.pitchClass)).toBe(Note.chroma("A"));
      expect(m.degree).toBe("1");
      expect(m.role).toBe("root");
    }
  });

  it("non-root chord tones use role 'scale' (root stays red)", () => {
    const nonRoot = chordMarkers("C", "").filter((m) => !m.isRoot);
    expect(nonRoot.length).toBeGreaterThan(0);
    for (const m of nonRoot) expect(m.role).toBe("scale");
  });

  it("returns empty for an unknown chord type", () => {
    expect(chordMarkers("C", "not-a-chord")).toEqual([]);
  });
});
