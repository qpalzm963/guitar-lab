import { describe, it, expect } from "vitest";
import { Note } from "tonal";
import {
  secondaryDominants,
  borrowedChords,
  tritoneSub,
  inversions,
  inversionMarkers,
  drop2Voicings,
  drop2Markers,
  tritoneSubMarkers,
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
  it("marks the bass note with the reference (gray) role and NO inline label", () => {
    // The bass is shown by the gray role + the legend, not a per-circle "(低音)"
    // label (which cluttered the whole-neck inversion view). Markers fall back to
    // their note/degree like every other marker.
    const markers = drop2Markers(v[0]);
    const bassMarkers = markers.filter((m) => m.role === "reference");
    expect(bassMarkers.length).toBeGreaterThan(0);
    for (const m of bassMarkers) expect(m.label).toBeUndefined();
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

describe("drop2Voicings stay on the rendered board (off-neck fix)", () => {
  const MAX_FRET = 15; // the toFret the HarmonyExplorer/Fretboard renders
  // One chord per offered 7th-chord quality, across natural / flat / sharp roots.
  const CHORDS = ["Cmaj7", "G7", "Am7", "Dm7b5", "Bdim7", "Ebmaj7", "F#7"];

  it("places all 4 notes within 0..15 on every string set and inversion", () => {
    // The shipped bug: closeVoicing's hard-coded octave 4 pushed most voicings
    // past fret 15, so the Fretboard's fret<=15 filter rendered a partial or
    // EMPTY board (≈33% blank) while the UI still claimed a 4-note voicing and
    // kept export enabled. fitVoicingToBoard must keep all 4 notes on the neck.
    for (const chord of CHORDS) {
      for (const set of DROP2_STRING_SETS) {
        const voicings = drop2Voicings(chord, set.id, MAX_FRET);
        expect(voicings.length).toBeGreaterThan(0);
        for (const voicing of voicings) {
          expect(voicing.voiced).toHaveLength(4);
          for (const n of voicing.voiced) {
            expect(
              n.fret,
              `${chord} ${set.id} inv${voicing.inversion}: fret ${n.fret} off-board`,
            ).toBeGreaterThanOrEqual(0);
            expect(n.fret).toBeLessThanOrEqual(MAX_FRET);
          }
          // So drop2Markers (which drops only fret<0) emits all 4 — never blank.
          expect(drop2Markers(voicing)).toHaveLength(4);
        }
      }
    }
  });

  it("keeps the canonical 1-4 inv0 reference (no needless shift when it fits)", () => {
    const inv0 = drop2Voicings("Cmaj7", "1-4", MAX_FRET)[0];
    expect(inv0.voiced.map((n) => n.fret)).toEqual([5, 5, 5, 7]);
    expect(inv0.voiced.map((n) => `${n.pitchClass}${n.octave}`)).toEqual([
      "G3",
      "C4",
      "E4",
      "B4",
    ]);
  });
});

describe("harmony spelling — no teaching-hostile double accidentals", () => {
  const DOM7_ROOTS = [
    "C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B",
  ];

  it("tritone sub of Db7 is G7, not Abb7", () => {
    // Db transposed by 5d is Abb — correct but teaching-hostile. The displayed sub
    // must simplify to its single-accidental enharmonic, G7 (a tritone from Db).
    const sub = tritoneSub("Db7");
    expect(sub).not.toBeNull();
    expect(sub!.sub.symbol).toBe("G7");
    expect(sub!.sub.root).toBe("G");
  });

  it("keeps the canonical G7 → Db7 sub (single accidentals are left alone)", () => {
    expect(tritoneSub("G7")!.sub.symbol).toBe("Db7");
  });

  it("no dominant-7th root produces a tritone-sub symbol with a double accidental", () => {
    for (const r of DOM7_ROOTS) {
      const sub = tritoneSub(`${r}7`);
      expect(sub, `${r}7`).not.toBeNull();
      expect(sub!.sub.symbol, `sub of ${r}7`).not.toMatch(/bb|##/);
    }
  });

  it("borrowed chords for the Db key avoid double-flat roots (bVI Bbb → A)", () => {
    // Db is the picker key that previously surfaced bVI = Bbb. Each borrowed chord
    // SYMBOL must read with at most one accidental.
    for (const b of borrowedChords("Db")) {
      expect(b.chord.symbol, `${b.label} = ${b.chord.symbol}`).not.toMatch(
        /bb|##/,
      );
    }
  });
});

describe("tritoneSubMarkers (shared tritone drawn once, not stacked)", () => {
  it("tags the shared tritone tones as the 'shared' role, never a root", () => {
    const t = tritoneSub("G7")!; // G7 ↔ Db7; shared tritone = B & F
    const markers = tritoneSubMarkers(t);
    const sharedChromas = new Set(t.sharedTritoneChromas);
    const shared = markers.filter((m) => m.role === "shared");
    expect(shared.length).toBeGreaterThan(0);
    for (const m of shared) {
      expect(sharedChromas.has(Note.chroma(m.pitchClass)!)).toBe(true);
      expect(m.isRoot).toBe(false);
    }
  });

  it("draws each cell once — the shared tritone is NOT stacked (the fix)", () => {
    // The bug stacked a dark (orig) and a blue (sub) marker at every shared-tritone
    // cell; the blue hid the dark and the "shared" lesson was invisible. Now each
    // (string,fret) holds exactly one marker.
    const markers = tritoneSubMarkers(tritoneSub("G7")!);
    const cells = markers.map((m) => `${m.string}:${m.fret}`);
    expect(new Set(cells).size).toBe(cells.length);
  });

  it("keeps both chord roots red (role 'root')", () => {
    const markers = tritoneSubMarkers(tritoneSub("G7")!);
    const roots = markers.filter((m) => m.isRoot);
    expect(roots.length).toBeGreaterThan(0);
    for (const m of roots) expect(m.role).toBe("root");
    const rootChromas = new Set(roots.map((m) => Note.chroma(m.pitchClass)));
    expect(rootChromas.has(Note.chroma("G"))).toBe(true); // original root
    expect(rootChromas.has(Note.chroma("Db"))).toBe(true); // sub root
  });
});

describe("inversionMarkers (bass shown gray, no cramped '(低音)' label)", () => {
  it("tags every bass-pitch-class marker as reference/gray with no label", () => {
    // First inversion of Cmaj7 → bass E. Every E on the neck is gray (reference)
    // so the learner sees which note is the bass, but carries no "(低音)" text
    // (the legend conveys that) — it shows its note/degree like the rest.
    const firstInv = inversions("Cmaj7").find((i) => i.bass === "E")!;
    const markers = inversionMarkers(firstInv);
    const bass = markers.filter((m) => m.role === "reference");
    expect(bass.length).toBeGreaterThan(0);
    for (const m of bass) {
      expect(Note.chroma(m.pitchClass)).toBe(Note.chroma("E"));
      expect(m.label).toBeUndefined();
    }
    // No marker carries a "(低音)" label anymore.
    expect(markers.every((m) => m.label === undefined)).toBe(true);
  });
});
