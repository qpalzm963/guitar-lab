import { describe, it, expect } from "vitest";
import { DRONE_SYNTH_OPTIONS } from "./drone";

// NOTE: imports ONLY the pure exported config, never `tone` — Tone needs a
// browser AudioContext and would crash in node (vitest runs in environment:node).

describe("drone synth voicing", () => {
  it("uses a clean waveform, never the buzzy sawtooth", () => {
    // WHY: the drone is a sustained reference tone for intonation practice, so it
    // must sound clean. A sawtooth (every harmonic) was reported as buzzy/harsh;
    // this pins the fix so an edit can't silently regress the drone to a harsh
    // timbre. triangle is the chosen voicing (clean, yet audible at low octaves).
    expect(DRONE_SYNTH_OPTIONS.oscillator.type).toBe("triangle");
    expect(DRONE_SYNTH_OPTIONS.oscillator.type).not.toBe("sawtooth");
  });

  it("sustains rather than decaying to silence", () => {
    // WHY: a drone must hold a steady level while a note is held. A non-zero
    // sustain is what keeps the reference tone audible; sustain 0 would fade out
    // after the attack/decay and defeat the purpose.
    expect(DRONE_SYNTH_OPTIONS.envelope.sustain).toBeGreaterThan(0);
  });
});
