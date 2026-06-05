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

// One lick per scale × style cell (25 total). Each is original and curated to a
// teacher's standard: every note sits in the labeled scale unless flagged
// hasChromatic (honest), each alphaTex sums to whole 4/4 bars and parses in
// alphaTab, and the line is idiomatic for its style (jazz uses guide-tone
// enclosures, pop resolves by step, funk is syncopated, blues bends/blue-notes).
// ids encode scale+style so they stay unique and read clearly in curriculum links.
export const LICKS: Lick[] = [
  // --- minor-pentatonic ---
  {
    id: "minor-pentatonic-blues",
    title: "A 小調五聲藍調樂句",
    scale: "minor-pentatonic",
    style: "Blues",
    key: "Am",
    difficulty: "初級",
    tempo: 80,
    alphaTex: "\\tempo 80 . :8 5.1 8.1 8.2{b (0 4)} 5.2 7.3 5.3 7.4 5.4 | :4 7.5 5.5 :2 5.6",
  },
  {
    id: "minor-pentatonic-rock",
    title: "A 小調五聲搖滾推弦",
    scale: "minor-pentatonic",
    style: "Rock",
    key: "Am",
    difficulty: "中級",
    tempo: 110,
    alphaTex: "\\tempo 110 . :8 8.2{b (0 4)} 8.2 5.2 8.1 5.1 8.2 5.2 8.1 | :8 5.1 8.2 5.2 7.3 :2 5.3",
  },
  {
    id: "minor-pentatonic-funk",
    title: "A 小調五聲放克切音",
    scale: "minor-pentatonic",
    style: "Funk",
    key: "Am",
    difficulty: "中級",
    tempo: 104,
    alphaTex: "\\tempo 104 . :16 7.4 r 7.4 5.4 :8 7.3 r :16 5.3 r 7.4 5.4 :8 5.5 r | :16 5.3 7.3 r 5.3 :8 7.4 5.4 :4 7.5 :8 5.5 r",
  },
  {
    id: "minor-pentatonic-pop",
    title: "A 小調五聲流行樂句",
    scale: "minor-pentatonic",
    style: "Pop",
    key: "Am",
    difficulty: "初級",
    tempo: 92,
    alphaTex: "\\tempo 92 . :8 9.3 8.2 10.2 8.2 :4 9.3 5.2 | :8 5.3 7.3 9.3 7.3 :8 8.2 10.2 :4 10.2",
  },
  {
    id: "minor-pentatonic-jazz",
    title: "A 小調五聲爵士樂句",
    scale: "minor-pentatonic",
    style: "Jazz",
    key: "Am",
    difficulty: "進階",
    // 6.4 (Ab) is a chromatic leading-tone approach resolving up to A (7.4) — a
    // bebop enclosure move outside A minor pentatonic, so flagged.
    hasChromatic: true,
    tempo: 120,
    alphaTex: "\\tempo 120 . :8 5.4 7.4 :16 5.3 7.3 :8 9.3 6.4 7.4 :4 5.3",
  },

  // --- major-pentatonic ---
  {
    id: "major-pentatonic-blues",
    title: "G 大調五聲藍調樂句",
    scale: "major-pentatonic",
    style: "Blues",
    key: "G",
    difficulty: "中級",
    tempo: 88,
    alphaTex: "\\tempo 88 . :8 3.1 5.1{b (0 4)} 3.1 0.1 3.2 0.2 5.2 3.2 | :8 0.2 8.2 5.2 3.2 :8 0.2 3.1 :4 3.1",
  },
  {
    id: "major-pentatonic-rock",
    title: "G 大調五聲搖滾推弦",
    scale: "major-pentatonic",
    style: "Rock",
    key: "G",
    difficulty: "中級",
    tempo: 116,
    alphaTex: "\\tempo 116 . :8 7.3{b (0 4)} 9.3 7.3{b (0 4)} 9.3 :8 7.3 4.3 2.3 0.3 | :8 5.4 7.4 5.4 2.3 :8 4.3 0.3 :4 3.1",
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
    id: "major-pentatonic-pop",
    title: "G 大調五聲流行樂句",
    scale: "major-pentatonic",
    style: "Pop",
    key: "G",
    difficulty: "初級",
    tempo: 96,
    alphaTex: "\\tempo 96 . :8 0.1 3.1 5.1 3.1 :4 0.1 7.1 | :8 4.3 2.3 0.3 2.3 :2 0.3",
  },
  {
    id: "major-pentatonic-jazz",
    title: "G 大調五聲爵士導音樂句",
    scale: "major-pentatonic",
    style: "Jazz",
    key: "G",
    difficulty: "進階",
    // Encloses the 3rd of Gmaj7 (B) with chromatic approach tones, then resolves
    // and holds it — out-of-scale approaches, so flagged.
    hasChromatic: true,
    tempo: 126,
    alphaTex: "\\tempo 126 . :8 8.2 10.2 8.3 9.3 :16 13.2 11.2 :8 12.2 :4 8.2 | :8 10.2 12.2 9.3 12.3 :2 12.2",
  },

  // --- blues ---
  {
    id: "blues-blues",
    title: "A 藍調音階經典句",
    scale: "blues",
    style: "Blues",
    key: "A",
    difficulty: "中級",
    // E-F-F# is a chromatic passing walk (F, F# are outside the A blues scale) —
    // a blues idiom, so flagged.
    hasChromatic: true,
    tempo: 72,
    alphaTex: "\\tempo 72 . :8 5.1 8.1{b (0 4)} 5.2 6.2 7.2 8.2 :4 5.3 | :8 7.4 5.4 7.4 10.4 :8 13.4 12.4 :4 7.4",
  },
  {
    id: "blues-rock",
    title: "E 藍調搖滾樂句",
    scale: "blues",
    style: "Rock",
    key: "E",
    // 14.2 (C#, the major 6th) is a chromatic neighbour, not an E blues tone — a
    // common blues-rock colour, so flagged.
    hasChromatic: true,
    difficulty: "進階",
    tempo: 120,
    alphaTex: "\\tempo 120 . :8 12.1 15.1{h} 12.1 14.2{h} 12.2 15.2 12.2 14.3 | :8 12.3 14.3 12.3 9.4 :8 8.4 9.4 :4 14.4",
  },
  {
    id: "blues-funk",
    title: "A 藍調音階放克樂句",
    scale: "blues",
    style: "Funk",
    key: "A",
    difficulty: "中級",
    tempo: 96,
    alphaTex: "\\tempo 96 . :16 5.4 6.5 7.5 r :8 5.3 8.3 :16 5.2 4.2 r 5.2 :4 5.1",
  },
  {
    id: "blues-pop",
    title: "A 藍調音階流行樂句",
    scale: "blues",
    style: "Pop",
    key: "A",
    difficulty: "初級",
    tempo: 84,
    alphaTex: "\\tempo 84 . :8 7.4 5.3 7.3 8.3 9.3 7.3 :4 5.3 | :8 5.3 7.4 5.4 7.4 :2 7.4",
  },
  {
    id: "blues-jazz",
    title: "A 屬七藍調爵士樂句",
    scale: "blues",
    style: "Jazz",
    key: "A",
    difficulty: "進階",
    // 6.3 (Db) is a chromatic approach into the 3rd (C#-ish) target over A7;
    // outside the A blues scale, so flagged.
    hasChromatic: true,
    tempo: 138,
    alphaTex: "\\tempo 138 . :8 2.3 5.3 7.3 8.3 :16 9.3 7.3 :8 5.3 6.3 7.3 | :8 9.3 12.3 9.3 7.3 :4 5.3 :8 2.3 r",
  },

  // --- major (Ionian) ---
  {
    id: "major-blues",
    title: "C 大調音階藍調樂句",
    scale: "major",
    style: "Blues",
    key: "C",
    difficulty: "中級",
    tempo: 80,
    alphaTex: "\\tempo 80 . :8 8.2 10.2{b (0 4)} 8.2 6.2 5.2 6.2 8.2 10.2 | :8 12.2 13.2 12.2 10.2 :8 8.2 6.2 :4 8.1",
  },
  {
    id: "major-rock",
    title: "C 大調音階搖滾樂句",
    scale: "major",
    style: "Rock",
    key: "C",
    difficulty: "中級",
    tempo: 120,
    alphaTex: "\\tempo 120 . :8 8.1 10.1 12.1 8.2{h} 10.2 12.2 13.2 10.3 | :8 12.3 9.3 7.4 9.4 10.4 9.4 :4 8.1",
  },
  {
    id: "major-funk",
    title: "C 大調音階放克樂句",
    scale: "major",
    style: "Funk",
    key: "C",
    difficulty: "中級",
    tempo: 108,
    alphaTex: "\\tempo 108 . :8 8.2 :16 10.2 8.2 :8 6.2 5.2 :2 r | :16 12.1 10.1 8.1 7.1 :8 5.1 3.1 :8 8.1 7.1 :4 8.1",
  },
  {
    id: "major-pop",
    title: "C 大調音階流行樂句",
    scale: "major",
    style: "Pop",
    key: "C",
    difficulty: "初級",
    tempo: 90,
    alphaTex: "\\tempo 90 . :8 8.2 5.2 8.1 5.1 :4 9.3 10.3 | :8 12.3 10.3 9.3 8.2 :8 5.2 10.1 :4 8.1",
  },
  {
    id: "major-jazz",
    title: "C 大調爵士導音樂句",
    scale: "major",
    style: "Jazz",
    key: "C",
    difficulty: "進階",
    // Bebop enclosures: F+Eb around the 3rd (E), then C+Bb around the 7th (B),
    // resolving to C. Eb/Bb are out-of-scale approach tones, so flagged.
    hasChromatic: true,
    tempo: 132,
    alphaTex: "\\tempo 132 . :8 3.2 5.2 8.2 10.2 :8 6.2 :16 4.2 5.2 :4 5.2 | :8 7.3 9.3 12.3 14.3 :16 13.2 11.2 :8 12.2 :4 13.2",
  },

  // --- dorian ---
  {
    id: "dorian-blues",
    title: "D 多里安藍調樂句",
    scale: "dorian",
    style: "Blues",
    key: "Dm",
    difficulty: "中級",
    tempo: 76,
    alphaTex: "\\tempo 76 . :8 12.4 14.4 15.4{b (0 4)} 14.4 12.4 10.4 :4 12.4 | :8 15.4 14.4 12.4 10.4 :8 9.4 10.4 :4 12.4",
  },
  {
    id: "dorian-rock",
    title: "D 多里安搖滾樂句",
    scale: "dorian",
    style: "Rock",
    key: "Dm",
    difficulty: "中級",
    tempo: 118,
    alphaTex: "\\tempo 118 . :8 12.4 14.4 15.4{b (0 4)} 12.4 :16 9.4 12.4 :8 14.4 :4 12.4",
  },
  {
    id: "dorian-funk",
    title: "D 多里安放克樂句",
    scale: "dorian",
    style: "Funk",
    key: "Dm",
    difficulty: "中級",
    tempo: 104,
    alphaTex: "\\tempo 104 . :8 12.4 :16 10.4 12.4 :8 r 14.4 :16 12.4 10.4 9.4 r :4 12.4",
  },
  {
    id: "dorian-pop",
    title: "D 多里安流行樂句",
    scale: "dorian",
    style: "Pop",
    key: "Dm",
    difficulty: "初級",
    tempo: 96,
    alphaTex: "\\tempo 96 . :8 12.4 14.4 12.4 10.4 :4 9.4 :8 12.4 14.4 | :8 12.4 10.4 9.4 10.4 :8 9.4 10.4 :4 12.4",
  },
  {
    id: "dorian-jazz",
    title: "D 多里安爵士導音樂句",
    scale: "dorian",
    style: "Jazz",
    key: "Dm",
    difficulty: "進階",
    // Encloses the b3 (F) then approaches the b7 (C) over Dm7 with chromatic
    // tones, resolving to D. Out-of-scale approaches, so flagged.
    hasChromatic: true,
    tempo: 126,
    alphaTex: "\\tempo 126 . :8 7.3 9.3 :16 11.3 10.3 :8 9.3 10.3 12.3 :4 10.3 | :8 5.4 7.4 9.4 10.4 :16 11.4 10.4 :8 12.4 :4 12.4",
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
