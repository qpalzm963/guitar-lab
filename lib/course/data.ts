// The course: six structured, navigable lessons. Each lesson carries
// an ORIGINAL written explanation (in lessonContent.ts), an outline of chapters,
// the curriculum items it covers (so the course and the 6-area map stay in sync),
// the built tools that practice the topic, and an ORIGINAL multiple-choice quiz.
//
// The app ships and loads NO PDFs: lessons render the original written content
// only. The chapter outlines and quiz questions below are authored from scratch
// (general music theory), not copied from any source.
//
// Quiz answers were sanity-checked against tonal (e.g. Cmaj7 = C E G B; ii–V in C
// = Dm7–G7; C major = C D E F G A B; major 3rd = 4 semitones; C + P5 = G).
// The data test re-verifies a few with tonal.
//
// Pedagogical order (rebuilt from a teacher's view, not a PDF's table of
// contents): physical fundamentals first, then the theory spine
// intervals → scales → chords → diatonic harmony, with CAGED last as the
// integrative capstone that ties chords and scales onto the whole neck.

import type { CurriculumTool } from "@/lib/curriculum/data";

/** One multiple-choice question. `answer` is the index into `options`. */
export interface Question {
  /** Stable, unique-within-lesson id (used as the React key and answer key). */
  id: string;
  /** zh-TW question text. */
  prompt: string;
  /** Answer choices (zh-TW). Order is fixed; `answer` indexes into this. */
  options: string[];
  /** Index of the correct option in `options` (0-based). */
  answer: number;
  /** zh-TW one-line explanation shown after the learner answers. */
  explanation: string;
}

export interface Lesson {
  /** Stable slug; also the dynamic route segment (/course/<slug>). */
  slug: string;
  /** zh-TW lesson title. */
  title: string;
  /** zh-TW one-line summary shown in the list and detail header. */
  summary: string;
  /** 1-based display order in the course list. */
  order: number;
  /** Section outline we derived from the material's topics (zh-TW). */
  chapters: string[];
  /** Curriculum item ids this lesson covers; each MUST exist in lib/curriculum. */
  curriculumItemIds: string[];
  /** Built tools that practice this lesson's topic. */
  tools: CurriculumTool[];
  /**
   * Optional deep-link query string per tool (e.g. "?root=C&scale=major"), so a
   * lesson pre-selects a representative subject in the tool. Keyed by the bare
   * route in `tools`; a tool with no entry opens at its own defaults. The route
   * itself stays in `tools` (validated by the data test); params are appended at
   * render time in LessonView. Each value MUST start with "?".
   */
  toolParams?: Partial<Record<CurriculumTool, string>>;
  /** Original multiple-choice quiz (>= 3 questions). */
  quiz: Question[];
}

export const LESSONS: Lesson[] = [
  {
    slug: "basics",
    title: "基本功 Fundamentals",
    summary: "暖指、放鬆、交替撥弦與節拍器——把雙手練成能穩定執行任何樂句的底子。",
    order: 1,
    chapters: [
      "練基本功的兩條鐵律:放鬆優先、先慢而準",
      "先把吉他調準:標準調音 E A D G B E",
      "暖指:爬格子",
      "右手:交替撥弦(alternate picking)",
      "左手:手指獨立與經濟手法",
      "節拍器:拍、BPM 與細分",
      "安排每日練習",
    ],
    curriculumItemIds: [
      "tech-warmup",
      "tech-alternate-picking",
      "gear-tuner-metronome-capo",
      "rhythm-metronome-1",
    ],
    tools: ["/practice"],
    quiz: [
      {
        id: "basics-q1",
        prompt: "練基本功的兩條核心心法,下列何者正確?",
        options: [
          "先求最快速度,錯了再修",
          "放鬆優先,而且先慢而準、再逐步加速",
          "越用力按弦聲音越穩",
          "略過暖指直接練曲子",
        ],
        answer: 1,
        explanation:
          "放鬆能避免緊繃與受傷;先把動作做對,速度是「練對之後自然來的結果」,不是硬衝出來的。",
      },
      {
        id: "basics-q2",
        prompt: "「交替撥弦(alternate picking)」指的是?",
        options: [
          "只用下撥",
          "只用手指撥弦",
          "同時撥兩條弦",
          "下撥與上撥規律交替進行",
        ],
        answer: 3,
        explanation: "交替撥弦是下撥(↓)與上撥(↑)規律交替,讓右手最省力、最容易提速。",
      },
      {
        id: "basics-q3",
        prompt: "想訓練「手指獨立」,尤其是較弱的無名指與小指,下列哪種練法最直接?",
        options: [
          "每個音都用同一根手指",
          "用打亂指序的蜘蛛爬(如 1-3-2-4)",
          "只彈空弦、不按弦",
          "把四根手指同時壓下去",
        ],
        answer: 1,
        explanation:
          "打亂指序(如 1-3-2-4)強迫每根手指各自動作、不互相牽連,特別能練到較弱的無名指與小指。",
      },
      {
        id: "basics-q4",
        prompt: "關於暖指與按弦力度,下列何者較正確?",
        options: [
          "一開始就用最快速度衝刺",
          "從慢速、放鬆開始,避免過度用力造成緊繃或受傷",
          "越用力按弦越好",
          "暖指可以完全略過",
        ],
        answer: 1,
        explanation: "放鬆、慢速暖指能建立乾淨的觸弦;過度用力反而拖慢速度並易受傷。",
      },
      {
        id: "basics-q5",
        prompt: "節拍器設在某個速度時,「一拍裡平均彈四個音」是哪一種細分?",
        options: ["四分音符", "八分音符", "十六分音符", "三連音"],
        answer: 2,
        explanation:
          "一拍 1 音=四分、2 音=八分、4 音=十六分、3 音=三連音;一拍平均四個音即十六分音符。",
      },
    ],
  },
  {
    slug: "intervals",
    title: "音程與級數 Intervals & Degrees",
    summary: "用半音／全音與「度數＋品質」描述任意兩音的距離——音階與和弦的共同原子。",
    order: 2,
    chapters: [
      "音程是什麼:兩個音之間的距離",
      "半音與全音:指板上的距離",
      "度數:從 1 開始數(含一度與八度)",
      "音程的品質:大、小、完全",
      "幾個必記的音程(用半音數記)",
      "三全音:最不穩定的那一個",
      "找音程、用耳朵辨認",
    ],
    curriculumItemIds: [
      "theory-intervals",
      "theory-interval-3rd",
      "theory-interval-4th",
      "theory-interval-5th",
      "theory-interval-6th",
      "theory-interval-7th",
    ],
    tools: ["/intervals"],
    toolParams: {
      "/intervals": "?root=C&interval=3M",
    },
    quiz: [
      {
        id: "intervals-q1",
        prompt: "指板上,「全音(whole step)」等於幾個半音?",
        options: [
          "1 個半音(相鄰一格)",
          "2 個半音(隔一格)",
          "3 個半音",
          "半個半音",
        ],
        answer: 1,
        explanation: "半音=相鄰一格,全音=兩個半音=隔一格,例如 C 到 D。",
      },
      {
        id: "intervals-q2",
        prompt: "大三度(major 3rd)等於幾個半音?",
        options: ["3 個半音", "4 個半音", "5 個半音", "7 個半音"],
        answer: 1,
        explanation:
          "大三度=4 個半音(如 C→E);小三度=3 個半音(如 C→Eb),兩者只差一個半音。",
      },
      {
        id: "intervals-q3",
        prompt: "從 C 往上一個完全五度(perfect 5th)會到哪個音?",
        options: [
          "F(完全四度,5 個半音)",
          "F#(三全音,6 個半音)",
          "G(完全五度,7 個半音)",
          "A(大六度,9 個半音)",
        ],
        answer: 2,
        explanation:
          "完全五度=7 個半音,C 往上 7 個半音是 G;別把五度數成四度(F)或三全音(F#)。",
      },
      {
        id: "intervals-q4",
        prompt: "一個八度(octave)等於幾個半音?",
        options: ["7 個半音", "10 個半音", "12 個半音", "13 個半音"],
        answer: 2,
        explanation: "八度=12 個半音,是同名的高音(例如 C 到高八度的 C)。",
      },
      {
        id: "intervals-q5",
        prompt: "下列哪一個音程是「三全音(tritone)」,聽起來最不穩定、最想解決?",
        options: [
          "完全四度(5 個半音)",
          "增四度／減五度(6 個半音)",
          "完全五度(7 個半音)",
          "大六度(9 個半音)",
        ],
        answer: 1,
        explanation:
          "三全音=6 個半音=半個八度,可拼寫成增四度或減五度;它的張力正是藍調 b5 與屬七和弦「想回家」的來源。",
      },
    ],
  },
  {
    slug: "scale",
    title: "音階 Guitar Scale",
    summary: "用音程蓋出大調、自然小調(關係小調)、五聲與藍調音階,並在指板上連結把位。",
    order: 3,
    chapters: [
      "大調音階的全全半全全全半結構",
      "自然小調與大小調的關係",
      "五聲音階(大調/小調)",
      "藍調音階與藍調音(b5)",
      "在指板上連結各把位",
    ],
    curriculumItemIds: [
      "scale-concept",
      "scale-structure",
      "scale-major",
      "scale-natural-minor",
      "scale-pentatonic",
      "scale-blues",
    ],
    tools: ["/fretboard", "/caged"],
    toolParams: {
      "/fretboard": "?root=C&scale=major",
      "/caged": "?root=C&quality=major",
    },
    quiz: [
      {
        id: "scale-q1",
        prompt: "大調音階的全音/半音排列(由主音往上)是哪一種?",
        options: [
          "全 半 全 全 半 全 全",
          "全 全 半 全 全 全 半",
          "全 全 全 半 全 全 半",
          "半 全 全 全 半 全 全",
        ],
        answer: 1,
        explanation: "大調(Ionian)的排列是 全-全-半-全-全-全-半,半音落在 3→4 級與 7→1 級(第 7 級回到高八度主音)。",
      },
      {
        id: "scale-q2",
        prompt: "C 大調音階包含下列哪一組音?",
        options: [
          "C D Eb F G Ab Bb",
          "C D E F# G A B",
          "C Db Eb F G Ab Bb",
          "C D E F G A B",
        ],
        answer: 3,
        explanation: "C 大調沒有任何升降記號:C D E F G A B。",
      },
      {
        id: "scale-q3",
        prompt: "A 小調五聲音階(minor pentatonic)由哪些音組成?",
        options: ["A B C D E", "A C D Eb G", "A C D E G", "A B C# E F#"],
        answer: 2,
        explanation: "小調五聲是小調音階去掉 2 與 b6:A C D E G(五個音)。",
      },
      {
        id: "scale-q4",
        prompt: "A 小調藍調音階(小調五聲再加一個降五度藍調音)由哪些音組成?",
        options: [
          "A C D E G",
          "A C D Eb E G",
          "A B C D E G",
          "A C Eb F G Bb",
        ],
        answer: 1,
        explanation: "藍調音階 = 小調五聲 + 降五度(b5,blue note)。A 小調五聲 A C D E G 加入 Eb,得 A C D Eb E G。",
      },
      {
        id: "scale-q5",
        prompt: "自然小調音階與哪個大調共用相同的音(關係大小調)?",
        options: [
          "同主音的大調(如 Am ↔ A)",
          "往上純四度的大調(如 Am ↔ D)",
          "往上小三度的大調(如 Am ↔ C)",
          "往上純五度的大調(如 Am ↔ E)",
        ],
        answer: 2,
        explanation: "關係大調在小調主音上方小三度:A 自然小調與 C 大調用同一組音。",
      },
    ],
  },
  {
    slug: "chord-system",
    title: "和弦系統 Chord System",
    summary: "用三度音程把三和弦與七和弦堆疊出來,讀懂和弦符號與轉位。",
    order: 4,
    chapters: [
      "和弦的堆疊原理:三度疊置",
      "四種三和弦:大、小、減、增",
      "七和弦:大七、屬七、小七、半減、減七",
      "看懂和弦符號",
      "和弦轉位概念",
      "吉他上的基本聲位",
    ],
    curriculumItemIds: [
      "chord-concept",
      "chord-structure",
      "chord-major-triad",
      "chord-minor-triad",
      "chord-dim",
      "chord-aug",
      "chord-maj7",
      "chord-dom7",
      "chord-min7",
      "chord-m7b5",
      "chord-dim7",
    ],
    tools: ["/chords", "/caged"],
    toolParams: {
      "/chords": "?root=C&type=maj7",
      "/caged": "?root=C&quality=major",
    },
    quiz: [
      {
        id: "chord-q1",
        prompt: "一般三和弦是以什麼音程堆疊而成的?",
        options: ["二度疊置", "四度疊置", "五度疊置", "三度疊置(根音、三度、五度)"],
        answer: 3,
        explanation: "三和弦由根音往上每隔一個三度堆疊:根音 + 三度 + 五度(如 C-E-G)。",
      },
      {
        id: "chord-q2",
        prompt: "大三和弦與小三和弦最關鍵的差別在哪一個音?",
        options: ["根音", "三度(大三度 vs 小三度)", "五度", "八度"],
        answer: 1,
        explanation: "兩者五度相同;大三和弦是大三度,小三和弦是小三度,差一個半音(C E vs C Eb)。",
      },
      {
        id: "chord-q3",
        prompt: "Cmaj7(C 大七和弦)包含哪些音?",
        options: ["C E G Bb", "C Eb G Bb", "C E G B", "C E G A"],
        answer: 2,
        explanation: "大七和弦 = 大三和弦 + 大七度:C E G B。",
      },
      {
        id: "chord-q4",
        prompt: "屬七和弦(如 G7)與大七和弦的差別是?",
        options: [
          "三度改成小三度",
          "五度升高半音",
          "多加一個九度",
          "七度是小七度(G7 = G B D F)",
        ],
        answer: 3,
        explanation: "屬七 = 大三和弦 + 小七度;G7 = G B D F,F 是小七度。",
      },
      {
        id: "chord-q5",
        prompt: "小七和弦(如 Dm7)的組成是?",
        options: [
          "大三和弦 + 大七度",
          "小三和弦 + 小七度(Dm7 = D F A C)",
          "小三和弦 + 大七度",
          "大三和弦 + 小七度",
        ],
        answer: 1,
        explanation: "小七和弦 = 小三和弦 + 小七度;Dm7 = D F A C。",
      },
      {
        id: "chord-q6",
        prompt: "半減七和弦 Cm7b5 由哪些音組成?",
        options: ["C E G B", "C Eb Gb Bb", "C Eb Gb Bbb", "C Eb G Bb"],
        answer: 1,
        explanation:
          "m7b5(半減)= 減三和弦 + 小七度:C Eb Gb Bb;它和減七 dim7(C Eb Gb Bbb)只差最上面那個音。",
      },
    ],
  },
  {
    slug: "diatonic",
    title: "順階和弦 Diatonic Chord",
    summary: "把大調音階的每一級和聲化,得到七個順階和弦、級數記號與常見進行。",
    order: 5,
    chapters: [
      "順階和弦的產生:在音階每個音上疊三度",
      "大調順階三和弦的品質(I ii iii IV V vi vii°)",
      "順階七和弦與 V7 的三全音張力",
      "級數記號與常見進行(如 ii–V–I)",
      "再走一步:次屬和弦(進階)",
    ],
    curriculumItemIds: ["chord-diatonic-concept", "theory-secondary-dominant"],
    tools: ["/chords", "/harmony"],
    toolParams: {
      "/chords": "?root=C",
      "/harmony": "?concept=secondary-dominant&key=C",
    },
    quiz: [
      {
        id: "diatonic-q1",
        prompt: "順階和弦(diatonic chords)是怎麼產生的?",
        options: [
          "隨機挑選三個音",
          "只用黑鍵",
          "在音階的每個音上,只用音階內的音往上疊三度",
          "把所有和弦都升高半音",
        ],
        answer: 2,
        explanation: "順階和弦在音階每一級上、只用調內音疊三度而成,因此都屬於同一個調。",
      },
      {
        id: "diatonic-q2",
        prompt: "大調順階三和弦的品質,由 I 級到 vii 級依序是?",
        options: [
          "小 大 大 小 小 大 增",
          "大 大 大 大 大 大 大",
          "大 小 大 小 大 小 減",
          "大 小 小 大 大 小 減",
        ],
        answer: 3,
        explanation: "大調順階:I 大、ii 小、iii 小、IV 大、V 大、vi 小、vii° 減(C 大調=C Dm Em F G Am Bdim)。",
      },
      {
        id: "diatonic-q3",
        prompt: "在 C 大調中,V 級(屬和弦)的順階七和弦是?",
        options: ["Gmaj7", "G7", "Gm7", "G6"],
        answer: 1,
        explanation: "C 大調第五級是 G;順階七和弦為屬七 G7(G B D F),內含三全音故張力最強。",
      },
      {
        id: "diatonic-q4",
        prompt: "在 C 大調中,常見的 ii–V–I 進行(用順階七和弦)是?",
        options: [
          "Dmaj7 – G7 – Cm7",
          "Em7 – A7 – Dmaj7",
          "Dm7 – G7 – Cmaj7",
          "Dm7 – Gmaj7 – Cmaj7",
        ],
        answer: 2,
        explanation: "C 大調的 ii 是 Dm7、V 是 G7、I 是 Cmaj7,構成 ii–V–I。",
      },
      {
        id: "diatonic-q5",
        prompt: "為什麼 V7(C 大調的 G7)會強烈地想「回家」到 I?",
        options: [
          "因為它的三度與小七度組成三全音(B–F),會解決到 C–E",
          "因為它是大七和弦",
          "因為它沒有三度",
          "因為它比 I 高八度",
        ],
        answer: 0,
        explanation:
          "G7 的 B 與 F 相距三全音,極不穩定:B 往上半音到 C、F 往下半音到 E,正好落進主和弦 C 的根音與三度,產生「回家」感。",
      },
    ],
  },
  {
    slug: "caged",
    title: "CAGED 系統",
    summary: "用 C-A-G-E-D 五個指型,把你已會的和弦與音階定位、串連到整片指板。",
    order: 6,
    chapters: [
      "CAGED 是什麼:整合和弦與音階的地圖",
      "從開放和弦推導可移動的封閉指型",
      "五個指型如何首尾相接、覆蓋指板",
      "實際範例:C 大調的五個把位",
      "用 CAGED 同時定位音階與琶音",
    ],
    curriculumItemIds: ["theory-caged-system", "theory-5-pattern"],
    tools: ["/caged", "/fretboard"],
    toolParams: {
      "/caged": "?root=C&quality=major",
      "/fretboard": "?root=C&scale=major",
    },
    quiz: [
      {
        id: "caged-q1",
        prompt: "CAGED 系統的五個字母分別代表什麼?",
        options: [
          "五個調 (C A G E D)",
          "五種音階",
          "五個開放和弦指型 (C A G E D)",
          "五個品格位置",
        ],
        answer: 2,
        explanation: "CAGED 是 C、A、G、E、D 五個開放和弦的指型,平移後可彈奏任何調。",
      },
      {
        id: "caged-q2",
        prompt: "CAGED 系統中,五個指型「總共」如何覆蓋指板?",
        options: [
          "彼此完全不重疊",
          "首尾相接、循環覆蓋整個指板",
          "只覆蓋前五格",
          "只適用於開放把位",
        ],
        answer: 1,
        explanation: "五個指型依 C-A-G-E-D 順序首尾相連並重疊,循環覆蓋整個指板。",
      },
      {
        id: "caged-q3",
        prompt: "把開放的 E 和弦指型整體往上平移作為封閉和弦時,通常用什麼壓住原本的空弦?",
        options: ["拇指", "小指單獨壓", "不需要,維持空弦", "食指做封閉(橫按)"],
        answer: 3,
        explanation: "平移開放指型成封閉和弦時,食指橫按取代原本的上弦枕(空弦)。",
      },
      {
        id: "caged-q4",
        prompt: "用 E 指型在第 5 格做封閉和弦(根音在第六弦第 5 格),得到的是哪個和弦?",
        options: ["G", "C", "A", "E"],
        answer: 2,
        explanation: "第六弦第 5 格是 A 音,E 指型根音在第六弦,故為 A 和弦。",
      },
      {
        id: "caged-q5",
        prompt: "為什麼 CAGED 不只用來記和弦,也能幫助獨奏?",
        options: [
          "它會自動加快速度",
          "同一個指型框出的範圍,同時標出該把位裡音階與和弦音(根音、三度、五度)的位置",
          "它只在錄音時有用",
          "它能換弦而不用移調",
        ],
        answer: 1,
        explanation:
          "CAGED 是整合地圖:知道現在是哪個指型,就同時知道附近音階與和弦音的落點,獨奏時更容易瞄準想要的音。",
      },
    ],
  },
];

/** Look up a lesson by slug; undefined if not found. */
export function getLesson(slug: string): Lesson | undefined {
  return LESSONS.find((l) => l.slug === slug);
}

// Reverse of the lesson → curriculumItemIds mapping: which lesson (if any)
// teaches a given curriculum item. Lets the curriculum map link a 規劃中 item
// (no built tool) to its course lesson instead of showing a dead badge. Built
// once at module load. If two lessons ever claim the same item, the first in
// LESSONS order wins (the data test guards that each id is otherwise valid).
const LESSON_SLUG_BY_ITEM = new Map<string, string>();
for (const lesson of LESSONS) {
  for (const id of lesson.curriculumItemIds) {
    if (!LESSON_SLUG_BY_ITEM.has(id)) LESSON_SLUG_BY_ITEM.set(id, lesson.slug);
  }
}

/** The slug of the lesson that teaches `itemId`, or undefined if none does. */
export function lessonSlugForItem(itemId: string): string | undefined {
  return LESSON_SLUG_BY_ITEM.get(itemId);
}

/** Lessons sorted by their display order. */
export const ORDERED_LESSONS: Lesson[] = [...LESSONS].sort(
  (a, b) => a.order - b.order,
);

/** Total number of lessons in the course. */
export const TOTAL_LESSONS = LESSONS.length;
