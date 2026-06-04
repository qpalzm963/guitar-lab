// Pure pitch detection (DSP only). No DOM, no AudioContext, no `tone`.
// The mic engine and React component live elsewhere and feed buffers in here.
//
// Algorithm: McLeod Pitch Method (MPM). We use the NORMALIZED square-difference
// function (NSDF), not a plain biased autocorrelation. A biased ACF tapers
// toward longer lags (fewer overlapping samples → smaller sum), which pulls the
// estimated period SHORT and reads ~+10 cents SHARP at low E (82 Hz). The tuner
// would then tell users to flatten in-tune strings. The NSDF divides by the
// per-lag energy, removing that bias so a true 82.41 Hz reads back as 82.41 Hz.
//
// Reference: McLeod & Wyvill, "A Smarter Way to Find Pitch" (2005).

export const PITCH_MIN_HZ = 60;
export const PITCH_MAX_HZ = 1500;

// Below this RMS the input is treated as silence (no usable pitch).
const RMS_GATE = 0.01;
// NSDF peaks of a periodic tone approach 1.0; harmonic/noisy content stays low.
// 0.9 accepts clearly-pitched material and rejects breathy/noisy frames.
const CLARITY_THRESHOLD = 0.9;

/**
 * Estimate the fundamental frequency of `buf` (a window of mono samples in
 * roughly [-1, 1]) sampled at `sampleRate` Hz. Returns the frequency in Hz, or
 * `null` when the frame is silent / unpitched / out of the guitar+chromatic
 * range. `sampleRate` is taken from the caller's AudioContext — never assumed.
 */
export function detectPitch(buf: Float32Array, sampleRate: number): number | null {
  const n = buf.length;
  if (n < 2) return null;

  // 1. RMS gate — reject silence before doing any correlation work.
  let sumSq = 0;
  for (let i = 0; i < n; i++) sumSq += buf[i] * buf[i];
  const rms = Math.sqrt(sumSq / n);
  if (rms < RMS_GATE) return null;

  // Lag search bounds: a shorter lag = higher frequency. maxLag must stay inside
  // the buffer so each NSDF term has at least one overlapping sample.
  const minLag = Math.floor(sampleRate / PITCH_MAX_HZ);
  const maxLag = Math.min(n - 1, Math.ceil(sampleRate / PITCH_MIN_HZ));
  if (maxLag <= minLag) return null;

  // 2. NSDF over the lag window.
  //    n(τ) = 2·Σ x[i]·x[i+τ] / Σ (x[i]² + x[i+τ]²),  i ∈ [0, N-τ)
  // The denominator is the energy of both overlapping segments, so the result is
  // normalized to ~[-1, 1] and free of the biased-ACF taper.
  const nsdf = new Float32Array(maxLag + 1);
  for (let tau = minLag; tau <= maxLag; tau++) {
    let acf = 0; // Σ x[i]·x[i+τ]
    let energy = 0; // Σ (x[i]² + x[i+τ]²)
    for (let i = 0; i < n - tau; i++) {
      const a = buf[i];
      const b = buf[i + tau];
      acf += a * b;
      energy += a * a + b * b;
    }
    nsdf[tau] = energy > 0 ? (2 * acf) / energy : 0;
  }

  // 3. Key-maximum pick (McLeod). The NSDF starts near +1 at lag 0 and slopes
  //    down through a wide leading lobe that is NOT a real period peak. Picking
  //    inside it gives a wildly-too-short lag (e.g. low E reading ~1500 Hz). The
  //    canonical fix: ignore everything until the NSDF first dips BELOW zero,
  //    then collect "key maxima" — after each upward zero-crossing, the highest
  //    point until the next downward zero-crossing. We set threshold = CLARITY ·
  //    (tallest key max) and choose the FIRST key max above it. First (not global
  //    max) is what rejects octave errors: a strong 2nd/3rd harmonic builds a
  //    taller peak at 2τ/3τ, but the fundamental's shorter-lag peak comes first.
  const keyMaxLags: number[] = [];
  let started = false; // have we passed the leading lobe (first dip below zero)?
  let curMaxLag = -1; // best lag seen in the current positive lobe
  let positive = false; // are we inside a positive-NSDF region?
  for (let tau = minLag; tau <= maxLag; tau++) {
    const v = nsdf[tau];
    if (!started) {
      // Discard the leading lobe entirely; only begin once the NSDF goes negative.
      if (v < 0) started = true;
      continue;
    }
    if (v > 0) {
      positive = true; // inside a positive lobe (entered via upward zero-crossing)
      if (curMaxLag < 0 || v > nsdf[curMaxLag]) curMaxLag = tau;
    } else {
      // Crossed down through zero: close out the lobe, recording its peak lag.
      if (positive && curMaxLag >= 0) keyMaxLags.push(curMaxLag);
      positive = false;
      curMaxLag = -1;
    }
  }
  if (positive && curMaxLag >= 0) keyMaxLags.push(curMaxLag);
  if (keyMaxLags.length === 0) return null;

  let tallest = 0;
  for (const lag of keyMaxLags) if (nsdf[lag] > tallest) tallest = nsdf[lag];
  if (tallest < CLARITY_THRESHOLD) return null; // unpitched/noisy frame

  const threshold = CLARITY_THRESHOLD * tallest;
  let bestLag = -1;
  for (const lag of keyMaxLags) {
    if (nsdf[lag] >= threshold) {
      bestLag = lag;
      break;
    }
  }
  if (bestLag < 0) return null;

  // 4. Parabolic interpolation through (τ-1, τ, τ+1) for a sub-sample lag. The
  //    NSDF near its peak is locally parabolic; the vertex refines the period to
  //    a fraction of a sample, which is what gets cents accuracy from a coarse
  //    integer lag. Guard τ at the edges where neighbours don't exist.
  let refinedLag = bestLag;
  if (bestLag > minLag && bestLag < maxLag) {
    const y0 = nsdf[bestLag - 1];
    const y1 = nsdf[bestLag];
    const y2 = nsdf[bestLag + 1];
    const denom = y0 - 2 * y1 + y2;
    if (denom !== 0) {
      const delta = (0.5 * (y0 - y2)) / denom; // vertex offset, ~[-0.5, 0.5]
      refinedLag = bestLag + delta;
    }
  }

  if (refinedLag <= 0) return null;
  return sampleRate / refinedLag;
}
