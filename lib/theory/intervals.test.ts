import { describe, it, expect } from "vitest";
import { Note } from "tonal";
import { intervalMarkers, INTERVALS } from "./intervals";
import type { Marker } from "./types";

const chromaSet = (markers: Marker[]) =>
  new Set(markers.map((m) => Note.chroma(m.pitchClass)));

describe("intervalMarkers", () => {
  it("C P5 marks G with the root C present and degree 5 on the fifth", () => {
    const markers = intervalMarkers("C", "5P");
    const chromas = chromaSet(markers);
    // The perfect fifth above C is G; the root C must also be on the board.
    expect(chromas.has(Note.chroma("G"))).toBe(true);
    expect(chromas.has(Note.chroma("C"))).toBe(true);

    // Every G marker is the interval note, labelled with its degree "5".
    const fifths = markers.filter((m) => Note.chroma(m.pitchClass) === Note.chroma("G"));
    expect(fifths.length).toBeGreaterThan(0);
    for (const m of fifths) {
      expect(m.degree).toBe("5");
      expect(m.role).toBe("custom");
      expect(m.isRoot).toBe(false);
    }
  });

  it("A M3 includes C# as the interval note", () => {
    const markers = intervalMarkers("A", "3M");
    // The major third above A is C#; matching is chroma-based so spelling holds.
    const thirds = markers.filter((m) => Note.chroma(m.pitchClass) === Note.chroma("C#"));
    expect(thirds.length).toBeGreaterThan(0);
    for (const m of thirds) {
      expect(m.pitchClass).toBe("C#");
      expect(m.degree).toBe("3");
      expect(m.role).toBe("custom");
    }
  });

  it("every root marker is role 'root', isRoot, degree 1, and the root chroma", () => {
    const roots = intervalMarkers("C", "5P").filter((m) => m.isRoot);
    expect(roots.length).toBeGreaterThan(0);
    for (const m of roots) {
      expect(m.role).toBe("root");
      expect(m.degree).toBe("1");
      expect(Note.chroma(m.pitchClass)).toBe(Note.chroma("C"));
    }
  });

  it("an unknown interval name returns []", () => {
    expect(intervalMarkers("C", "not-an-interval")).toEqual([]);
  });

  it("the octave (8P) adds no interval markers — only roots", () => {
    // P8 shares the root's chroma, so there is no distinct interval note to mark;
    // the result must be all roots. This pins the unison/octave edge case.
    const markers = intervalMarkers("C", "8P");
    expect(markers.length).toBeGreaterThan(0);
    expect(markers.every((m) => m.isRoot && m.degree === "1")).toBe(true);
  });

  it("the tritone (4A) marks F# above C", () => {
    const markers = intervalMarkers("C", "4A");
    const tritones = markers.filter((m) => !m.isRoot);
    expect(tritones.length).toBeGreaterThan(0);
    for (const m of tritones) {
      expect(Note.chroma(m.pitchClass)).toBe(Note.chroma("F#"));
    }
  });

  it("INTERVALS list maps every label to a resolvable tonal interval", () => {
    // Each picker entry must produce markers (or be the octave edge case) — a
    // typo'd interval name would silently render an empty board.
    for (const { id } of INTERVALS) {
      const markers = intervalMarkers("C", id);
      expect(markers.length).toBeGreaterThan(0);
    }
  });
});
