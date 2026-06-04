import { describe, it, expect } from "vitest";
import {
  newIntervalQuestion,
  newChordQuestion,
  validate,
  type EarQuestion,
} from "./earTraining";
import { QUIZ_INTERVALS } from "@/lib/theory/intervals";
import { CHORD_TYPES } from "@/lib/theory/chords";
import { ROOT_OPTIONS } from "@/lib/theory/notes";

// The generators are random, so a single call can't prove the invariants hold.
// We sample many rounds and assert every one is well-formed. ITERATIONS is high
// enough that a broken distractor draw (dup, missing answer, or off-pool id) is
// overwhelmingly likely to surface in at least one round.
const ITERATIONS = 200;

const ROOTS = new Set<string>(ROOT_OPTIONS);

// Run the same structural checks against either generator + its source pool.
function assertWellFormed(
  make: () => EarQuestion,
  poolIds: Set<string>,
  poolSize: number,
) {
  for (let n = 0; n < ITERATIONS; n++) {
    const q = make();

    // Exactly 4 options: the answer + 3 distractors. A quiz with the wrong count
    // is malformed — too few hides choices, too many means a duplicate slipped in.
    expect(q.options).toHaveLength(4);

    const ids = q.options.map((o) => o.id);

    // All option ids distinct. A duplicate option is a wasted choice and can
    // render two "correct" buttons — the round becomes ambiguous/unanswerable.
    expect(new Set(ids).size).toBe(4);

    // The answer must be one of the shown options, else the quiz is unanswerable
    // (the learner can never pick the right answer). This is the core invariant.
    expect(ids).toContain(q.answerId);

    // answerId must be a real id from the corresponding pool — never invented and
    // never leaking from the other quiz's pool.
    expect(poolIds.has(q.answerId)).toBe(true);

    // Every option likewise comes from the source pool (no foreign labels).
    for (const id of ids) expect(poolIds.has(id)).toBe(true);

    // Root is one of the curated playable roots, so audio/markers always resolve.
    expect(ROOTS.has(q.root)).toBe(true);

    // Sanity: we never request more distinct options than the pool can supply.
    expect(poolSize).toBeGreaterThanOrEqual(4);
  }
}

describe("newIntervalQuestion", () => {
  const poolIds = new Set(QUIZ_INTERVALS.map((i) => i.id));

  it("always yields 4 distinct options with the answer present, from QUIZ_INTERVALS", () => {
    assertWellFormed(newIntervalQuestion, poolIds, QUIZ_INTERVALS.length);
  });

  it("never offers unison/octave as the answer (they share the root chroma)", () => {
    // QUIZ_INTERVALS deliberately drops 1P/8P; the answer is drawn from it, so an
    // ear-training round can never ask the learner to identify a non-distinct
    // interval. Pinning it here ties this module to that exclusion.
    for (let n = 0; n < ITERATIONS; n++) {
      const { answerId } = newIntervalQuestion();
      expect(answerId).not.toBe("1P");
      expect(answerId).not.toBe("8P");
    }
  });
});

describe("newChordQuestion", () => {
  const poolIds = new Set(CHORD_TYPES.map((c) => c.id));

  it("always yields 4 distinct options with the answer present, from CHORD_TYPES", () => {
    assertWellFormed(newChordQuestion, poolIds, CHORD_TYPES.length);
  });
});

describe("validate", () => {
  it("accepts the answer id and rejects any other shown option", () => {
    // The component grades a pick with this; it must say true only for the answer.
    for (let n = 0; n < ITERATIONS; n++) {
      const q = newIntervalQuestion();
      expect(validate(q, q.answerId)).toBe(true);

      // Some other option (the options are distinct, so any non-answer id differs).
      const other = q.options.find((o) => o.id !== q.answerId)!;
      expect(validate(q, other.id)).toBe(false);
    }
  });

  it("works the same for chord questions", () => {
    const q = newChordQuestion();
    expect(validate(q, q.answerId)).toBe(true);
    const wrong = q.options.find((o) => o.id !== q.answerId)!;
    expect(validate(q, wrong.id)).toBe(false);
  });
});
