import { describe, it, expect, beforeEach, vi } from "vitest";

// Mirror diagrams.test.ts: the store binds to createJSONStorage(() =>
// localStorage) at module load, and the node env has no localStorage. Install a
// tiny in-memory stub via vi.hoisted so it exists BEFORE the useProgress import.
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

import { useProgress } from "./progress";

beforeEach(() => {
  // Reset to "nothing learned" before each test for isolation.
  useProgress.setState({ done: {} });
});

describe("useProgress toggle / isDone", () => {
  it("toggle adds an id; isDone then reports true", () => {
    expect(useProgress.getState().isDone("scale-major")).toBe(false);
    useProgress.getState().toggle("scale-major");
    expect(useProgress.getState().isDone("scale-major")).toBe(true);
    expect(useProgress.getState().doneCount()).toBe(1);
  });

  it("toggle again removes the id; isDone reports false", () => {
    // toggle is the single 已學 checkbox action — a second click must un-mark,
    // not double-add. This is the behavior the UI checkbox depends on.
    useProgress.getState().toggle("scale-major");
    useProgress.getState().toggle("scale-major");
    expect(useProgress.getState().isDone("scale-major")).toBe(false);
    expect(useProgress.getState().doneCount()).toBe(0);
  });

  it("tracks several ids independently", () => {
    useProgress.getState().toggle("a");
    useProgress.getState().toggle("b");
    expect(useProgress.getState().doneCount()).toBe(2);
    useProgress.getState().toggle("a");
    expect(useProgress.getState().isDone("a")).toBe(false);
    expect(useProgress.getState().isDone("b")).toBe(true);
    expect(useProgress.getState().doneCount()).toBe(1);
  });

  it("clearAll empties all progress", () => {
    useProgress.getState().toggle("a");
    useProgress.getState().toggle("b");
    useProgress.getState().clearAll();
    expect(useProgress.getState().doneCount()).toBe(0);
    expect(useProgress.getState().isDone("a")).toBe(false);
  });
});

describe("useProgress persist migrate (corruption safety)", () => {
  const migrate = useProgress.persist.getOptions().migrate!;

  it("passes through a well-formed persisted blob", () => {
    const out = migrate({ done: { x: true, y: true } }, 0) as {
      done: Record<string, true>;
    };
    expect(Object.keys(out.done).sort()).toEqual(["x", "y"]);
  });

  it("drops non-true values from a partly-garbage blob", () => {
    // A hand-edited or partially-written blob may hold junk values. Only exact
    // `true` survives so isDone never returns a truthy-but-wrong value.
    const out = migrate(
      { done: { keep: true, no: false, num: 1, str: "yes", nul: null } },
      0,
    ) as { done: Record<string, true> };
    expect(out.done).toEqual({ keep: true });
  });

  it("falls back to empty when done is the wrong type", () => {
    const out = migrate({ done: "not-an-object" }, 0) as {
      done: Record<string, true>;
    };
    expect(out.done).toEqual({});
  });

  it("falls back to empty when done is an array", () => {
    const out = migrate({ done: ["a", "b"] }, 0) as {
      done: Record<string, true>;
    };
    expect(out.done).toEqual({});
  });

  it("tolerates a totally absent persisted state", () => {
    const out = migrate(undefined, 0) as { done: Record<string, true> };
    expect(out.done).toEqual({});
  });
});
