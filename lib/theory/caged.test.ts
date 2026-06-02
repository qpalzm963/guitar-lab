import { describe, it, expect } from "vitest";
import { Chord, Note } from "tonal";
import { cagedShapes, cagedWindows } from "./caged";
import type { Marker } from "./types";

// References validated against:
//  - C major CAGED windows C 0–3, A 3–5, G 5–8, E 8–10, D 10–13, adjacent
//    shapes sharing a fret (3,5,8,10). Sources: fretboardknowledge.com C-major
//    CAGED, appliedguitartheory.com CAGED, premierguitar guitarists-guide-to-caged.
//  - G major: the E-shape root sits on the low E string at fret 3.
//  - Minor CAGED uses the Cm/Am/Gm/Em/Dm shapes:
//    appliedguitartheory.com/lessons/minor-caged-system.

const chromaSet = (markers: Marker[]) =>
  new Set(markers.map((m) => Note.chroma(m.pitchClass)));
const expectedChromas = (notes: string[]) =>
  new Set(notes.map((n) => Note.chroma(n)));

describe("cagedWindows — C major matches the canonical reference", () => {
  it("C major windows are C 0–3, A 3–5, G 5–8, E 8–10, D 10–13", () => {
    const w = cagedWindows("C");
    expect(w.map((x) => [x.shape, x.from, x.to])).toEqual([
      ["C", 0, 3],
      ["A", 3, 5],
      ["G", 5, 8],
      ["E", 8, 10],
      ["D", 10, 13],
    ]);
  });

  it("adjacent C major shapes connect (overlap or are contiguous)", () => {
    const w = cagedWindows("C");
    for (let i = 1; i < w.length; i++) {
      expect(w[i].from).toBeLessThanOrEqual(w[i - 1].to); // they share a fret
      expect(w[i].from).toBeGreaterThanOrEqual(w[i - 1].from); // ascending
    }
  });

  it("G major: the E shape root is on the low E string at fret 3", () => {
    const shapes = cagedShapes("G", "major");
    const eShape = shapes.find((s) => s.shape === "E")!;
    // Low E string = index 5. Its root marker should be at fret 3 (G).
    const lowERoot = eShape.markers.find(
      (m) => m.string === 5 && m.isRoot,
    );
    expect(lowERoot?.fret).toBe(3);
  });
});

describe("cagedShapes — every shape is the correct chord", () => {
  it.each([
    ["C", "major"],
    ["G", "major"],
    ["A", "minor"],
  ] as const)(
    "%s %s: all 5 shapes sound exactly the chord's pitch classes",
    (root, quality) => {
      const symbol = quality === "minor" ? "m" : "";
      const chord = Chord.get(`${root}${symbol}`);
      const want = expectedChromas(chord.notes);

      const shapes = cagedShapes(root, quality);
      expect(shapes.length).toBe(5);
      for (const s of shapes) {
        // Each shape's window contains chord tones, and ONLY chord tones, and
        // every chord tone is present somewhere in the window.
        expect(s.markers.length).toBeGreaterThan(0);
        expect(chromaSet(s.markers)).toEqual(want);
      }
    },
  );

  it.each([
    ["C", "major"],
    ["G", "major"],
    ["A", "minor"],
  ] as const)("%s %s: the root is present in every shape", (root, quality) => {
    const rootChroma = Note.chroma(root);
    for (const s of cagedShapes(root, quality)) {
      const hasRoot = s.markers.some(
        (m) => Note.chroma(m.pitchClass) === rootChroma && m.isRoot,
      );
      expect(hasRoot).toBe(true);
    }
  });

  it.each([
    ["C", "major"],
    ["G", "major"],
    ["A", "minor"],
  ] as const)(
    "%s %s: shapes are ordered ascending by 'from' and connect",
    (root, quality) => {
      const shapes = cagedShapes(root, quality);
      for (let i = 1; i < shapes.length; i++) {
        expect(shapes[i].from).toBeGreaterThanOrEqual(shapes[i - 1].from);
        // Adjacent CAGED shapes overlap or are contiguous (no gap).
        expect(shapes[i].from).toBeLessThanOrEqual(shapes[i - 1].to + 1);
      }
    },
  );

  it("C major root markers are degree 1 and role 'root'; others role 'scale'", () => {
    const shapes = cagedShapes("C", "major");
    for (const s of shapes) {
      for (const m of s.markers) {
        if (m.isRoot) {
          expect(m.degree).toBe("1");
          expect(m.role).toBe("root");
        } else {
          expect(m.role).toBe("scale");
        }
      }
    }
  });

  it("A minor shapes carry a b3 (minor third), never a natural 3", () => {
    // The b3 is what makes it minor; a natural 3 would be a wrong (major) chord.
    const shapes = cagedShapes("A", "minor");
    const degrees = new Set(
      shapes.flatMap((s) => s.markers.map((m) => m.degree)),
    );
    expect(degrees.has("b3")).toBe(true);
    expect(degrees.has("3")).toBe(false);
  });

  it("returns [] for an invalid root", () => {
    expect(cagedShapes("H", "major")).toEqual([]);
  });
});
