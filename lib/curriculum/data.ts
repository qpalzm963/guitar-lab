// The music-school curriculum encoded as structured data: the 6 areas, each an
// ordered list of items. This is the browsable "spine" the curriculum page
// renders, and the single source of truth that links lessons to the built tools.
//
// Categories describe what KIND of thing an item is, independent of whether a
// tool exists yet:
//   A 互動 — interactive (a tool visualizes/explores it)
//   B 參考 — reference (lookup / chart material)
//   C 課程 — lesson content (taught material, no interactive tool)
//   D 譜例 — tab / notation (shown as notation)
// `tool` is set ONLY when one of the already-built tools covers the item; items
// without a tool render as 規劃中 (planned for a later phase).

export type CurriculumArea =
  | "音階"
  | "和弦"
  | "節奏訓練"
  | "技巧"
  | "樂句應用"
  | "樂理";

export type CurriculumCategory = "A" | "B" | "C" | "D";

/** Routes a curriculum item may link to. Kept in sync with the app's routes. */
export type CurriculumTool =
  | "/fretboard"
  | "/chords"
  | "/caged"
  | "/intervals"
  | "/harmony"
  | "/practice"
  | "/licks"
  | "/spike/alphatab";

export interface CurriculumItem {
  /** Stable slug, unique across all areas. Used as the progress key. */
  id: string;
  area: CurriculumArea;
  title: string;
  category: CurriculumCategory;
  /** Set only when a built tool covers this item; otherwise undefined (規劃中). */
  tool?: CurriculumTool;
}

export interface CurriculumAreaGroup {
  area: CurriculumArea;
  items: CurriculumItem[];
}

// Short zh-TW legend for the category badges, shown once on the page.
export const CATEGORY_LEGEND: { id: CurriculumCategory; label: string }[] = [
  { id: "A", label: "互動工具" },
  { id: "B", label: "參考資料" },
  { id: "C", label: "課程內容" },
  { id: "D", label: "譜例" },
];

export const CURRICULUM: CurriculumAreaGroup[] = [
  {
    area: "音階",
    items: [
      { id: "scale-concept", area: "音階", title: "音階概念", category: "A", tool: "/fretboard" },
      { id: "scale-structure", area: "音階", title: "音階結構", category: "A", tool: "/fretboard" },
      { id: "scale-major", area: "音階", title: "大調音階", category: "A", tool: "/fretboard" },
      { id: "scale-natural-minor", area: "音階", title: "自然小調", category: "A", tool: "/fretboard" },
      { id: "scale-harmonic-minor", area: "音階", title: "和聲小調", category: "A", tool: "/fretboard" },
      { id: "scale-melodic-minor", area: "音階", title: "旋律小調", category: "A", tool: "/fretboard" },
      { id: "scale-pentatonic", area: "音階", title: "五聲音階", category: "A", tool: "/fretboard" },
      { id: "scale-blues", area: "音階", title: "藍調音階", category: "A", tool: "/fretboard" },
      { id: "scale-ionian", area: "音階", title: "Ionian", category: "A", tool: "/fretboard" },
      { id: "scale-dorian", area: "音階", title: "Dorian", category: "A", tool: "/fretboard" },
      { id: "scale-phrygian", area: "音階", title: "Phrygian", category: "A", tool: "/fretboard" },
      { id: "scale-lydian", area: "音階", title: "Lydian", category: "A", tool: "/fretboard" },
      { id: "scale-mixolydian", area: "音階", title: "Mixolydian", category: "A", tool: "/fretboard" },
      { id: "scale-aeolian", area: "音階", title: "Aeolian", category: "A", tool: "/fretboard" },
      { id: "scale-locrian", area: "音階", title: "Locrian", category: "A", tool: "/fretboard" },
      // 減音階 / 全音音階 / Altered: tonal supports these but the fretboard tool's
      // scale picker doesn't list them yet → lesson content for now.
      { id: "scale-diminished", area: "音階", title: "減音階", category: "C" },
      { id: "scale-whole-tone", area: "音階", title: "全音音階", category: "C" },
      { id: "scale-altered", area: "音階", title: "Altered scale", category: "C" },
    ],
  },
  {
    area: "和弦",
    items: [
      { id: "chord-concept", area: "和弦", title: "和弦概念", category: "B", tool: "/chords" },
      { id: "chord-structure", area: "和弦", title: "和弦結構", category: "A", tool: "/chords" },
      { id: "chord-diatonic-concept", area: "和弦", title: "順階和弦概念", category: "C" },
      { id: "chord-power", area: "和弦", title: "強力和弦", category: "C" },
      { id: "chord-major-triad", area: "和弦", title: "大三和弦", category: "A", tool: "/chords" },
      { id: "chord-minor-triad", area: "和弦", title: "小三和弦", category: "A", tool: "/chords" },
      { id: "chord-sus", area: "和弦", title: "掛留和弦", category: "A", tool: "/chords" },
      { id: "chord-dim", area: "和弦", title: "減和弦", category: "A", tool: "/chords" },
      { id: "chord-aug", area: "和弦", title: "增和弦", category: "A", tool: "/chords" },
      { id: "chord-maj7", area: "和弦", title: "大七和弦", category: "A", tool: "/chords" },
      { id: "chord-dom7", area: "和弦", title: "屬七和弦", category: "A", tool: "/chords" },
      { id: "chord-min7", area: "和弦", title: "小七和弦", category: "A", tool: "/chords" },
      { id: "chord-m7b5", area: "和弦", title: "小七降五和弦", category: "A", tool: "/chords" },
      { id: "chord-dim7", area: "和弦", title: "減七和弦", category: "A", tool: "/chords" },
      // 9/11/13 and altered: theory tools don't render these extended voicings yet.
      { id: "chord-9", area: "和弦", title: "九和弦", category: "C" },
      { id: "chord-11", area: "和弦", title: "十一和弦", category: "C" },
      { id: "chord-13", area: "和弦", title: "十三和弦", category: "C" },
      { id: "chord-altered-series", area: "和弦", title: "變化和弦系列", category: "C" },
    ],
  },
  {
    area: "節奏訓練",
    items: [
      { id: "rhythm-note-values", area: "節奏訓練", title: "認識音符", category: "C" },
      { id: "rhythm-on-off-beat", area: "節奏訓練", title: "正拍反拍", category: "C" },
      { id: "rhythm-8th-16th", area: "節奏訓練", title: "八分/十六分音符", category: "C" },
      { id: "rhythm-rests", area: "節奏訓練", title: "休止符練習", category: "C" },
      { id: "rhythm-triplets", area: "節奏訓練", title: "三連音/六連音", category: "A", tool: "/practice" },
      { id: "rhythm-16th-syncopation", area: "節奏訓練", title: "十六分切分音訓練", category: "C" },
      { id: "rhythm-accent-2-4", area: "節奏訓練", title: "重音2&4拍練習", category: "A", tool: "/practice" },
      { id: "rhythm-metronome-1", area: "節奏訓練", title: "節拍器1拍練習", category: "A", tool: "/practice" },
      { id: "rhythm-mega", area: "節奏訓練", title: "Mega訓練", category: "C" },
      { id: "rhythm-missing-beats", area: "節奏訓練", title: "Missing the beats練習", category: "C" },
      { id: "rhythm-find-chords-key", area: "節奏訓練", title: "如何抓和弦/調子", category: "C" },
      { id: "rhythm-find-melody", area: "節奏訓練", title: "如何抓旋律", category: "C" },
      { id: "rhythm-notation", area: "節奏訓練", title: "寫譜", category: "C" },
      { id: "rhythm-style-blues", area: "節奏訓練", title: "Blues", category: "D" },
      { id: "rhythm-style-funk", area: "節奏訓練", title: "Funk", category: "D" },
      { id: "rhythm-style-rock", area: "節奏訓練", title: "Rock", category: "D" },
      { id: "rhythm-style-metal", area: "節奏訓練", title: "Metal", category: "D" },
      { id: "rhythm-style-ballad", area: "節奏訓練", title: "Ballad", category: "D" },
      { id: "rhythm-style-rnb", area: "節奏訓練", title: "R&B", category: "D" },
    ],
  },
  {
    area: "技巧",
    items: [
      { id: "tech-warmup", area: "技巧", title: "暖指練習", category: "C" },
      { id: "tech-common-strumming", area: "技巧", title: "常見刷法", category: "C" },
      { id: "tech-alternate-picking", area: "技巧", title: "交替撥弦", category: "C" },
      { id: "tech-fingerpicking", area: "技巧", title: "手指撥弦", category: "C" },
      { id: "tech-bending", area: "技巧", title: "推弦", category: "C" },
      { id: "tech-hammer-pull", area: "技巧", title: "捶/勾弦", category: "C" },
      { id: "tech-slide", area: "技巧", title: "滑弦", category: "C" },
      { id: "tech-legato", area: "技巧", title: "Legato", category: "C" },
      { id: "tech-mute", area: "技巧", title: "悶音", category: "C" },
      { id: "tech-vibrato", area: "技巧", title: "顫音", category: "C" },
      { id: "tech-natural-harmonics", area: "技巧", title: "自然泛音", category: "C" },
      { id: "tech-artificial-harmonics", area: "技巧", title: "人工泛音", category: "C" },
      { id: "tech-string-skipping", area: "技巧", title: "跨弦", category: "C" },
      { id: "tech-sweep", area: "技巧", title: "掃弦", category: "C" },
      { id: "tech-tapping", area: "技巧", title: "點弦", category: "C" },
      { id: "tech-double-stops", area: "技巧", title: "雙音", category: "C" },
      { id: "tech-whammy", area: "技巧", title: "搖桿", category: "C" },
      { id: "tech-slapping-body", area: "技巧", title: "打板", category: "C" },
      { id: "tech-slap", area: "技巧", title: "Slap", category: "C" },
    ],
  },
  {
    area: "樂句應用",
    items: [
      { id: "licks-major-scale", area: "樂句應用", title: "大調音階licks", category: "D", tool: "/licks" },
      { id: "licks-minor-scale", area: "樂句應用", title: "小調音階licks", category: "D", tool: "/licks" },
      { id: "licks-major-pentatonic", area: "樂句應用", title: "大調五聲licks", category: "D", tool: "/licks" },
      { id: "licks-minor-pentatonic", area: "樂句應用", title: "小調五聲licks", category: "D", tool: "/licks" },
      { id: "licks-harmonic-minor", area: "樂句應用", title: "和聲小調licks", category: "D" },
      { id: "licks-melodic-minor", area: "樂句應用", title: "旋律小調licks", category: "D" },
      { id: "licks-altered", area: "樂句應用", title: "Altered Scale licks", category: "D" },
      { id: "licks-blues", area: "樂句應用", title: "藍調licks", category: "D", tool: "/licks" },
      { id: "licks-modal", area: "樂句應用", title: "調式音階licks", category: "D", tool: "/licks" },
      { id: "licks-arpeggio", area: "樂句應用", title: "琶音licks", category: "D", tool: "/licks" },
      { id: "gear-tuner-metronome-capo", area: "樂句應用", title: "調音器/節拍器/移調夾使用", category: "C" },
      { id: "gear-effects", area: "樂句應用", title: "吉他效果器使用", category: "C" },
      { id: "gear-recording", area: "樂句應用", title: "錄音器材使用", category: "C" },
      { id: "arr-write-accompaniment", area: "樂句應用", title: "如何編寫伴奏", category: "C" },
      { id: "arr-make-backing", area: "樂句應用", title: "如何製作Backing", category: "C" },
      { id: "arr-make-melody", area: "樂句應用", title: "如何製造主旋律", category: "C" },
      { id: "arr-instrumentation", area: "樂句應用", title: "樂器配置", category: "C" },
      { id: "arr-write-solo", area: "樂句應用", title: "如何編solo", category: "C" },
    ],
  },
  {
    area: "樂理",
    items: [
      { id: "theory-read-tab", area: "樂理", title: "認識吉他譜", category: "D", tool: "/spike/alphatab" },
      { id: "theory-5-pattern", area: "樂理", title: "5 pattern", category: "A", tool: "/caged" },
      { id: "theory-caged-system", area: "樂理", title: "CAGED系統", category: "A", tool: "/caged" },
      { id: "theory-intervals", area: "樂理", title: "音程", category: "A", tool: "/intervals" },
      { id: "theory-interval-3rd", area: "樂理", title: "3度音程練習", category: "A", tool: "/intervals" },
      { id: "theory-interval-4th", area: "樂理", title: "4度音程練習", category: "A", tool: "/intervals" },
      { id: "theory-interval-5th", area: "樂理", title: "5度音程練習", category: "A", tool: "/intervals" },
      { id: "theory-interval-6th", area: "樂理", title: "6度音程練習", category: "A", tool: "/intervals" },
      { id: "theory-interval-7th", area: "樂理", title: "7度音程練習", category: "A", tool: "/intervals" },
      { id: "theory-three-notes-per-string", area: "樂理", title: "一弦三音", category: "C" },
      { id: "theory-pentatonic-sequence", area: "樂理", title: "五聲音階模進", category: "C" },
      { id: "theory-secondary-dominant", area: "樂理", title: "次屬和弦", category: "A", tool: "/harmony" },
      { id: "theory-major-minor-interchange", area: "樂理", title: "大小調互換", category: "A", tool: "/harmony" },
      { id: "theory-modulation", area: "樂理", title: "轉調", category: "C" },
      { id: "theory-tritone-substitution", area: "樂理", title: "三全音代理", category: "A", tool: "/harmony" },
      { id: "theory-inversions", area: "樂理", title: "轉位和弦", category: "A", tool: "/harmony" },
      { id: "theory-drop-2", area: "樂理", title: "Drop 2", category: "A", tool: "/harmony" },
      { id: "theory-twin-guitar-concept", area: "樂理", title: "雙吉他演奏概念", category: "C" },
      { id: "theory-ensemble-practice", area: "樂理", title: "吉他合奏練習", category: "C" },
    ],
  },
];

/** Flat list of every item across all areas, in area then item order. */
export const ALL_ITEMS: CurriculumItem[] = CURRICULUM.flatMap((g) => g.items);

/** Total number of curriculum items (across all areas). */
export const TOTAL_ITEMS = ALL_ITEMS.length;
