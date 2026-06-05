import { describe, it, expect } from "vitest";
import { Scale, Chord, Key, Interval, Note } from "tonal";
import { LESSONS, ORDERED_LESSONS, TOTAL_LESSONS, getLesson } from "./data";
import { LESSON_CONTENT } from "./lessonContent";
import { ALL_ITEMS } from "@/lib/curriculum/data";

// Routes a lesson tool link is allowed to point to. A tool pointing anywhere else
// means a typo or a stale link that would 404 in the static export. Mirrors the
// guard in lib/curriculum/data.test.ts; kept in sync with the app's real routes.
const REAL_ROUTES = new Set([
  "/fretboard",
  "/chords",
  "/caged",
  "/intervals",
  "/harmony",
  "/practice",
  "/licks",
  "/spike/alphatab",
]);

const CURRICULUM_IDS = new Set(ALL_ITEMS.map((i) => i.id));

describe("course data integrity", () => {
  it("has exactly 6 lessons", () => {
    expect(LESSONS.length).toBe(6);
    expect(TOTAL_LESSONS).toBe(6);
  });

  it("every lesson slug is unique", () => {
    // Slugs are the dynamic route segment AND the progress-store key. A duplicate
    // would make two lessons resolve to one page and share one 完成 flag.
    const slugs = LESSONS.map((l) => l.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every lesson order is unique and they cover 1..6", () => {
    const orders = LESSONS.map((l) => l.order).sort((a, b) => a - b);
    expect(orders).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("ORDERED_LESSONS is sorted by order", () => {
    const orders = ORDERED_LESSONS.map((l) => l.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("lessons are in the rebuilt teaching order", () => {
    // The point of the rebuild: physical fundamentals first, then the theory
    // spine intervals → scales → chords → diatonic, then CAGED as the capstone.
    // Pinning the exact slug sequence (not just that orders are the set {1..6})
    // guards the deliverable — a swapped order would still pass the set check.
    expect(ORDERED_LESSONS.map((l) => l.slug)).toEqual([
      "basics",
      "intervals",
      "scale",
      "chord-system",
      "diatonic",
      "caged",
    ]);
  });

  it("every lesson has written content with objectives and sections", () => {
    // Lesson metadata (data.ts) and its prose (lessonContent.ts) live in two
    // files with no compile-time link: a lesson can exist in LESSONS while its
    // LESSON_CONTENT entry is missing or mistyped, and the page would render a
    // hollow body (LessonView guards `content &&`) while the build and every
    // other test stay green. This guards that every lesson has real content.
    for (const l of LESSONS) {
      const content = LESSON_CONTENT[l.slug];
      expect(content, `missing LESSON_CONTENT["${l.slug}"]`).toBeDefined();
      if (!content) continue;
      expect(content.objectives.length).toBeGreaterThan(0);
      expect(content.sections.length).toBeGreaterThan(0);
      expect(content.sections.every((s) => s.heading.length > 0)).toBe(true);
      expect(content.sections.every((s) => s.paragraphs.length > 0)).toBe(true);
    }
  });

  it("getLesson resolves a known slug and rejects an unknown one", () => {
    expect(getLesson("scale")?.slug).toBe("scale");
    expect(getLesson("does-not-exist")).toBeUndefined();
  });

  it("every lesson has a non-empty title, summary and >= 1 chapter", () => {
    for (const l of LESSONS) {
      expect(l.title.length).toBeGreaterThan(0);
      expect(l.summary.length).toBeGreaterThan(0);
      expect(l.chapters.length).toBeGreaterThan(0);
      expect(l.chapters.every((c) => c.length > 0)).toBe(true);
    }
  });

  it("every curriculumItemId exists in the curriculum", () => {
    // A stale id would link a lesson to a curriculum item that no longer exists,
    // silently breaking the course ↔ map cross-reference.
    for (const l of LESSONS) {
      expect(l.curriculumItemIds.length).toBeGreaterThan(0);
      for (const id of l.curriculumItemIds) {
        expect(CURRICULUM_IDS.has(id)).toBe(true);
      }
    }
  });

  it("every tool route is a real app route", () => {
    for (const l of LESSONS) {
      expect(l.tools.length).toBeGreaterThan(0);
      for (const t of l.tools) {
        expect(REAL_ROUTES.has(t)).toBe(true);
      }
    }
  });

  it("every toolParams key is one of the lesson's tools and its value is a query string", () => {
    // toolParams supplies deep-link query strings appended to tool links in
    // LessonView. A key that isn't in `tools` would never render (dead config);
    // a value not starting with "?" would corrupt the href. This guards both so
    // the lesson → tool deep-links actually fire.
    for (const l of LESSONS) {
      if (!l.toolParams) continue;
      const toolSet = new Set(l.tools);
      for (const [route, query] of Object.entries(l.toolParams)) {
        expect(toolSet.has(route as (typeof l.tools)[number])).toBe(true);
        expect(query.startsWith("?")).toBe(true);
      }
    }
  });
});

describe("course quizzes", () => {
  it("every lesson has >= 3 questions", () => {
    for (const l of LESSONS) {
      expect(l.quiz.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("every question id is unique within its lesson", () => {
    for (const l of LESSONS) {
      const ids = l.quiz.map((q) => q.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("every question has >= 2 options and a valid answer index", () => {
    // An out-of-range answer index would make the question unscorable — the
    // learner could never get it right. This is the core quiz invariant.
    for (const l of LESSONS) {
      for (const q of l.quiz) {
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.options.every((o) => o.length > 0)).toBe(true);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
        expect(q.prompt.length).toBeGreaterThan(0);
        expect(q.explanation.length).toBeGreaterThan(0);
      }
    }
  });
});

// Sanity-check that the theory behind a few authored answers is actually correct,
// using tonal as the source of truth. These guard against an answer drifting from
// the music theory it claims to teach (Rule 9: tests encode WHY, not just WHAT).
describe("quiz answers are theory-correct (tonal cross-check)", () => {
  function correctText(lessonSlug: string, questionId: string): string {
    const q = getLesson(lessonSlug)!.quiz.find((x) => x.id === questionId)!;
    return q.options[q.answer];
  }

  it("C major scale is C D E F G A B", () => {
    expect(Scale.get("C major").notes).toEqual([
      "C",
      "D",
      "E",
      "F",
      "G",
      "A",
      "B",
    ]);
    // The marked-correct option spells exactly that.
    expect(correctText("scale", "scale-q2")).toContain("C D E F G A B");
  });

  it("A minor pentatonic is A C D E G", () => {
    expect(Scale.get("A minor pentatonic").notes).toEqual([
      "A",
      "C",
      "D",
      "E",
      "G",
    ]);
    expect(correctText("scale", "scale-q3")).toContain("A C D E G");
  });

  it("Cmaj7 is C E G B", () => {
    expect(Chord.get("Cmaj7").notes).toEqual(["C", "E", "G", "B"]);
    expect(correctText("chord-system", "chord-q3")).toContain("C E G B");
  });

  it("V7 in C major is G7", () => {
    expect(Key.majorKey("C").chords[4]).toBe("G7");
    expect(correctText("diatonic", "diatonic-q3")).toContain("G7");
  });

  it("ii–V–I in C major is Dm7 – G7 – Cmaj7", () => {
    const chords = Key.majorKey("C").chords;
    expect([chords[1], chords[4], chords[0]]).toEqual([
      "Dm7",
      "G7",
      "Cmaj7",
    ]);
    const text = correctText("diatonic", "diatonic-q4");
    expect(text).toContain("Dm7");
    expect(text).toContain("G7");
    expect(text).toContain("Cmaj7");
  });

  it("a major 3rd is 4 semitones (intervals-q2)", () => {
    expect(Interval.semitones("3M")).toBe(4);
    expect(correctText("intervals", "intervals-q2")).toContain("4 個半音");
  });

  it("C up a perfect 5th is G (intervals-q3)", () => {
    expect(Note.transpose("C", "5P")).toBe("G");
    expect(correctText("intervals", "intervals-q3")).toContain("G");
  });

  it("an octave is 12 semitones (intervals-q4)", () => {
    expect(Interval.semitones("8P")).toBe(12);
    expect(correctText("intervals", "intervals-q4")).toContain("12 個半音");
  });

  it("Cm7b5 is C Eb Gb Bb (chord-q6)", () => {
    expect(Chord.get("Cm7b5").notes).toEqual(["C", "Eb", "Gb", "Bb"]);
    expect(correctText("chord-system", "chord-q6")).toContain("C Eb Gb Bb");
  });
});
