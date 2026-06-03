import { describe, it, expect } from "vitest";
import { Note } from "tonal";
import {
  secondaryDominants,
  borrowedChords,
  tritoneSub,
  inversions,
  drop2Voicings,
  drop2Markers,
  DROP2_STRING_SETS,
} from "./harmony";

// Compare note sets by CHROMA so enharmonic spelling (Cb vs B, Db vs C#) never
// causes a false failure — the same enharmonic-safe approach as chords.test.ts.
const chromaSet = (notes: string[]) =>
  new Set(notes.map((n) => Note.chroma(n)));
const expectedChromas = (notes: string[]) =>
  new Set(notes.map((n) => Note.chroma(n)));

describe("secondaryDominants (C major)", () => {
  const sd = secondaryDominants("C");
  const by = (target: string) => sd.find((s) => s.target === target)!;

  it("returns the 5 secondary dominants (ii,iii,IV,V,vi), skipping I and vii°", () => {
    expect(sd.map((s) => s.target)).toEqual(["ii", "iii", "IV", "V", "vi"]);
  });

  // The verifiable facts from the spec: each is the dom7 a P5 above the target.
  // Asserting by chroma encodes WHY these chords matter — they tonicize their
  // diatonic target (V7/V must be D7 with an F#, the leading tone into G).
  it("V7/V = D7 {D F# A C}", () => {
    expect(by("V").chord.root).toBe("D");
    expect(chromaSet(by("V").chord.notes)).toEqual(
      expectedChromas(["D", "F#", "A", "C"]),
    );
  });
  it("V7/vi = E7 {E G# B D}", () => {
    expect(by("vi").chord.root).toBe("E");
    expect(chromaSet(by("vi").chord.notes)).toEqual(
      expectedChromas(["E", "G#", "B", "D"]),
    );
  });
  it("V7/ii = A7, V7/iii = B7, V7/IV = C7 (roots by chroma)", () => {
    expect(Note.chroma(by("ii").chord.root)).toBe(Note.chroma("A"));
    expect(Note.chroma(by("iii").chord.root)).toBe(Note.chroma("B"));
    expect(Note.chroma(by("IV").chord.root)).toBe(Note.chroma("C"));
  });
  it("each secondary dominant is a dom7 (has a major 3rd and minor 7th)", () => {
    // The defining quality: degree '3' (major 3rd, the secondary leading tone)
    // and 'b7'. Without these it wouldn't function as a dominant.
    for (const s of sd) {
      expect(s.chord.degrees).toContain("3");
      expect(s.chord.degrees).toContain("b7");
    }
  });
  it("labels read V7/<target> and target chord is the diatonic chord", () => {
    expect(by("V").label).toBe("V7/V");
    expect(Note.chroma(by("V").targetChord.replace(/m7|maj7|7|m|b5/g, ""))).toBe(
      Note.chroma("G"),
    );
  });
});

describe("borrowedChords (C major, from parallel minor)", () => {
  const b = borrowedChords("C");
  const by = (label: string) => b.find((x) => x.label === label)!;

  it("includes iiø, bIII, iv, bVI, bVII", () => {
    expect(b.map((x) => x.label)).toEqual(["iiø", "bIII", "iv", "bVI", "bVII"]);
  });
  it("iv = Fm {F Ab C}", () => {
    expect(chromaSet(by("iv").chord.notes)).toEqual(
      expectedChromas(["F", "Ab", "C"]),
    );
  });
  it("bVII = Bb {Bb D F}", () => {
    expect(chromaSet(by("bVII").chord.notes)).toEqual(
      expectedChromas(["Bb", "D", "F"]),
    );
  });
  it("bVI = Ab {Ab C Eb}", () => {
    expect(chromaSet(by("bVI").chord.notes)).toEqual(
      expectedChromas(["Ab", "C", "Eb"]),
    );
  });
  it("bIII = Eb {Eb G Bb}", () => {
    expect(chromaSet(by("bIII").chord.notes)).toEqual(
      expectedChromas(["Eb", "G", "Bb"]),
    );
  });
  it("iv carries a b3 — that flat 3rd is the borrowed minor colour", () => {
    // iv (minor) vs the diatonic IV (major) is the whole point of the borrow.
    expect(by("iv").chord.degrees).toContain("b3");
  });
});

describe("tritoneSub", () => {
  const ts = tritoneSub("G7")!;

  it("G7's tritone sub has root chroma = Db", () => {
    expect(Note.chroma(ts.sub.root)).toBe(Note.chroma("Db"));
  });
  it("G7 and its sub share the {B,F} tritone (3rd & 7th)", () => {
    expect(new Set(ts.sharedTritoneChromas)).toEqual(
      new Set([Note.chroma("B"), Note.chroma("F")]),
    );
    // That shared tritone must live in BOTH chords.
    const origSet = chromaSet(ts.original.notes);
    const subSet = chromaSet(ts.sub.notes);
    for (const c of ts.sharedTritoneChromas) {
      expect(origSet.has(c)).toBe(true);
      expect(subSet.has(c)).toBe(true);
    }
  });
  it("the sub is itself a dominant 7th", () => {
    expect(ts.sub.degrees).toContain("3");
    expect(ts.sub.degrees).toContain("b7");
  });
  it("returns null for a non-dominant chord (only dom7 has the device)", () => {
    expect(tritoneSub("Cmaj7")).toBeNull();
    expect(tritoneSub("Am")).toBeNull();
  });
});

describe("inversions", () => {
  it("triad C → bass notes C, E, G (root, 1st, 2nd)", () => {
    const inv = inversions("C");
    expect(inv.map((i) => i.bass)).toEqual(["C", "E", "G"]);
    expect(inv.map((i) => i.symbol)).toEqual(["C", "C/E", "C/G"]);
    expect(inv.map((i) => i.bassDegree)).toEqual(["1", "3", "5"]);
  });
  it("7th chord Cmaj7 → 4 inversions, bass C, E, G, B", () => {
    const inv = inversions("Cmaj7");
    expect(inv.map((i) => i.bass)).toEqual(["C", "E", "G", "B"]);
    expect(inv.map((i) => i.symbol)).toEqual([
      "Cmaj7",
      "Cmaj7/E",
      "Cmaj7/G",
      "Cmaj7/B",
    ]);
    expect(inv[3].bassDegree).toBe("7");
  });
  it("root position has no slash; inversions are <chord>/<bass>", () => {
    const inv = inversions("C");
    expect(inv[0].symbol).not.toContain("/");
    expect(inv[1].symbol).toBe("C/E");
  });
});

describe("drop2Voicings (Cmaj7)", () => {
  const v = drop2Voicings("Cmaj7", "1-4");

  it("returns 4 voicings (one per inversion)", () => {
    expect(v).toHaveLength(4);
  });
  it("every voicing contains all 4 chord tones {C,E,G,B}", () => {
    for (const voicing of v) {
      expect(chromaSet(voicing.voiced.map((n) => n.pitchClass))).toEqual(
        expectedChromas(["C", "E", "G", "B"]),
      );
    }
  });
  it("each voicing sits on 4 adjacent strings (the chosen set, low→high)", () => {
    for (const voicing of v) {
      const strings = voicing.voiced.map((n) => n.string);
      // Strings must be 4 consecutive indices, descending (low string = high idx
      // first because voiced is ordered low pitch → high pitch).
      expect(strings).toEqual([3, 2, 1, 0]); // D G B e for the 1-4 set
    }
  });
  it("the dropped voice makes the bass span more than an octave below the top", () => {
    // Drop-2's signature: after dropping, the lowest note is a 4-note voicing
    // spanning > an octave (a close voicing spans < an octave). This is the test
    // that fails if the drop is omitted or applied to the wrong voice.
    for (const voicing of v) {
      const midis = voicing.voiced.map((n) =>
        Note.midi(`${n.pitchClass}${n.octave}`)!,
      );
      const span = Math.max(...midis) - Math.min(...midis);
      expect(span).toBeGreaterThan(12);
      expect(span).toBeLessThanOrEqual(24);
    }
  });
  it("inversion 0 = the canonical Cmaj7 drop-2 (bass G, frets D5 G5 B5 e7)", () => {
    // Validated against mattwarnockguitar.com's published Cmaj7 drop-2 shape on
    // the D-G-B-e string set: G3 C4 E4 B4. This pins the exact reference voicing.
    const inv0 = v[0];
    expect(inv0.bass).toBe("G");
    expect(inv0.bassDegree).toBe("5");
    const frets = inv0.voiced.map((n) => n.fret);
    expect(frets).toEqual([5, 5, 5, 7]); // D=5 G=5 B=5 e=7
    expect(inv0.voiced.map((n) => `${n.pitchClass}${n.octave}`)).toEqual([
      "G3",
      "C4",
      "E4",
      "B4",
    ]);
  });
  it("the 4 inversions cycle the bass through 5th, 7th, root, 3rd", () => {
    expect(v.map((x) => x.bassDegree)).toEqual(["5", "7", "1", "3"]);
  });
  it("renders the bass note as the reference role with a 低音 label", () => {
    const markers = drop2Markers(v[0]);
    const bassMarkers = markers.filter((m) => m.role === "reference");
    expect(bassMarkers.length).toBeGreaterThan(0);
    for (const m of bassMarkers) expect(m.label).toContain("低音");
  });
  it("returns [] for a non-4-note chord (drop-2 needs a 7th chord)", () => {
    expect(drop2Voicings("C")).toEqual([]); // triad
  });
  it("supports the other string sets", () => {
    for (const set of DROP2_STRING_SETS) {
      const vs = drop2Voicings("Cmaj7", set.id);
      expect(vs).toHaveLength(4);
      for (const voicing of vs) {
        expect(chromaSet(voicing.voiced.map((n) => n.pitchClass))).toEqual(
          expectedChromas(["C", "E", "G", "B"]),
        );
      }
    }
  });
});
