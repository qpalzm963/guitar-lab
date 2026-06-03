"use client";

import { useMemo, useRef, useState } from "react";
import { Fretboard } from "@/components/fretboard/Fretboard";
import { intervalMarkers, INTERVALS } from "@/lib/theory/intervals";
import { downloadSvgAsPng } from "@/lib/export/svgToPng";
import { ROOT_OPTIONS } from "@/lib/theory/notes";
import type { LabelMode } from "@/lib/store/settings";

// Interval tool keeps name/級數 only; an interval board without labels conveys
// little (same rationale as the chord tool). Local state — no persisted store.
const LABELS: { id: LabelMode; label: string }[] = [
  { id: "name", label: "音名" },
  { id: "degree", label: "級數" },
];

// Modes: 參考 (reference visualizer) and 視覺測驗 (no-audio multiple-choice quiz).
type Mode = "reference" | "quiz";

// A quiz round: a fixed root + the interval the learner must name. The board
// shows only that one interval note (plus the root), and the four options are
// drawn from INTERVALS. Octave (8P) is excluded as a quiz answer because it adds
// no distinct interval marker — the board would look like roots only.
const QUIZ_INTERVALS = INTERVALS.filter((i) => i.id !== "8P");

function pickInt(max: number): number {
  return Math.floor(Math.random() * max);
}

interface Round {
  root: string;
  answerId: string;
  options: string[];
}

function newRound(): Round {
  const root = ROOT_OPTIONS[pickInt(ROOT_OPTIONS.length)];
  const answer = QUIZ_INTERVALS[pickInt(QUIZ_INTERVALS.length)];
  // Build 4 options: the answer plus 3 distinct distractors, then shuffle.
  const pool = QUIZ_INTERVALS.filter((i) => i.id !== answer.id);
  const distractors: string[] = [];
  while (distractors.length < 3 && pool.length > 0) {
    const idx = pickInt(pool.length);
    distractors.push(pool.splice(idx, 1)[0].id);
  }
  const options = [answer.id, ...distractors];
  for (let i = options.length - 1; i > 0; i--) {
    const j = pickInt(i + 1);
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { root, answerId: answer.id, options };
}

const intervalLabel = (id: string) =>
  INTERVALS.find((i) => i.id === id)?.label ?? id;

export function IntervalExplorer() {
  const [mode, setMode] = useState<Mode>("reference");

  // --- reference mode state ---
  const [root, setRoot] = useState("C");
  const [interval, setInterval] = useState("5P");
  const [labels, setLabels] = useState<LabelMode>("degree");
  const [busy, setBusy] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const markers = useMemo(
    () => intervalMarkers(root, interval),
    [root, interval],
  );

  // --- quiz mode state ---
  const [round, setRound] = useState<Round>(() => newRound());
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const quizMarkers = useMemo(
    () => intervalMarkers(round.root, round.answerId),
    [round],
  );

  function answer(id: string) {
    if (picked) return; // lock once answered until 下一題
    setPicked(id);
    setTotal((t) => t + 1);
    if (id === round.answerId) setScore((s) => s + 1);
  }

  function nextRound() {
    setRound(newRound());
    setPicked(null);
  }

  function resetQuiz() {
    setScore(0);
    setTotal(0);
    nextRound();
  }

  async function exportPng() {
    const svg = boardRef.current?.querySelector("svg");
    if (!svg) return;
    setBusy(true);
    try {
      await downloadSvgAsPng(svg, `${root}-${interval}-interval.png`);
    } finally {
      setBusy(false);
    }
  }

  const pill =
    "rounded-md px-3 py-1.5 text-sm border transition-colors cursor-pointer";
  const legend = (
    <div className="flex items-center gap-4 text-xs text-gray-500">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded-full bg-rose-600" /> 根音
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded-full bg-blue-600" /> 音程音
      </span>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* mode switch */}
      <div className="flex gap-1">
        <button
          onClick={() => setMode("reference")}
          className={`${pill} ${
            mode === "reference"
              ? "border-rose-600 bg-rose-600 text-white"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          參考
        </button>
        <button
          onClick={() => setMode("quiz")}
          className={`${pill} ${
            mode === "quiz"
              ? "border-rose-600 bg-rose-600 text-white"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          視覺測驗
        </button>
      </div>

      {mode === "reference" ? (
        <>
          <div className="flex flex-wrap items-end gap-6">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-500">根音 Root</span>
              <select
                value={root}
                onChange={(e) => setRoot(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5"
              >
                {ROOT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-500">音程 Interval</span>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 min-w-64"
              >
                {INTERVALS.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-col gap-1 text-sm">
              <span className="text-gray-500">標籤 Label</span>
              <div className="flex gap-1">
                {LABELS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLabels(l.id)}
                    className={`${pill} ${
                      labels === l.id
                        ? "border-rose-600 bg-rose-600 text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={exportPng}
              disabled={busy}
              className={`${pill} border-gray-800 bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50`}
            >
              {busy ? "匯出中…" : "匯出 PNG"}
            </button>
          </div>

          {legend}

          <div
            ref={boardRef}
            className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-4"
          >
            <Fretboard markers={markers} labelMode={labels} toFret={15} />
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-sm">
              根音 <span className="font-semibold text-rose-600">{round.root}</span>
              ,藍點是什麼音程?
            </p>
            <span className="text-sm text-gray-500">
              得分 {score}/{total}
            </span>
            <button
              onClick={resetQuiz}
              className={`${pill} border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}
            >
              重設
            </button>
          </div>

          {legend}

          {/* Quiz board: degrees hidden (labelMode none) so the answer isn't
              given away by the degree text on the blue note. */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-4">
            <Fretboard markers={quizMarkers} labelMode="none" toFret={15} />
          </div>

          <div className="flex flex-wrap gap-2">
            {round.options.map((id) => {
              const isAnswer = id === round.answerId;
              const isPicked = id === picked;
              // Before answering: neutral. After: correct → green, wrong pick → red.
              const cls = !picked
                ? "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                : isAnswer
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : isPicked
                    ? "border-rose-600 bg-rose-600 text-white"
                    : "border-gray-300 bg-white text-gray-400";
              return (
                <button
                  key={id}
                  onClick={() => answer(id)}
                  disabled={!!picked}
                  className={`${pill} ${cls} disabled:cursor-default`}
                >
                  {intervalLabel(id)}
                </button>
              );
            })}
          </div>

          {picked && (
            <div className="flex items-center gap-4">
              <span className="text-sm">
                {picked === round.answerId ? "答對了!" : "答錯了。"}正解:
                <span className="font-semibold">
                  {" "}
                  {intervalLabel(round.answerId)}
                </span>
              </span>
              <button
                onClick={nextRound}
                className={`${pill} border-gray-800 bg-gray-900 text-white hover:bg-gray-700`}
              >
                下一題 →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
