import { describe, it, expect } from "vitest";
import { CURRICULUM, ALL_ITEMS, TOTAL_ITEMS } from "./data";

// The routes a curriculum item is allowed to link to. A `tool` pointing anywhere
// else means a typo or a stale link to a route that doesn't exist — which would
// 404 in the static export. Keep this list in sync with the app's real routes.
const REAL_ROUTES = new Set([
  "/fretboard",
  "/chords",
  "/caged",
  "/intervals",
  "/practice",
  "/spike/alphatab",
]);

const VALID_CATEGORIES = new Set(["A", "B", "C", "D"]);

const EXPECTED_AREAS = ["音階", "和弦", "節奏訓練", "技巧", "樂句應用", "樂理"];

describe("curriculum data integrity", () => {
  it("has exactly the 6 expected areas, in order", () => {
    expect(CURRICULUM.map((g) => g.area)).toEqual(EXPECTED_AREAS);
  });

  it("every item id is unique across all areas", () => {
    // Duplicate ids would make two lessons share one progress checkbox — toggling
    // one would silently toggle the other. Uniqueness is the store's contract.
    const ids = ALL_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every area has at least one item", () => {
    for (const group of CURRICULUM) {
      expect(group.items.length).toBeGreaterThan(0);
    }
  });

  it("every item has a non-empty title and an area matching its group", () => {
    for (const group of CURRICULUM) {
      for (const item of group.items) {
        expect(item.title.length).toBeGreaterThan(0);
        expect(item.area).toBe(group.area);
      }
    }
  });

  it("every category is one of A/B/C/D", () => {
    for (const item of ALL_ITEMS) {
      expect(VALID_CATEGORIES.has(item.category)).toBe(true);
    }
  });

  it("every set tool points to a real route", () => {
    for (const item of ALL_ITEMS) {
      if (item.tool) expect(REAL_ROUTES.has(item.tool)).toBe(true);
    }
  });

  it("a tool-backed item is never lesson-only (C)", () => {
    // A live tool means the learner can DO something interactive (A), look it up
    // (B), or view notation (D) — never a passive lesson page (C). A C item with
    // a tool link would render a 課程 badge next to a working tool, which is the
    // mislabel this guards against. (B is allowed: e.g. 和弦概念 → /chords.)
    for (const item of ALL_ITEMS) {
      if (item.tool) expect(item.category).not.toBe("C");
    }
  });

  it("TOTAL_ITEMS equals the flattened item count", () => {
    expect(TOTAL_ITEMS).toBe(ALL_ITEMS.length);
    expect(TOTAL_ITEMS).toBeGreaterThan(0);
  });
});
