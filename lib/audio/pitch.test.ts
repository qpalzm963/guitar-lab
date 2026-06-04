import { describe, it, expect } from "vitest";
import { detectPitch, PITCH_MIN_HZ, PITCH_MAX_HZ } from "./pitch";

// This file imports ONLY the pure DSP. detectPitch must never touch the DOM or
// an AudioContext — vitest runs in node, so any browser API would crash here.

// Open-string frequencies of standard tuning (high E → low E), the targets the
// tuner exists to nail.
const OPEN_STRING_HZ = [329.63, 246.94, 196.0, 146.83, 110.0, 82.41];

/** A pure sine of `freq` Hz, `seconds` long, at `sampleRate`. */
function sine(freq: number, sampleRate: number, seconds = 0.2): Float32Array {
  const n = Math.round(sampleRate * seconds);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    buf[i] = Math.sin((2 * Math.PI * freq * i) / sampleRate);
  }
  return buf;
}

/** Cents error between a detected and an expected frequency. */
const centsErr = (got: number, want: number) => 1200 * Math.log2(got / want);

describe("detectPitch — open strings at common sample rates", () => {
  // ±0.5 Hz is deliberately TIGHT. A biased autocorrelation would read low E
  // several Hz / ~10 cents sharp and blow this tolerance; only an unbiased NSDF
  // passes. Keep the tolerance tight — loosening it would hide that exact bug.
  for (const sampleRate of [44100, 48000]) {
    for (const freq of OPEN_STRING_HZ) {
      it(`detects ${freq} Hz @ ${sampleRate} within ±0.5 Hz`, () => {
        const got = detectPitch(sine(freq, sampleRate), sampleRate);
        expect(got).not.toBeNull();
        expect(Math.abs((got as number) - freq)).toBeLessThan(0.5);
      });
    }
  }

  it("reads low E (82.41 Hz) essentially dead-on, not sharp", () => {
    // The headline regression: a biased ACF reports low E ~+10¢ sharp, which
    // would tell the user to FLATTEN an in-tune string. NSDF must keep it within
    // a couple of cents on either side (no systematic sharp bias).
    const got = detectPitch(sine(82.41, 44100), 44100) as number;
    expect(got).not.toBeNull();
    expect(Math.abs(centsErr(got, 82.41))).toBeLessThan(2);
  });
});

describe("detectPitch — octave-error rejection", () => {
  it("returns the fundamental for a harmonic-rich ~82 Hz tone, not 2×/3×", () => {
    // Strong 2nd and 3rd harmonics make a plain peak-picker lock onto 164/246 Hz
    // (octave/twelfth errors). The first-major-peak rule must return ~82 Hz.
    const sampleRate = 44100;
    const f0 = 82.41;
    const n = Math.round(sampleRate * 0.2);
    const buf = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / sampleRate;
      buf[i] =
        1.0 * Math.sin(2 * Math.PI * f0 * t) +
        0.9 * Math.sin(2 * Math.PI * 2 * f0 * t) +
        0.8 * Math.sin(2 * Math.PI * 3 * f0 * t);
    }
    const got = detectPitch(buf, sampleRate) as number;
    expect(got).not.toBeNull();
    // Within a semitone of the fundamental — and crucially nowhere near 2×/3×.
    expect(Math.abs(centsErr(got, f0))).toBeLessThan(50);
  });
});

describe("detectPitch — gates", () => {
  it("returns null for silence (all zeros)", () => {
    expect(detectPitch(new Float32Array(4096), 44100)).toBeNull();
  });

  it("returns null for broadband noise (no clear period)", () => {
    // White-ish noise has no NSDF peak above the clarity threshold, so the tuner
    // must stay blank instead of inventing a note from hiss.
    const n = 4096;
    const buf = new Float32Array(n);
    let seed = 12345;
    for (let i = 0; i < n; i++) {
      // Deterministic LCG so the test never flakes; scaled to clear the RMS gate.
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      buf[i] = (seed / 0x7fffffff) * 2 - 1;
    }
    expect(detectPitch(buf, 44100)).toBeNull();
  });
});

describe("detectPitch — sample rate is read, not assumed", () => {
  it("reports the same Hz for one tone sampled at 44100 vs 48000", () => {
    // If the code hardcoded 44100, the 48000 buffer would read ~8.8% sharp. The
    // two estimates agreeing within 0.5 Hz proves sampleRate flows through.
    const freq = 146.83; // D3
    const a = detectPitch(sine(freq, 44100), 44100) as number;
    const b = detectPitch(sine(freq, 48000), 48000) as number;
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(Math.abs(a - b)).toBeLessThan(0.5);
  });
});

describe("range constants", () => {
  it("bracket the guitar's range (low E above min, high notes below max)", () => {
    // 82.41 Hz (low E) must sit inside [MIN, MAX]; the band also leaves headroom
    // for high fretted notes without admitting sub-bass rumble.
    expect(PITCH_MIN_HZ).toBeLessThan(82.41);
    expect(PITCH_MAX_HZ).toBeGreaterThan(329.63);
  });
});
