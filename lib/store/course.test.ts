import { describe, it, expect, beforeEach, vi } from "vitest";

// Mirror progress.test.ts: the store binds to createJSONStorage(() =>
// localStorage) at module load, and the node env has no localStorage. Install a
// tiny in-memory stub via vi.hoisted so it exists BEFORE the useCourse import.
vi.hoisted(() => {
  const mem = new Map<string, string>();
  const stub: Storage = {
    getItem: (k) => mem.get(k) ?? null,
    setItem: (k, v) => void mem.set(k, String(v)),
    removeItem: (k) => void mem.delete(k),
    clear: () => mem.clear(),
    key: (i) => Array.from(mem.keys())[i] ?? null,
    get length() {
      return mem.size;
    },
  };
  (globalThis as unknown as { localStorage: Storage }).localStorage = stub;
});

import { useCourse } from "./course";

beforeEach(() => {
  // Reset to "nothing done" before each test for isolation.
  useCourse.setState({ lessons: {} });
});

describe("useCourse toggleDone / isDone", () => {
  it("toggleDone marks a lesson; isDone then reports true", () => {
    expect(useCourse.getState().isDone("scale")).toBe(false);
    useCourse.getState().toggleDone("scale");
    expect(useCourse.getState().isDone("scale")).toBe(true);
    expect(useCourse.getState().doneCount()).toBe(1);
  });

  it("toggleDone again un-marks the lesson", () => {
    // The 標記完成 button is a single toggle — a second click must un-mark.
    useCourse.getState().toggleDone("scale");
    useCourse.getState().toggleDone("scale");
    expect(useCourse.getState().isDone("scale")).toBe(false);
    expect(useCourse.getState().doneCount()).toBe(0);
  });

  it("un-marking done preserves a recorded quiz result", () => {
    // Quiz score and done are independent facts about a lesson; clearing one must
    // not wipe the other. This is why a lesson holds a record, not a single flag.
    useCourse.getState().recordQuiz("scale", { score: 4, total: 4, passed: true });
    useCourse.getState().toggleDone("scale");
    useCourse.getState().toggleDone("scale"); // un-mark
    expect(useCourse.getState().isDone("scale")).toBe(false);
    expect(useCourse.getState().getQuiz("scale")).toEqual({
      score: 4,
      total: 4,
      passed: true,
    });
  });

  it("clearAll empties all course progress", () => {
    useCourse.getState().toggleDone("scale");
    useCourse.getState().recordQuiz("caged", { score: 3, total: 4, passed: true });
    useCourse.getState().clearAll();
    expect(useCourse.getState().doneCount()).toBe(0);
    expect(useCourse.getState().getQuiz("caged")).toBeUndefined();
  });
});

describe("useCourse recordQuiz keeps the best attempt", () => {
  it("records a first attempt", () => {
    useCourse.getState().recordQuiz("scale", { score: 3, total: 5, passed: false });
    expect(useCourse.getState().getQuiz("scale")).toEqual({
      score: 3,
      total: 5,
      passed: false,
    });
  });

  it("a higher score overwrites a lower one", () => {
    useCourse.getState().recordQuiz("scale", { score: 3, total: 5, passed: false });
    useCourse.getState().recordQuiz("scale", { score: 5, total: 5, passed: true });
    expect(useCourse.getState().getQuiz("scale")).toEqual({
      score: 5,
      total: 5,
      passed: true,
    });
  });

  it("a worse retry never erases a better (passing) result", () => {
    // The whole point of "best attempt": passing once should stick even if the
    // learner later retakes the quiz and does worse.
    useCourse.getState().recordQuiz("scale", { score: 5, total: 5, passed: true });
    useCourse.getState().recordQuiz("scale", { score: 2, total: 5, passed: false });
    expect(useCourse.getState().getQuiz("scale")).toEqual({
      score: 5,
      total: 5,
      passed: true,
    });
  });
});

describe("useCourse persist migrate (corruption safety)", () => {
  const migrate = useCourse.persist.getOptions().migrate!;

  it("passes through a well-formed persisted blob", () => {
    const out = migrate(
      {
        lessons: {
          scale: { done: true, quiz: { score: 4, total: 5, passed: true } },
        },
      },
      0,
    ) as { lessons: Record<string, unknown> };
    expect(out.lessons.scale).toEqual({
      done: true,
      quiz: { score: 4, total: 5, passed: true },
    });
  });

  it("drops malformed quiz entries but keeps a valid done flag", () => {
    const out = migrate(
      { lessons: { scale: { done: true, quiz: { score: "x" } } } },
      0,
    ) as { lessons: Record<string, unknown> };
    expect(out.lessons.scale).toEqual({ done: true });
  });

  it("drops entries that carry no real progress", () => {
    const out = migrate(
      { lessons: { scale: { done: false }, caged: {} } },
      0,
    ) as { lessons: Record<string, unknown> };
    expect(out.lessons).toEqual({});
  });

  it("falls back to empty when lessons is the wrong type", () => {
    const out = migrate({ lessons: "nope" }, 0) as {
      lessons: Record<string, unknown>;
    };
    expect(out.lessons).toEqual({});
  });

  it("falls back to empty when lessons is an array", () => {
    const out = migrate({ lessons: ["a"] }, 0) as {
      lessons: Record<string, unknown>;
    };
    expect(out.lessons).toEqual({});
  });

  it("tolerates a totally absent persisted state", () => {
    const out = migrate(undefined, 0) as { lessons: Record<string, unknown> };
    expect(out.lessons).toEqual({});
  });
});
