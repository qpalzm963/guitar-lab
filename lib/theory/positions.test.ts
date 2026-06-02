import { describe, it, expect } from "vitest";
import { scalePositions } from "./positions";
import { DEFAULT_FRET_COUNT } from "./fretboard";

// Reference for the pentatonic box windows: A minor pentatonic box 1 = frets 5–8
// (root A on the low E string at fret 5), boxes stacking up the neck.
// Source: appliedguitartheory.com/lessons/a-minor-pentatonic-scale and
// fretjam.com/pentatonic-scale-patterns (the classic "5 box" system).

describe("scalePositions — minor pentatonic boxes", () => {
  it("A minor pentatonic box 1 spans frets 5–8 (root on low E at 5)", () => {
    const pos = scalePositions("A", "minor pentatonic");
    expect(pos.length).toBe(5);
    expect(pos[0].from).toBe(5);
    expect(pos[0].to).toBe(8);
  });

  it("A minor pentatonic boxes ascend and connect (overlap or contiguous)", () => {
    const pos = scalePositions("A", "minor pentatonic");
    // Boxes must climb the neck monotonically by their lower fret…
    for (let i = 1; i < pos.length; i++) {
      expect(pos[i].from).toBeGreaterThan(pos[i - 1].from);
    }
    // …and adjacent boxes must overlap or be contiguous (no gap), which is the
    // whole point of the connected box system.
    for (let i = 1; i < pos.length; i++) {
      expect(pos[i].from).toBeLessThanOrEqual(pos[i - 1].to + 1);
    }
  });

  it("E minor pentatonic box 1 anchors at the open position (frets 0–3)", () => {
    // E is the open low-E string, so box 1 sits at the open position (not fret 12).
    const pos = scalePositions("E", "minor pentatonic");
    expect(pos.length).toBe(5);
    expect(pos[0].from).toBe(0);
    expect(pos[0].to).toBe(3);
  });

  it("every offered box starts on the rendered neck and is well-ordered (from ≤ to)", () => {
    for (const root of ["A", "E", "C", "G", "D"]) {
      const pos = scalePositions(root, "minor pentatonic");
      for (const p of pos) {
        expect(p.from).toBeGreaterThanOrEqual(0);
        expect(p.from).toBeLessThanOrEqual(p.to);
        // A box must start within the rendered neck, else it would render empty.
        expect(p.from).toBeLessThanOrEqual(DEFAULT_FRET_COUNT);
      }
    }
  });

  it("omits boxes that start past the neck (no empty 把位 for high-root keys)", () => {
    // C minor pentatonic's upper boxes run past fret 15 and must be dropped.
    const pos = scalePositions("C", "minor pentatonic");
    expect(pos.length).toBeGreaterThan(0);
    expect(pos.length).toBeLessThan(5);
    for (const p of pos) expect(p.from).toBeLessThanOrEqual(DEFAULT_FRET_COUNT);
  });
});

describe("scalePositions — major pentatonic via relative minor", () => {
  it("C major pentatonic boxes equal A minor pentatonic boxes", () => {
    // C major pent ≡ A minor pent (relative). The box windows must be identical.
    const cMaj = scalePositions("C", "major pentatonic");
    const aMin = scalePositions("A", "minor pentatonic");
    expect(cMaj.map((p) => [p.from, p.to])).toEqual(
      aMin.map((p) => [p.from, p.to]),
    );
  });
});

describe("scalePositions — major scale & modes (CAGED-aligned)", () => {
  it("C major returns 5 positions, ordered ascending, first window from C-shape (0–3)", () => {
    const pos = scalePositions("C", "major");
    expect(pos.length).toBe(5);
    for (let i = 1; i < pos.length; i++) {
      expect(pos[i].from).toBeGreaterThanOrEqual(pos[i - 1].from);
    }
    expect(pos[0].from).toBe(0);
    expect(pos[0].to).toBe(3);
  });

  it("A natural minor positions equal C major positions (same parent key)", () => {
    // A aeolian's parent major is C; the CAGED windows must match exactly.
    const aMin = scalePositions("A", "minor");
    const cMaj = scalePositions("C", "major");
    expect(aMin.map((p) => [p.from, p.to])).toEqual(
      cMaj.map((p) => [p.from, p.to]),
    );
  });

  it("D dorian positions equal C major positions (D dorian ⊂ C major)", () => {
    const dDor = scalePositions("D", "dorian");
    const cMaj = scalePositions("C", "major");
    expect(dDor.map((p) => [p.from, p.to])).toEqual(
      cMaj.map((p) => [p.from, p.to]),
    );
  });
});

describe("scalePositions — scales without a canonical box system", () => {
  it("returns [] for blues / harmonic minor / unknown (whole-neck only)", () => {
    expect(scalePositions("A", "blues")).toEqual([]);
    expect(scalePositions("A", "harmonic minor")).toEqual([]);
    expect(scalePositions("A", "not-a-scale")).toEqual([]);
  });
});

describe("scalePositions — labels", () => {
  it("labels are zh-TW 第N把位", () => {
    const pos = scalePositions("A", "minor pentatonic");
    expect(pos[0].label).toBe("第1把位");
    expect(pos[4].label).toBe("第5把位");
  });
});

// Sanity: DEFAULT_FRET_COUNT exists (windows that fit the rendered neck are a
// UI concern; the theory allows boxes beyond it for completeness).
it("DEFAULT_FRET_COUNT is a positive number", () => {
  expect(DEFAULT_FRET_COUNT).toBeGreaterThan(0);
});
