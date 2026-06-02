import { describe, it, expect } from "vitest";
import { Note } from "tonal";
import {
  STANDARD_TUNING,
  midiAt,
  pitchClassAt,
  chromaAt,
  noteNameAt,
} from "./fretboard";

describe("fretboard mapping", () => {
  it("low E string, fret 5 = A (a known landmark)", () => {
    expect(pitchClassAt("E2", 5)).toBe("A");
  });

  it("fret 0 equals the open-string note", () => {
    for (const open of STANDARD_TUNING) {
      expect(noteNameAt(open, 0)).toBe(open);
    }
  });

  it("every string repeats one octave up at fret 12", () => {
    for (const open of STANDARD_TUNING) {
      expect(midiAt(open, 12)).toBe(midiAt(open, 0) + 12);
      expect(chromaAt(open, 12)).toBe(chromaAt(open, 0));
    }
  });

  it("chromaAt agrees with tonal's Note.chroma across the neck", () => {
    for (const open of STANDARD_TUNING) {
      for (let f = 0; f <= 15; f++) {
        expect(chromaAt(open, f)).toBe(Note.chroma(pitchClassAt(open, f)));
      }
    }
  });
});
