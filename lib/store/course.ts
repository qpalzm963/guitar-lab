import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Per-lesson course progress: whether the learner marked a lesson 完成, and the
// best quiz result they've recorded. Keyed by lesson slug. We keep this separate
// from lib/store/progress.ts (the 6-area curriculum checkboxes) because the keys
// (lesson slugs vs curriculum item ids) and the value shape (done + quiz score)
// are different concerns; mixing them would muddy both stores' migrate guards.

/** A recorded quiz result for one lesson (best score is kept). */
export interface QuizResult {
  /** Number of questions answered correctly. */
  score: number;
  /** Total questions in the quiz at the time it was taken. */
  total: number;
  /** Whether the learner reached the pass threshold (score/total). */
  passed: boolean;
}

/** Per-lesson record. Absent slug ⇒ nothing done and no quiz taken. */
export interface LessonProgress {
  done?: true;
  quiz?: QuizResult;
}

interface CourseState {
  lessons: Record<string, LessonProgress>;
  /** Toggle the 完成 flag for a lesson (preserves any recorded quiz result). */
  toggleDone: (slug: string) => void;
  /**
   * Record a quiz attempt for a lesson. Keeps the BEST attempt (higher score,
   * or higher ratio on a tie of raw score) so a worse retry never erases a pass.
   */
  recordQuiz: (slug: string, result: QuizResult) => void;
  isDone: (slug: string) => boolean;
  getQuiz: (slug: string) => QuizResult | undefined;
  /** Number of lessons marked done. */
  doneCount: () => number;
  clearAll: () => void;
}

// Runtime guards: the persisted blob is untrusted (partial writes, hand edits),
// so coerce it to a clean shape before trusting it. Anything malformed is
// dropped per-key — a corrupt blob must degrade to "nothing done", never crash.
function isQuizResult(v: unknown): v is QuizResult {
  if (typeof v !== "object" || v === null) return false;
  const q = v as Record<string, unknown>;
  return (
    typeof q.score === "number" &&
    typeof q.total === "number" &&
    typeof q.passed === "boolean"
  );
}

function sanitizeLessons(raw: unknown): Record<string, LessonProgress> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
  const out: Record<string, LessonProgress> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof k !== "string") continue;
    if (typeof v !== "object" || v === null || Array.isArray(v)) continue;
    const entry = v as Record<string, unknown>;
    const clean: LessonProgress = {};
    if (entry.done === true) clean.done = true;
    if (isQuizResult(entry.quiz)) clean.quiz = entry.quiz;
    // Only keep keys that carry real progress, so the blob stays small.
    if (clean.done || clean.quiz) out[k] = clean;
  }
  return out;
}

/** Keep the better of two quiz results (raw score, then ratio on a tie). */
function bestQuiz(a: QuizResult | undefined, b: QuizResult): QuizResult {
  if (!a) return b;
  if (b.score > a.score) return b;
  if (b.score === a.score && b.total > 0 && a.total > 0) {
    return b.score / b.total > a.score / a.total ? b : a;
  }
  return a;
}

// SSR-safe persist, mirroring lib/store/progress.ts: skipHydration keeps the
// store off localStorage during server/first-client render (no hydration
// mismatch); the client calls useCourse.persist.rehydrate() in an effect.
// version + migrate keep the stored shape evolvable and corruption-safe.
export const useCourse = create<CourseState>()(
  persist(
    (set, get) => ({
      lessons: {},
      toggleDone: (slug) =>
        set((s) => {
          const next = { ...s.lessons };
          const cur = next[slug] ?? {};
          if (cur.done) {
            const { done: _done, ...rest } = cur;
            void _done;
            // Drop the entry entirely if nothing else is left on it.
            if (Object.keys(rest).length === 0) delete next[slug];
            else next[slug] = rest;
          } else {
            next[slug] = { ...cur, done: true };
          }
          return { lessons: next };
        }),
      recordQuiz: (slug, result) =>
        set((s) => {
          const next = { ...s.lessons };
          const cur = next[slug] ?? {};
          next[slug] = { ...cur, quiz: bestQuiz(cur.quiz, result) };
          return { lessons: next };
        }),
      isDone: (slug) => get().lessons[slug]?.done === true,
      getQuiz: (slug) => get().lessons[slug]?.quiz,
      doneCount: () =>
        Object.values(get().lessons).filter((l) => l.done === true).length,
      clearAll: () => set({ lessons: {} }),
    }),
    {
      name: "guitar-lab:course",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      // Corruption safety: coerce whatever is in localStorage to a clean record
      // instead of letting bad data through. Tolerates an absent persisted state.
      migrate: (persisted) => {
        const state = persisted as Partial<CourseState> | undefined;
        return {
          ...(state ?? {}),
          lessons: sanitizeLessons(state?.lessons),
        } as CourseState;
      },
    },
  ),
);
