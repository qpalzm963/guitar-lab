import { describe, it, expect } from "vitest";
import {
  stepsPerBeat,
  stepsPerBar,
  beatOfStep,
  isBeatStep,
  isAccented,
  rampedBpm,
  clampBpm,
  BPM_MIN,
  BPM_MAX,
  type TempoRamp,
} from "./metronome";

// NOTE: this file imports ONLY the pure half of metronome.ts. It must never pull
// in `tone` — Tone needs a browser AudioContext and would crash in node. The
// engine class is excluded by importing only the named pure helpers above.

describe("subdivision → step mapping", () => {
  it("maps each subdivision to the right steps-per-beat", () => {
    // WHY: the click scheduler fires once per subdivision step; if 8n didn't map
    // to 2 steps/beat the off-beat clicks would land on the wrong fraction.
    expect(stepsPerBeat("4n")).toBe(1);
    expect(stepsPerBeat("8n")).toBe(2);
    expect(stepsPerBeat("16n")).toBe(4);
    expect(stepsPerBeat("8t")).toBe(3); // triplet = 3 per beat
  });

  it("computes steps per bar from meter × subdivision", () => {
    expect(stepsPerBar("4n", 4)).toBe(4);
    expect(stepsPerBar("8n", 4)).toBe(8);
    expect(stepsPerBar("16n", 3)).toBe(12);
    expect(stepsPerBar("8t", 2)).toBe(6);
  });
});

describe("beatOfStep / isBeatStep", () => {
  it("identifies which subdivision steps fall on a beat", () => {
    // 8n in 4/4: steps 0,2,4,6 are beats; 1,3,5,7 are the off-beats.
    expect([0, 1, 2, 3, 4, 5, 6, 7].map((s) => isBeatStep(s, "8n"))).toEqual([
      true,
      false,
      true,
      false,
      true,
      false,
      true,
      false,
    ]);
  });

  it("maps a step to its beat index within the bar, wrapping per bar", () => {
    // 8n, 4 beats/bar: step 0→beat0, 2→beat1, 8→beat0 of next bar.
    expect(beatOfStep(0, "8n", 4)).toBe(0);
    expect(beatOfStep(2, "8n", 4)).toBe(1);
    expect(beatOfStep(6, "8n", 4)).toBe(3);
    expect(beatOfStep(8, "8n", 4)).toBe(0); // wrapped
  });
});

describe("accent decision (isAccented)", () => {
  it("downbeat mode accents only beat 0", () => {
    // WHY: the downbeat must be the loud/high click so the player hears the "1".
    expect(isAccented(0, "downbeat", 4)).toBe(true);
    expect(isAccented(1, "downbeat", 4)).toBe(false);
    expect(isAccented(3, "downbeat", 4)).toBe(false);
  });

  it("2and4 mode accents musical beats 2 and 4 (indices 1 and 3)", () => {
    // WHY: backbeat practice — the accent intentionally moves OFF the downbeat.
    expect(isAccented(0, "2and4", 4)).toBe(false);
    expect(isAccented(1, "2and4", 4)).toBe(true);
    expect(isAccented(2, "2and4", 4)).toBe(false);
    expect(isAccented(3, "2and4", 4)).toBe(true);
  });

  it("2and4 falls back gracefully in meters without a beat 3", () => {
    // In 2/4 there is no index-3 beat, so only beat index 1 (musical 2) accents;
    // asking for beat 3 in a 2-beat bar must not accent a beat that can't occur.
    expect(isAccented(1, "2and4", 2)).toBe(true);
    expect(isAccented(3, "2and4", 2)).toBe(false);
  });

  it("none mode never accents", () => {
    expect(isAccented(0, "none", 4)).toBe(false);
    expect(isAccented(1, "none", 4)).toBe(false);
  });
});

describe("tempo ramp (rampedBpm)", () => {
  const ramp: TempoRamp = { enabled: true, step: 5, everyBars: 2, max: 100 };

  it("holds start tempo until the first interval completes", () => {
    // bars 0 and 1 are still the first 2-bar block → no increase yet.
    expect(rampedBpm(80, 0, ramp)).toBe(80);
    expect(rampedBpm(80, 1, ramp)).toBe(80);
  });

  it("increases by step each everyBars block", () => {
    // WHY: 加速練習 must add exactly `step` BPM per `everyBars`, no drift.
    expect(rampedBpm(80, 2, ramp)).toBe(85); // 1 block
    expect(rampedBpm(80, 4, ramp)).toBe(90); // 2 blocks
    expect(rampedBpm(80, 6, ramp)).toBe(95); // 3 blocks
  });

  it("caps at max and never exceeds it", () => {
    // 80 + 5*increments capped at 100: block 4 would be 100, block 5+ stays 100.
    expect(rampedBpm(80, 8, ramp)).toBe(100);
    expect(rampedBpm(80, 100, ramp)).toBe(100);
  });

  it("returns start tempo when disabled", () => {
    expect(rampedBpm(80, 10, { ...ramp, enabled: false })).toBe(80);
  });

  it("guards against zero/negative interval or step (no div-by-zero / runaway)", () => {
    expect(rampedBpm(80, 10, { ...ramp, everyBars: 0 })).toBe(80);
    expect(rampedBpm(80, 10, { ...ramp, step: 0 })).toBe(80);
    expect(rampedBpm(80, 10, { ...ramp, step: -5 })).toBe(80);
  });
});

describe("clampBpm", () => {
  it("clamps to the allowed BPM range and rounds", () => {
    expect(clampBpm(10)).toBe(BPM_MIN);
    expect(clampBpm(999)).toBe(BPM_MAX);
    expect(clampBpm(120.6)).toBe(121);
  });

  it("falls back to BPM_MIN on NaN (empty number input)", () => {
    // WHY: the number field can momentarily yield NaN; the engine must never get
    // NaN as a tempo or Tone's transport would throw.
    expect(clampBpm(NaN)).toBe(BPM_MIN);
  });
});
