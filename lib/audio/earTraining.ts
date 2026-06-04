import { QUIZ_INTERVALS } from "@/lib/theory/intervals";
import { CHORD_TYPES } from "@/lib/theory/chords";
import { ROOT_OPTIONS } from "@/lib/theory/notes";

// Pure question-generation core for the ear-training quiz: the learner hears a
// root then an interval (or a chord) and identifies it from four choices. This
// module is intentionally free of tone/DOM so it can be unit-tested in node and
// reused by the React component, which owns the audio + rendering.
//
// The round-building logic mirrors IntervalExplorer's newRound(): pick a random
// root, a random answer from the pool, three DISTINCT distractors (no dupes, none
// equal to the answer), then Fisher-Yates shuffle. The difference: here the four
// options are the full { id, label } objects (the component renders labels), and
// answerId is the answer's id.

export interface EarQuestion {
  root: string;
  answerId: string;
  options: { id: string; label: string }[];
}

// Same RNG primitive as IntervalExplorer.newRound() — kept inside functions
// (never at module scope) so importing this module is deterministic/side-effect
// free and the test can iterate without module-load nondeterminism.
function pickInt(max: number): number {
  return Math.floor(Math.random() * max);
}

/**
 * Build a four-option question from an { id, label } answer pool: one random
 * answer plus three distinct distractors drawn from the rest, then shuffled.
 * Shared by the interval and chord generators so the "answer present, no dupes,
 * shuffled" invariant lives in exactly one place. The pool must hold ≥ 4 entries
 * (both QUIZ_INTERVALS and CHORD_TYPES do) so three distractors always exist.
 */
function buildQuestion(pool: { id: string; label: string }[]): EarQuestion {
  const root = ROOT_OPTIONS[pickInt(ROOT_OPTIONS.length)];
  const answer = pool[pickInt(pool.length)];

  // Distractors: splice from a copy of the remaining entries so the same option
  // can't be drawn twice (mirrors newRound()'s splice approach).
  const rest = pool.filter((o) => o.id !== answer.id);
  const distractors: { id: string; label: string }[] = [];
  while (distractors.length < 3 && rest.length > 0) {
    const idx = pickInt(rest.length);
    distractors.push(rest.splice(idx, 1)[0]);
  }

  const options = [answer, ...distractors];
  // Fisher-Yates: the answer's slot must not be predictable.
  for (let i = options.length - 1; i > 0; i--) {
    const j = pickInt(i + 1);
    [options[i], options[j]] = [options[j], options[i]];
  }

  return { root, answerId: answer.id, options };
}

/** Random interval-identification question (answer pool excludes unison/octave). */
export function newIntervalQuestion(): EarQuestion {
  return buildQuestion(QUIZ_INTERVALS);
}

/** Random chord-quality-identification question. */
export function newChordQuestion(): EarQuestion {
  return buildQuestion(CHORD_TYPES);
}

/** A pick is correct iff it matches the question's answer id. */
export function validate(q: EarQuestion, pickedId: string): boolean {
  return pickedId === q.answerId;
}
