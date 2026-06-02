import { describe, it, expect } from "vitest";
import { Chord, Note } from "tonal";
import { CHORD_SHAPES } from "./chordShapes";
import { STANDARD_TUNING, midiAt } from "@/lib/theory/fretboard";

// Pitch classes (chroma 0-11) actually sounded by a shape: every non-muted
// string mapped through standard tuning.
const soundedChromas = (frets: number[]) => {
  const set = new Set<number>();
  frets.forEach((fret, i) => {
    if (fret >= 0) set.add(midiAt(STANDARD_TUNING[i], fret) % 12);
  });
  return set;
};

const expectedChromas = (notes: string[]) =>
  new Set(notes.map((n) => Note.chroma(n)));

// The lowest-pitched sounded string = highest index (closest to low E) that is
// not muted. For these curated open/barre shapes the bass note is the chord root.
const lowestSoundedMidi = (frets: number[]) => {
  for (let i = frets.length - 1; i >= 0; i--) {
    if (frets[i] >= 0) return midiAt(STANDARD_TUNING[i], frets[i]);
  }
  throw new Error("shape has no sounded string");
};

describe("CHORD_SHAPES are theory-faithful", () => {
  // A wrong fret in a curated fingering is silent in the UI but teaches a wrong
  // chord. These assertions tie every shape back to the chord it claims to be.
  it.each(CHORD_SHAPES)(
    "$id sounds exactly its chord tones",
    ({ root, type, frets }) => {
      const chord = Chord.get(`${root}${type}`);
      expect(chord.empty).toBe(false);
      // Every chord tone present, and no extra (non-chord) notes sounded.
      expect(soundedChromas(frets)).toEqual(expectedChromas(chord.notes));
    },
  );

  it.each(CHORD_SHAPES)("$id has the root in the bass", ({ root, frets }) => {
    expect(lowestSoundedMidi(frets) % 12).toBe(Note.chroma(root));
  });
});
