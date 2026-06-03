// The course (Phase 6): the teacher's five source PDFs turned into structured,
// navigable lessons. Each lesson links its source PDF (served locally from
// public/materials — see note below), an outline of chapters we derived from the
// material's topics, the curriculum items it covers (so the course and the
// 6-area map stay in sync), the built tools that practice the topic, and an
// ORIGINAL multiple-choice quiz.
//
// Copyright / privacy: the PDFs themselves are the teacher's copyrighted work and
// are gitignored (public/materials/*.pdf) so they are NEVER published on the
// PUBLIC GitHub Pages site. The viewer loads them locally; on the deployed site
// the file is absent and the lesson page shows a placeholder while chapters, tool
// links and the quiz still work. The chapter outlines and quiz questions below
// are authored from scratch (general music theory), NOT copied from the PDFs.
//
// Quiz answers were sanity-checked against tonal (e.g. Cmaj7 = C E G B; ii–V in C
// = Dm7–G7; C major = C D E F G A B). The data test re-verifies a few with tonal.

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
  /** PDF filename under public/materials (basePath-prefixed at render time). */
  pdf: string;
  /** 1-based display order in the course list. */
  order: number;
  /** Section outline we derived from the material's topics (zh-TW). */
  chapters: string[];
  /** Curriculum item ids this lesson covers; each MUST exist in lib/curriculum. */
  curriculumItemIds: string[];
  /** Built tools that practice this lesson's topic. */
  tools: CurriculumTool[];
  /** Original multiple-choice quiz (>= 3 questions). */
  quiz: Question[];
}

export const LESSONS: Lesson[] = [
  {
    slug: "scale",
    title: "音階 Guitar Scale",
    summary: "音程與級數的基礎,以及大調、小調、五聲與藍調音階的結構。",
    pdf: "scale.pdf",
    order: 1,
    chapters: [
      "音程與級數:認識度數與半音/全音",
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
      "theory-intervals",
    ],
    tools: ["/fretboard", "/caged"],
    quiz: [
      {
        id: "scale-q1",
        prompt: "大調音階的全音/半音排列(由主音往上)是哪一種?",
        options: [
          "全 全 半 全 全 全 半",
          "全 半 全 全 半 全 全",
          "全 全 全 半 全 全 半",
          "半 全 全 全 半 全 全",
        ],
        answer: 0,
        explanation: "大調(Ionian)的排列是 全-全-半-全-全-全-半,半音落在 3→4 與 7→8 級。",
      },
      {
        id: "scale-q2",
        prompt: "C 大調音階包含下列哪一組音?",
        options: [
          "C D E F G A B",
          "C D Eb F G Ab Bb",
          "C D E F# G A B",
          "C Db Eb F G Ab Bb",
        ],
        answer: 0,
        explanation: "C 大調沒有任何升降記號:C D E F G A B。",
      },
      {
        id: "scale-q3",
        prompt: "A 小調五聲音階(minor pentatonic)由哪些音組成?",
        options: ["A C D E G", "A B C D E", "A C D Eb G", "A B C# E F#"],
        answer: 0,
        explanation: "小調五聲是小調音階去掉 2 與 b6:A C D E G(五個音)。",
      },
      {
        id: "scale-q4",
        prompt: "藍調音階比小調五聲多加入的「藍調音」是?",
        options: ["降五度 (b5)", "大七度 (M7)", "大二度 (M2)", "純四度 (P4)"],
        answer: 0,
        explanation: "藍調音階 = 小調五聲 + 降五度(blue note),如 C 藍調:C Eb F Gb G Bb。",
      },
      {
        id: "scale-q5",
        prompt: "自然小調音階與哪個大調共用相同的音(關係大小調)?",
        options: [
          "往上小三度的大調(如 Am ↔ C)",
          "同主音的大調(如 Am ↔ A)",
          "往上純四度的大調(如 Am ↔ D)",
          "往上純五度的大調(如 Am ↔ E)",
        ],
        answer: 0,
        explanation: "關係大調在小調主音上方小三度:A 自然小調與 C 大調用同一組音。",
      },
    ],
  },
  {
    slug: "caged",
    title: "CAGED 系統",
    summary: "用 C-A-G-E-D 五個開放和弦把位串連整個指板。",
    pdf: "caged.pdf",
    order: 2,
    chapters: [
      "CAGED 五個把位的由來",
      "從開放和弦推導可移動的封閉指型",
      "根音位置與每個指型的對應",
      "把位之間的銜接與重疊",
      "用 CAGED 連結音階與琶音",
    ],
    curriculumItemIds: ["theory-caged-system", "theory-5-pattern"],
    tools: ["/caged"],
    quiz: [
      {
        id: "caged-q1",
        prompt: "CAGED 系統的五個字母分別代表什麼?",
        options: [
          "五個開放和弦指型 (C A G E D)",
          "五個調 (C A G E D)",
          "五種音階",
          "五個品格位置",
        ],
        answer: 0,
        explanation: "CAGED 是 C、A、G、E、D 五個開放和弦的指型,平移後可彈奏任何調。",
      },
      {
        id: "caged-q2",
        prompt: "CAGED 系統中,五個指型「總共」如何覆蓋指板?",
        options: [
          "首尾相接、循環覆蓋整個指板",
          "彼此完全不重疊",
          "只覆蓋前五格",
          "只適用於開放把位",
        ],
        answer: 0,
        explanation: "五個指型依 C-A-G-E-D 順序首尾相連並重疊,循環覆蓋整個指板。",
      },
      {
        id: "caged-q3",
        prompt: "把開放的 E 和弦指型整體往上平移作為封閉和弦時,通常用什麼壓住原本的空弦?",
        options: ["食指做封閉(橫按)", "拇指", "小指單獨壓", "不需要,維持空弦"],
        answer: 0,
        explanation: "平移開放指型成封閉和弦時,食指橫按取代原本的上弦枕(空弦)。",
      },
      {
        id: "caged-q4",
        prompt: "用 E 指型在第 5 格做封閉和弦(根音在第六弦第 5 格),得到的是哪個和弦?",
        options: ["A", "G", "C", "E"],
        answer: 0,
        explanation: "第六弦第 5 格是 A 音,E 指型根音在第六弦,故為 A 和弦。",
      },
    ],
  },
  {
    slug: "chord-system",
    title: "和弦系統 Chord System",
    summary: "三和弦與七和弦如何由音程堆疊而成。",
    pdf: "chord-system.pdf",
    order: 3,
    chapters: [
      "和弦的堆疊原理:三度疊置",
      "大三和弦與小三和弦的差別",
      "增和弦與減和弦",
      "七和弦:大七、屬七、小七",
      "和弦轉位概念",
    ],
    curriculumItemIds: [
      "chord-concept",
      "chord-structure",
      "chord-major-triad",
      "chord-minor-triad",
      "chord-maj7",
      "chord-dom7",
      "chord-min7",
    ],
    tools: ["/chords"],
    quiz: [
      {
        id: "chord-q1",
        prompt: "一般三和弦是以什麼音程堆疊而成的?",
        options: ["三度疊置(根音、三度、五度)", "二度疊置", "四度疊置", "五度疊置"],
        answer: 0,
        explanation: "三和弦由根音往上每隔一個三度堆疊:根音 + 三度 + 五度。",
      },
      {
        id: "chord-q2",
        prompt: "大三和弦與小三和弦最關鍵的差別在哪一個音?",
        options: ["三度(大三度 vs 小三度)", "根音", "五度", "八度"],
        answer: 0,
        explanation: "兩者五度相同;大三和弦是大三度,小三和弦是小三度,差一個半音。",
      },
      {
        id: "chord-q3",
        prompt: "Cmaj7(C 大七和弦)包含哪些音?",
        options: ["C E G B", "C E G Bb", "C Eb G Bb", "C E G A"],
        answer: 0,
        explanation: "大七和弦 = 大三和弦 + 大七度:C E G B。",
      },
      {
        id: "chord-q4",
        prompt: "屬七和弦(如 G7)與大七和弦的差別是?",
        options: [
          "七度是小七度(降半音)",
          "三度改成小三度",
          "五度升高半音",
          "多加一個九度",
        ],
        answer: 0,
        explanation: "屬七 = 大三和弦 + 小七度。G7 = G B D F(F 是小七度)。",
      },
      {
        id: "chord-q5",
        prompt: "小七和弦(如 Dm7)的組成是?",
        options: [
          "小三和弦 + 小七度",
          "大三和弦 + 大七度",
          "小三和弦 + 大七度",
          "大三和弦 + 小七度",
        ],
        answer: 0,
        explanation: "小七和弦 = 小三和弦 + 小七度。Dm7 = D F A C。",
      },
    ],
  },
  {
    slug: "diatonic",
    title: "順階和弦 Diatonic Chord",
    summary: "從大調音階產生的順階和弦,以及級數與和聲進行。",
    pdf: "diatonic.pdf",
    order: 4,
    chapters: [
      "順階和弦的產生:在音階每個音上疊三度",
      "大調順階三和弦的品質(I ii iii IV V vi vii°)",
      "順階七和弦",
      "級數記號與常見進行(如 ii–V–I)",
      "在指板上的把位應用(pattern 2)",
    ],
    curriculumItemIds: ["chord-diatonic-concept", "theory-secondary-dominant"],
    tools: ["/chords", "/harmony"],
    quiz: [
      {
        id: "diatonic-q1",
        prompt: "順階和弦(diatonic chords)是怎麼產生的?",
        options: [
          "在音階的每個音上,只用音階內的音往上疊三度",
          "隨機挑選三個音",
          "只用黑鍵",
          "把所有和弦都升高半音",
        ],
        answer: 0,
        explanation: "順階和弦在音階每一級上、只用調內音疊三度而成,因此都屬於同一個調。",
      },
      {
        id: "diatonic-q2",
        prompt: "大調順階三和弦的品質,由 I 級到 vii 級依序是?",
        options: [
          "大 小 小 大 大 小 減",
          "小 大 大 小 小 大 增",
          "大 大 大 大 大 大 大",
          "大 小 大 小 大 小 減",
        ],
        answer: 0,
        explanation: "大調順階:I 大、ii 小、iii 小、IV 大、V 大、vi 小、vii° 減。",
      },
      {
        id: "diatonic-q3",
        prompt: "在 C 大調中,V 級(屬和弦)的順階七和弦是?",
        options: ["G7", "Gmaj7", "Gm7", "G6"],
        answer: 0,
        explanation: "C 大調第五級是 G;順階七和弦為屬七 G7(G B D F)。",
      },
      {
        id: "diatonic-q4",
        prompt: "在 C 大調中,常見的 ii–V–I 進行(用順階七和弦)是?",
        options: [
          "Dm7 – G7 – Cmaj7",
          "Dmaj7 – G7 – Cm7",
          "Em7 – A7 – Dmaj7",
          "Dm7 – Gmaj7 – Cmaj7",
        ],
        answer: 0,
        explanation: "C 大調的 ii 是 Dm7、V 是 G7、I 是 Cmaj7,構成 ii–V–I。",
      },
    ],
  },
  {
    slug: "basics",
    title: "基本功練習",
    summary: "暖指、交替撥弦與一弦三音等左右手基礎練習。",
    pdf: "basics.pdf",
    order: 5,
    chapters: [
      "暖指與蜘蛛爬(spider)練習",
      "左手擴指與按弦力度",
      "右手交替撥弦(alternate picking)",
      "一弦三音(three-note-per-string)指型",
      "模進(sequence)與循序加速",
      "搭配節拍器穩定速度",
    ],
    curriculumItemIds: [
      "tech-warmup",
      "tech-alternate-picking",
      "theory-three-notes-per-string",
    ],
    tools: ["/practice"],
    quiz: [
      {
        id: "basics-q1",
        prompt: "練習基本功時,搭配什麼工具最能確保節奏穩定、循序漸進地加速?",
        options: ["節拍器", "效果器", "調音器", "卡漫"],
        answer: 0,
        explanation: "節拍器提供穩定的拍點;從慢速開始、確認乾淨後再逐步加速是核心方法。",
      },
      {
        id: "basics-q2",
        prompt: "「交替撥弦(alternate picking)」指的是?",
        options: [
          "下撥與上撥交替進行",
          "只用下撥",
          "只用手指撥弦",
          "同時撥兩條弦",
        ],
        answer: 0,
        explanation: "交替撥弦是下撥(↓)與上撥(↑)規律交替,提升速度與效率。",
      },
      {
        id: "basics-q3",
        prompt: "「一弦三音(three-note-per-string)」指型的特點是?",
        options: [
          "每條弦上彈三個音,利於連奏與模進",
          "每條弦只彈一個音",
          "只在第一弦練習",
          "三條弦各彈一個音",
        ],
        answer: 0,
        explanation: "每條弦放三個音,讓音階更順、利於 legato 與快速模進(sequence)。",
      },
      {
        id: "basics-q4",
        prompt: "關於暖指與按弦力度,下列何者較正確?",
        options: [
          "從慢速、放鬆開始,避免過度用力造成緊繃或受傷",
          "一開始就用最快速度衝刺",
          "越用力按弦越好",
          "暖指可以完全略過",
        ],
        answer: 0,
        explanation: "放鬆、慢速暖指能建立乾淨的觸弦,過度用力反而拖慢速度並易受傷。",
      },
    ],
  },
];

/** Look up a lesson by slug; undefined if not found. */
export function getLesson(slug: string): Lesson | undefined {
  return LESSONS.find((l) => l.slug === slug);
}

/** Lessons sorted by their display order. */
export const ORDERED_LESSONS: Lesson[] = [...LESSONS].sort(
  (a, b) => a.order - b.order,
);

/** Total number of lessons in the course. */
export const TOTAL_LESSONS = LESSONS.length;
