"use client";

import { useMemo, useRef, useState } from "react";
import { Fretboard } from "@/components/fretboard/Fretboard";
import { intervalMarkers, INTERVALS } from "@/lib/theory/intervals";
import { downloadSvgAsPng } from "@/lib/export/svgToPng";
import { ROOT_OPTIONS } from "@/lib/theory/notes";
import type { LabelMode } from "@/lib/store/settings";
import { Button } from "@/components/ui/Button";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { Field, FieldGroup, Select } from "@/components/ui/Field";
import { ScrollableBoard } from "@/components/ui/ScrollableBoard";
import { useInitialParams, pickAllowed } from "@/lib/url/useInitialParams";

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

// The interval option ids are digit-first (tonal form, e.g. "5P", "3M", "4A").
// Deep-link URLs are friendlier as quality-first ("P5", "M3"), so accept either:
// flip a leading quality letter to the digit-first id before validating. A value
// already in canonical form (or anything unrecognized) is returned unchanged and
// then validated by pickAllowed against INTERVALS — so junk is still ignored.
function normalizeIntervalParam(value: string): string {
  const m = /^([PMmAd])(\d+)$/.exec(value);
  return m ? `${m[2]}${m[1]}` : value;
}

export function IntervalExplorer() {
  const [mode, setMode] = useState<Mode>("reference");

  // --- reference mode state ---
  const [root, setRoot] = useState("C");
  const [interval, setInterval] = useState("5P");
  // Default to 音名 (name) for consistency with the other explorers.
  const [labels, setLabels] = useState<LabelMode>("name");
  const [busy, setBusy] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  // Deep-link seeding (client only, after mount). e.g. /intervals?root=C&interval=P5.
  // Accepts quality-first (P5) or canonical (5P) interval ids; validated against
  // ROOT_OPTIONS / INTERVALS; invalid/missing ignored. Seeds reference mode.
  // Applied via the repo's "adjust state during render when an input changes"
  // pattern, not a setState-in-effect: params is null until hydration, so this
  // fires once when it first becomes non-null.
  const params = useInitialParams();
  const [seededFrom, setSeededFrom] = useState<Record<string, string> | null>(
    null,
  );
  if (params && params !== seededFrom) {
    setSeededFrom(params);
    const r = pickAllowed(params, "root", ROOT_OPTIONS);
    if (r) setRoot(r);
    const rawIvl = params.interval;
    if (rawIvl != null) {
      const ivl = pickAllowed(
        { interval: normalizeIntervalParam(rawIvl) },
        "interval",
        INTERVALS.map((i) => i.id),
      );
      if (ivl) setInterval(ivl);
    }
  }

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

  // The quiz answer options aren't toggles — emerald=correct, rose=wrong-pick
  // is answer FEEDBACK, not selection — so they stay raw buttons. This is just
  // the shared pill geometry they reuse.
  const quizPill =
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
        <ToggleButton
          active={mode === "reference"}
          onClick={() => setMode("reference")}
        >
          參考
        </ToggleButton>
        <ToggleButton active={mode === "quiz"} onClick={() => setMode("quiz")}>
          視覺測驗
        </ToggleButton>
      </div>

      {mode === "reference" ? (
        <>
          <div className="flex flex-wrap items-end gap-6">
            <Field label="根音 Root">
              <Select value={root} onChange={(e) => setRoot(e.target.value)}>
                {ROOT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="音程 Interval">
              <Select
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="min-w-64"
              >
                {INTERVALS.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.label}
                  </option>
                ))}
              </Select>
            </Field>

            <FieldGroup label="標籤 Label">
              <div className="flex gap-1">
                {LABELS.map((l) => (
                  <ToggleButton
                    key={l.id}
                    active={labels === l.id}
                    onClick={() => setLabels(l.id)}
                  >
                    {l.label}
                  </ToggleButton>
                ))}
              </div>
            </FieldGroup>

            <Button variant="secondary" onClick={exportPng} disabled={busy}>
              {busy ? "匯出中…" : "匯出 PNG"}
            </Button>
          </div>

          {legend}

          <ScrollableBoard ref={boardRef}>
            <Fretboard markers={markers} labelMode={labels} toFret={15} />
          </ScrollableBoard>
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
            <Button variant="ghost" onClick={resetQuiz}>
              重設
            </Button>
          </div>

          {legend}

          {/* Quiz board: degrees hidden (labelMode none) so the answer isn't
              given away by the degree text on the blue note. */}
          <ScrollableBoard>
            <Fretboard markers={quizMarkers} labelMode="none" toFret={15} />
          </ScrollableBoard>

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
                  className={`${quizPill} ${cls} disabled:cursor-default`}
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
              <Button variant="secondary" onClick={nextRound}>
                下一題 →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
