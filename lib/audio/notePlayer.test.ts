import { describe, it, expect } from "vitest";
import { intervalNotes, chordNotes } from "./notePlayer";

// NOTE: this file imports ONLY the pure half of notePlayer.ts (intervalNotes,
// chordNotes). It must never pull in `tone` — Tone needs a browser AudioContext
// and would crash in node. The NotePlayer engine class is excluded by importing
// only the named pure helpers above.

describe("intervalNotes", () => {
  it("attaches the octave and transposes by the named interval", () => {
    // WHY: the interval quiz plays root then target; both must carry an octave
    // or Tone can't pitch them. The target's octave must follow from the root,
    // not be assumed (a 5th above Bb4 is F5, an octave up).
    expect(intervalNotes("C", "3M")).toEqual(["C4", "E4"]);
    expect(intervalNotes("Bb", "5P")).toEqual(["Bb4", "F5"]);
    expect(intervalNotes("C", "4A")).toEqual(["C4", "F#4"]);
    expect(intervalNotes("C", "8P")).toEqual(["C4", "C5"]);
  });

  it("always returns exactly two notes (root + interval)", () => {
    // WHY: callers destructure [root, target]; a different arity would break them.
    expect(intervalNotes("C", "3M")).toHaveLength(2);
    expect(intervalNotes("F#", "7m")).toHaveLength(2);
  });
});

describe("chordNotes", () => {
  it("stacks a seventh chord in one octave when notes ascend", () => {
    // maj7 pitch-classes C E G B already ascend by chroma, so all stay in octave 4.
    expect(chordNotes("C", "maj7")).toEqual(["C4", "E4", "G4", "B4"]);
  });

  it("bumps the octave so an add9's 9th sounds ABOVE the triad", () => {
    // WHY (load-bearing): Chord.get returns bare pitch-classes C E G D. Naively
    // tacking octave 4 onto every note would put D4 a 2nd BELOW the C root — it
    // must sound as the 9th, a major 2nd ABOVE the octave, i.e. D5.
    expect(chordNotes("C", "add9")).toEqual(["C4", "E4", "G4", "D5"]);
  });

  it("preserves double-flat spelling without enharmonic normalization", () => {
    // WHY: a fully-diminished 7th is correctly spelled C Eb Gb Bbb. We must keep
    // the double-flat (not rewrite it as A) so the teaching spelling stays intact;
    // Tone parses "Bbb4" fine.
    expect(chordNotes("C", "dim7")).toEqual(["C4", "Eb4", "Gb4", "Bbb4"]);
  });

  it("stacks a minor 7th rooted on a flat key correctly", () => {
    // WHY: Bb m7 = Bb Db F Ab. After Bb4, Db wraps past B so it climbs to octave 5;
    // F and Ab keep ascending within octave 5. Verifies the bump triggers exactly
    // once, at the wrap, not on every note.
    expect(chordNotes("Bb", "m7")).toEqual(["Bb4", "Db5", "F5", "Ab5"]);
  });

  it("keeps a Cb-spelled chord tone ascending by LETTER, not chroma", () => {
    // WHY (regression): Ab minor = Ab Cb Eb. Cb has chroma 11 (same region as B)
    // but its LETTER C has already wrapped past B, so it must climb to the next
    // octave (Cb5) and sound the 3rd ABOVE the root. A chroma comparison would
    // leave it at Cb4 — a 6th BELOW Ab4 (audibly wrong). Db7's b7 is the same trap.
    expect(chordNotes("Ab", "m")).toEqual(["Ab4", "Cb5", "Eb5"]);
    expect(chordNotes("Db", "7")).toEqual(["Db4", "F4", "Ab4", "Cb5"]);
  });
});
