import { describe, it, expect } from "vitest";
import { parseSearch, pickAllowed } from "./useInitialParams";

// These are the pure pieces of the deep-link helper. The mount hook itself only
// wires window.location.search into parseSearch, so testing parse + validate
// covers the logic that decides whether a deep-link param is applied or ignored.
// WHY this matters: a bad param must NEVER reach the theory layer (it would
// produce an empty board); valid params must be applied so lessons can
// pre-select a subject. These tests pin that "valid → applied / invalid →
// ignored" contract.

describe("parseSearch", () => {
  it("parses a query string into a flat map", () => {
    expect(parseSearch("?root=C&scale=major")).toEqual({
      root: "C",
      scale: "major",
    });
  });

  it("handles a leading-? omission and empty input", () => {
    expect(parseSearch("root=Eb")).toEqual({ root: "Eb" });
    expect(parseSearch("")).toEqual({});
  });

  it("URL-decodes values (e.g. encoded sharp)", () => {
    // "F#" arrives encoded as F%23; the picker stores the decoded "F#".
    expect(parseSearch("?root=F%23")).toEqual({ root: "F#" });
  });
});

describe("pickAllowed", () => {
  const allowed = ["C", "Db", "Eb"];

  it("returns the value when it is in the allowed set (applied)", () => {
    expect(pickAllowed({ root: "Eb" }, "root", allowed)).toBe("Eb");
  });

  it("returns undefined for a value not in the allowed set (ignored)", () => {
    // "H" is not a note — must be ignored so the caller keeps its default.
    expect(pickAllowed({ root: "H" }, "root", allowed)).toBeUndefined();
  });

  it("returns undefined when the key is missing (ignored)", () => {
    expect(pickAllowed({ scale: "major" }, "root", allowed)).toBeUndefined();
  });

  it("accepts a Set as the allowed collection", () => {
    expect(pickAllowed({ t: "maj7" }, "t", new Set(["maj7", "m7"]))).toBe(
      "maj7",
    );
    expect(
      pickAllowed({ t: "bogus" }, "t", new Set(["maj7", "m7"])),
    ).toBeUndefined();
  });
});
