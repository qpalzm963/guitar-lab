// A curated set of guitar licks, each stored as an alphaTex string that the
// AlphaTabPlayer renders (tab + notation) and plays back.
//
// The viewer's differentiator is a TWO-AXIS index: every lick is tagged with a
// `scale` AND a `style`, so learners can browse by either axis. The unions below
// are the closed sets those axes draw from; the data test pins both.
//
// alphaTex primer (only what these licks use):
//   :N        set the current duration (4 = quarter, 8 = eighth, ...)
//   f.s       a note: fret `f` on string `s` (string 1 = high E ... 6 = low E)
//   |         bar line
//   { ... }   per-note effects, e.g. {h} hammer/pull (legato), {b (0 4)} bend
//   \tempo N  score tempo in BPM (metadata header)
// Keep these simple and valid — data.test plus a headless render guard them.

/** Closed set of scales a lick can be tagged with (zh-TW labels for the UI). */
export const SCALES = [
  { id: "minor-pentatonic", label: "小調五聲" },
  { id: "major-pentatonic", label: "大調五聲" },
  { id: "blues", label: "藍調音階" },
  { id: "major", label: "大調音階" },
  { id: "dorian", label: "多里安調式" },
] as const;

/** Closed set of styles a lick can be tagged with (zh-TW labels for the UI). */
export const STYLES = [
  { id: "Blues", label: "藍調" },
  { id: "Rock", label: "搖滾" },
  { id: "Funk", label: "放克" },
  { id: "Pop", label: "流行" },
  { id: "Jazz", label: "爵士" },
] as const;

export type ScaleId = (typeof SCALES)[number]["id"];
export type StyleId = (typeof STYLES)[number]["id"];
export type Difficulty = "初級" | "中級" | "進階";

export interface Lick {
  /** Stable, unique slug. */
  id: string;
  /** zh-TW display title. */
  title: string;
  scale: ScaleId;
  style: StyleId;
  /** Musical key, e.g. "Am", "E", "C". Display-only. */
  key: string;
  difficulty?: Difficulty;
  /**
   * True when the lick deliberately uses chromatic passing/approach tones that
   * fall OUTSIDE its labeled scale (a standard blues/jazz idiom). The viewer
   * badges these so a learner doesn't mistake the chromatic notes for scale
   * tones. Licks WITHOUT this flag must be pure scale content — pinned by
   * data.test ("every note is in the labeled scale unless hasChromatic").
   */
  hasChromatic?: boolean;
  /** Authored tempo in BPM (also embedded in alphaTex via \tempo). */
  tempo: number;
  /** Valid alphaTex source for the lick. */
  alphaTex: string;
}

// Note: ids encode scale+style so they read clearly in the curriculum links and
// stay unique. Each alphaTex repeats \tempo so the embedded score tempo matches
// the `tempo` field (the AlphaTabPlayer speed control scales this reference).
export const LICKS: Lick[] = [
  {
    id: "minor-pentatonic-blues",
    title: "A 小調五聲藍調樂句",
    scale: "minor-pentatonic",
    style: "Blues",
    key: "Am",
    difficulty: "初級",
    tempo: 80,
    // Fix: 7.2 (B-string fret 7 = F#) is OUTSIDE A minor pentatonic; the box-1
    // B-string note is fret 8 (= G). Was 7.2, now 8.2.
    alphaTex: "\\tempo 80 . :8 5.1 8.1 8.2 5.2 7.3 5.3 7.4 5.4 | :4 7.5 5.5 :2 5.6",
  },
  {
    id: "minor-pentatonic-rock",
    title: "A 小調五聲搖滾推弦",
    scale: "minor-pentatonic",
    style: "Rock",
    key: "Am",
    difficulty: "中級",
    tempo: 110,
    alphaTex:
      // Fix: both 7.2 (F#) → 8.2 (G), the in-scale box-1 B-string note (F# is
      // not in A minor pentatonic).
      "\\tempo 110 . :8 8.1{b (0 4)} 5.1 8.2 5.2 | 8.2 5.2 :4 7.3 :2 5.3",
  },
  {
    id: "major-pentatonic-pop",
    title: "G 大調五聲流行樂句",
    scale: "major-pentatonic",
    style: "Pop",
    key: "G",
    difficulty: "初級",
    tempo: 96,
    // Fix: 2.2 (C#) and 5.3 (C) are NOT in G major pentatonic (G A B D E). Kept
    // every original string assignment, corrected only the 3 out-of-scale frets:
    // 2.2→0.2 (B), 5.3→7.3 (D), final 2.2→3.2 (D). Now: G A B D E B | D D.
    alphaTex: "\\tempo 96 . :8 3.1 5.1 0.2 3.2 5.2 4.3 :4 7.3 3.2",
  },
  {
    id: "major-pentatonic-funk",
    title: "E 大調五聲放克切音",
    scale: "major-pentatonic",
    style: "Funk",
    key: "E",
    difficulty: "中級",
    tempo: 100,
    alphaTex: "\\tempo 100 . :16 9.3 11.3 9.3 r :8 9.4 11.4 :4 9.3 r.4",
  },
  {
    id: "blues-blues",
    title: "A 藍調音階經典句",
    scale: "blues",
    style: "Blues",
    key: "A",
    difficulty: "中級",
    tempo: 72,
    // 6.2 (F) and 7.2 (F#) are chromatic passing tones walking E→F→F# — a blues
    // idiom, not A blues scale tones. Kept, and flagged so the UI says so.
    hasChromatic: true,
    alphaTex: "\\tempo 72 . :8 5.1 8.1{b (0 4)} 5.2 6.2 7.2 5.3 :4 7.4 5.4",
  },
  {
    id: "blues-rock",
    title: "E 藍調搖滾樂句",
    scale: "blues",
    style: "Rock",
    key: "E",
    difficulty: "進階",
    tempo: 120,
    // 14.2 (C#, the major 6th) is a chromatic neighbour, not an E blues tone — a
    // common blues-rock colour. Kept, and flagged so the UI says so.
    hasChromatic: true,
    alphaTex:
      "\\tempo 120 . :8 12.1 15.1{h} 12.1 14.2{h} 12.2 | 15.2 12.2 :4 14.3 12.3",
  },
  {
    id: "major-pop",
    title: "C 大調音階流行樂句",
    scale: "major",
    style: "Pop",
    key: "C",
    difficulty: "初級",
    tempo: 90,
    alphaTex: "\\tempo 90 . :8 8.1 10.1 8.2 10.2 12.2 9.3 10.3 12.3",
  },
  {
    id: "major-jazz",
    title: "C 大調爵士行走樂句",
    scale: "major",
    style: "Jazz",
    key: "C",
    difficulty: "進階",
    tempo: 132,
    // 8.3 (Eb, b3) and 9.2 (Ab, b6) are bebop chromatic approach tones, not C
    // major scale tones. Kept (idiomatic for a jazz walking line), and flagged.
    hasChromatic: true,
    alphaTex:
      "\\tempo 132 . :8 8.3 10.3 12.3 9.2 10.2 12.2 13.2 :4 8.1",
  },
  {
    id: "dorian-funk",
    title: "D 多里安放克樂句",
    scale: "dorian",
    style: "Funk",
    key: "Dm",
    difficulty: "中級",
    tempo: 104,
    alphaTex: "\\tempo 104 . :16 10.2 12.2 10.2 r :8 12.3 10.3 :4 12.4 10.4",
  },
  {
    id: "dorian-jazz",
    title: "D 多里安爵士樂句",
    scale: "dorian",
    style: "Jazz",
    key: "Dm",
    difficulty: "進階",
    tempo: 126,
    alphaTex:
      "\\tempo 126 . :8 10.3 12.3{s} 14.3 10.2 12.2 13.2 :4 15.2 12.1",
  },
];

/**
 * Licks matching both axes. A `null`/`undefined` on an axis means "any" for that
 * axis, so the UI can let either selector default to no filter.
 */
export function filterLicks(
  scale?: ScaleId | null,
  style?: StyleId | null,
): Lick[] {
  return LICKS.filter(
    (l) =>
      (scale == null || l.scale === scale) &&
      (style == null || l.style === style),
  );
}
