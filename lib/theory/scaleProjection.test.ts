import { describe, it, expect } from "vitest";
import { Note } from "tonal";
import { scaleMarkers, intervalToDegree } from "./scaleProjection";
import type { Marker } from "./types";

const chromaSet = (markers: Marker[]) =>
  new Set(markers.map((m) => Note.chroma(m.pitchClass)));
const expectedChromas = (notes: string[]) =>
  new Set(notes.map((n) => Note.chroma(n)));
// The unique displayed spellings (pitchClass), independent of how often each
// recurs across the neck. This pins the actual letter+accidental the teacher
// sees, not just the chroma — the whole point of the curated root set.
const spellingSet = (markers: Marker[]) =>
  new Set(markers.map((m) => m.pitchClass));

describe("intervalToDegree", () => {
  it("maps interval qualities to degree accidentals", () => {
    expect(intervalToDegree("1P")).toBe("1");
    expect(intervalToDegree("3M")).toBe("3");
    expect(intervalToDegree("3m")).toBe("b3");
    expect(intervalToDegree("5P")).toBe("5");
    expect(intervalToDegree("7m")).toBe("b7");
  });

  it("emits a sharp for an augmented interval (lydian's #4)", () => {
    // The alt>0 (sharp) branch is otherwise only exercised indirectly; pin it so a
    // regression that dropped the # or emitted a b would fail loudly.
    expect(intervalToDegree("4A")).toBe("#4");
  });

  it("returns the input unchanged for an unparseable interval (never 'NaN')", () => {
    // Interval.get('garbage').num is NaN (not null); the guard must catch NaN so
    // the degree never renders the literal string 'NaN'.
    expect(intervalToDegree("garbage")).toBe("garbage");
  });
});

describe("scaleMarkers", () => {
  it("A minor pentatonic = {A C D E G}", () => {
    expect(chromaSet(scaleMarkers("A", "minor pentatonic"))).toEqual(
      expectedChromas(["A", "C", "D", "E", "G"]),
    );
  });

  it("G major has 7 pitch classes and contains F#", () => {
    const chromas = chromaSet(scaleMarkers("G", "major"));
    expect(chromas.size).toBe(7);
    expect(chromas.has(Note.chroma("F#"))).toBe(true);
  });

  it("every root marker shares the root chroma and is degree 1", () => {
    const roots = scaleMarkers("C", "major").filter((m) => m.isRoot);
    expect(roots.length).toBeGreaterThan(0);
    for (const m of roots) {
      expect(Note.chroma(m.pitchClass)).toBe(Note.chroma("C"));
      expect(m.degree).toBe("1");
    }
  });

  it("12-fret window: count = strings x scale length, root-independent", () => {
    // In any 12-fret window each pitch class appears exactly once per string.
    expect(scaleMarkers("C", "major", { toFret: 11 }).length).toBe(6 * 7);
    expect(scaleMarkers("G", "major", { toFret: 11 }).length).toBe(6 * 7);
    expect(scaleMarkers("E", "major", { toFret: 11 }).length).toBe(6 * 7);
    expect(scaleMarkers("A", "minor pentatonic", { toFret: 11 }).length).toBe(
      6 * 5,
    );
  });

  it("Eb major displays flat spellings, not sharps", () => {
    // A flat key must spell Eb/Ab/Bb (and never D#/G#/A#); the curated root set
    // exists so tonal produces these teaching-correct names.
    expect(spellingSet(scaleMarkers("Eb", "major"))).toEqual(
      new Set(["Eb", "F", "G", "Ab", "Bb", "C", "D"]),
    );
  });

  it("F# major spells the leading tone as E#, not F", () => {
    // The sharp key's seventh degree is E# (so every letter A–G appears once);
    // displaying it as F would be the classic enharmonic teaching error.
    const spellings = spellingSet(scaleMarkers("F#", "major"));
    expect(spellings).toEqual(
      new Set(["F#", "G#", "A#", "B", "C#", "D#", "E#"]),
    );
    expect(spellings.has("E#")).toBe(true);
    expect(spellings.has("F")).toBe(false);
  });

  it("Marker.octave is correct on known landmark frets", () => {
    // STANDARD_TUNING: string index 5 = low E (E2), index 0 = high E (E4).
    const markers = scaleMarkers("E", "major");
    const at = (string: number, fret: number) =>
      markers.find((m) => m.string === string && m.fret === fret);
    expect(at(5, 0)?.octave).toBe(2); // low E open = E2
    expect(at(5, 12)?.octave).toBe(3); // low E 12th = E3
    expect(at(0, 0)?.octave).toBe(4); // high E open = E4
  });

  it("returns empty for an unknown scale name", () => {
    expect(scaleMarkers("C", "not-a-scale")).toEqual([]);
  });
});
