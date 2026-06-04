import { describe, it, expect, beforeEach, vi } from "vitest";

// The store persists via createJSONStorage(() => localStorage) (same shape as
// settings.ts), and zustand captures that storage when the store module loads.
// The node test env has no localStorage, so install a tiny in-memory stub via
// vi.hoisted — it runs BEFORE the useDiagrams import below, so the store binds
// to it. We keep the node env (fast) and leave the store byte-identical to prod.
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

import { useDiagrams, type SavedDiagram } from "./diagrams";
import type { Marker } from "@/lib/theory/types";

// The store is plain zustand; we drive it via getState() outside React.

const rootMarker: Marker = {
  string: 5,
  fret: 3,
  pitchClass: "G",
  role: "root",
  isRoot: true,
};

function makeDiagram(over: Partial<SavedDiagram> = {}): SavedDiagram {
  return {
    id: "d1",
    name: "練習一",
    title: "C 大調音階",
    createdAt: 1000,
    updatedAt: 1000,
    tuning: ["E4", "B3", "G3", "D3", "A2", "E2"],
    toFret: 15,
    markers: [rootMarker],
    ...over,
  };
}

beforeEach(() => {
  // Reset to an empty library before each test for isolation.
  useDiagrams.setState({ diagrams: [] });
});

describe("useDiagrams CRUD", () => {
  it("add → diagram is present", () => {
    useDiagrams.getState().add(makeDiagram());
    const { diagrams } = useDiagrams.getState();
    expect(diagrams).toHaveLength(1);
    expect(diagrams[0].id).toBe("d1");
    expect(diagrams[0].markers[0].isRoot).toBe(true);
  });

  it("update → patches fields and bumps updatedAt", () => {
    useDiagrams.getState().add(makeDiagram());
    const before = useDiagrams.getState().diagrams[0].updatedAt;
    useDiagrams.getState().update("d1", { name: "改名" });
    const after = useDiagrams.getState().diagrams[0];
    // The point of update is an edit-in-place that records when it happened:
    // the name must change AND updatedAt must advance past the original.
    expect(after.name).toBe("改名");
    expect(after.updatedAt).toBeGreaterThan(before);
  });

  it("update on an unknown id is a no-op (does not create)", () => {
    useDiagrams.getState().add(makeDiagram());
    useDiagrams.getState().update("nope", { name: "x" });
    expect(useDiagrams.getState().diagrams).toHaveLength(1);
    expect(useDiagrams.getState().diagrams[0].name).toBe("練習一");
  });

  it("remove → diagram is gone", () => {
    useDiagrams.getState().add(makeDiagram());
    useDiagrams.getState().remove("d1");
    expect(useDiagrams.getState().diagrams).toHaveLength(0);
  });

  it("clearAll → empties the library", () => {
    useDiagrams.getState().add(makeDiagram({ id: "a" }));
    useDiagrams.getState().add(makeDiagram({ id: "b" }));
    useDiagrams.getState().clearAll();
    expect(useDiagrams.getState().diagrams).toHaveLength(0);
  });
});

describe("useDiagrams import/export", () => {
  it("exportJson → importJson round-trips an exact snapshot", () => {
    useDiagrams.getState().add(makeDiagram({ id: "a", name: "甲" }));
    useDiagrams.getState().add(makeDiagram({ id: "b", name: "乙" }));
    const json = useDiagrams.getState().exportJson();

    // Wipe, then restore from the backup — the library must be identical.
    useDiagrams.getState().clearAll();
    const res = useDiagrams.getState().importJson(json);
    expect(res.ok).toBe(true);
    expect(useDiagrams.getState().diagrams).toHaveLength(2);
    expect(useDiagrams.getState().diagrams.map((d) => d.name)).toEqual([
      "甲",
      "乙",
    ]);
  });

  it("importJson replaces (not merges) the current library", () => {
    // Replace semantics are the contract a backup restore relies on: importing
    // must yield exactly the backup, not the backup plus whatever was there.
    useDiagrams.getState().add(makeDiagram({ id: "old" }));
    const json = JSON.stringify([makeDiagram({ id: "new" })]);
    useDiagrams.getState().importJson(json);
    expect(useDiagrams.getState().diagrams.map((d) => d.id)).toEqual(["new"]);
  });

  it("importJson on non-JSON returns {ok:false} and does not throw", () => {
    useDiagrams.getState().add(makeDiagram());
    let res: { ok: boolean; error?: string } | undefined;
    expect(() => {
      res = useDiagrams.getState().importJson("}{not json");
    }).not.toThrow();
    expect(res?.ok).toBe(false);
    // The existing library must be untouched on a failed import.
    expect(useDiagrams.getState().diagrams).toHaveLength(1);
  });

  it("importJson on valid JSON of the wrong shape returns {ok:false}", () => {
    // Valid JSON but not a SavedDiagram[] — a marker is missing required keys.
    const garbage = JSON.stringify([{ id: "x", name: "y", markers: [{}] }]);
    const res = useDiagrams.getState().importJson(garbage);
    expect(res.ok).toBe(false);
    expect(useDiagrams.getState().diagrams).toHaveLength(0);
  });
});

describe("useDiagrams persist migrate (corruption safety)", () => {
  // Exercise the migrate path directly via the persist API. This is where a
  // version bump and the corrupt-blob fallback both run on rehydrate.
  const migrate = useDiagrams.persist.getOptions().migrate!;

  it("passes through a well-formed persisted blob", () => {
    const good = { diagrams: [makeDiagram()] };
    const out = migrate(good, 0) as { diagrams: SavedDiagram[] };
    expect(out.diagrams).toHaveLength(1);
    expect(out.diagrams[0].id).toBe("d1");
  });

  it("falls back to an empty library when the blob is malformed", () => {
    // A corrupt persisted blob (e.g. partial write) must not crash — it must
    // degrade to an empty, usable library.
    const corrupt = { diagrams: "not-an-array" };
    const out = migrate(corrupt, 0) as { diagrams: SavedDiagram[] };
    expect(out.diagrams).toEqual([]);
  });

  it("keeps the valid diagrams and drops only the corrupt entry", () => {
    // Data-loss guard: under the old all-or-nothing parse, ONE bad entry threw
    // away the user's entire library on rehydrate. Migrate must preserve every
    // valid diagram and discard only the malformed one.
    const mixed = {
      diagrams: [makeDiagram({ id: "ok" }), { id: "bad", markers: "nope" }],
    };
    const out = migrate(mixed, 0) as { diagrams: SavedDiagram[] };
    expect(out.diagrams).toHaveLength(1);
    expect(out.diagrams[0].id).toBe("ok");
  });

  it("tolerates a totally absent persisted state", () => {
    const out = migrate(undefined, 0) as { diagrams: SavedDiagram[] };
    expect(out.diagrams).toEqual([]);
  });
});
