"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  newIntervalQuestion,
  newChordQuestion,
  validate,
  type EarQuestion,
} from "@/lib/audio/earTraining";
import {
  NotePlayer,
  intervalNotes,
  chordNotes,
  type PlayMode,
} from "@/lib/audio/notePlayer";
import { Button } from "@/components/ui/Button";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { FieldGroup } from "@/components/ui/Field";

// Ear-training quiz: the learner HEARS an interval or chord and identifies it
// from four choices — no fretboard, no visual hint. Same rules as Metronome /
// Drone: the Tone.js-backed NotePlayer is created lazily on the first 播放 click
// (inside the user gesture, where Tone.start() is awaited) and disposed on
// unmount, so this stays SSR-/static-export-safe.

type TestType = "interval" | "chord";

const TEST_TYPES: { id: TestType; label: string }[] = [
  { id: "interval", label: "音程" },
  { id: "chord", label: "和弦" },
];

const PLAY_MODES: { id: PlayMode; label: string }[] = [
  { id: "ascending", label: "上行" },
  { id: "descending", label: "下行" },
  { id: "together", label: "同時" },
];

function newQuestion(type: TestType): EarQuestion {
  return type === "interval" ? newIntervalQuestion() : newChordQuestion();
}

// The notes to sound for a question: interval → root + transposed note;
// chord → the chord's stacked voicing. answerId is the tonal interval name
// (e.g. "3M") or chord symbol (e.g. "maj7", or "" for a major triad).
function questionNotes(type: TestType, q: EarQuestion): string[] {
  return type === "interval"
    ? intervalNotes(q.root, q.answerId)
    : chordNotes(q.root, q.answerId);
}

// The answer options aren't toggles — emerald=correct, rose=wrong-pick is answer
// FEEDBACK, not selection — so they stay raw buttons reusing IntervalExplorer's
// quiz pill geometry.
const QUIZ_PILL =
  "rounded-md px-3 py-1.5 text-sm border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 disabled:cursor-default";

export function EarTraining() {
  const [testType, setTestType] = useState<TestType>("interval");
  const [playMode, setPlayMode] = useState<PlayMode>("ascending");
  // null on the server + the first client (hydration) render; seeded just below
  // once mounted. Generating the first question in a useState initializer would
  // run during SSR with a different Math.random() than the client → a hydration
  // mismatch on /practice.
  const [question, setQuestion] = useState<EarQuestion | null>(null);

  // false during SSR + the hydration render, true only after the client mounts —
  // a lint-clean alternative to seeding state in an effect.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  // Adjust-during-render (the repo's pattern, cf. IntervalExplorer's deep-link
  // seeding): once mounted, seed the first random question. Runs once — after it
  // sets, `question` is non-null so the guard is false on the next render.
  if (mounted && !question) setQuestion(newQuestion("interval"));

  // After-answer feedback. `picked` can legitimately be "" (the major-triad
  // option id), so a separate `answered` flag — NOT picked-truthiness — gates the
  // lock and reveal.
  const [answered, setAnswered] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);

  const playerRef = useRef<NotePlayer | null>(null);
  // Tracks whether the user has played at least once (so we have an unlocked
  // AudioContext from a gesture). Only then may a fresh question auto-play — we
  // never make sound before the first user gesture.
  const unlockedRef = useRef(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Teardown on unmount: dispose the player so the AudioContext nodes are freed.
  useEffect(() => {
    return () => {
      void playerRef.current?.dispose();
      playerRef.current = null;
    };
  }, []);

  async function play(type: TestType, q: EarQuestion) {
    // CRITICAL: playNotes() awaits Tone.start() inside this user-gesture handler
    // before sounding — the #1 "no sound" fix. Wrapped so a blocked AudioContext
    // (autoplay policy, iOS) surfaces an inline message instead of silent failure.
    try {
      if (!playerRef.current) playerRef.current = new NotePlayer();
      await playerRef.current.playNotes(questionNotes(type, q), playMode);
      unlockedRef.current = true;
      setAudioError(null);
    } catch {
      setAudioError("無法播放音訊,請先點擊頁面再試一次。");
    }
  }

  function handlePlay() {
    if (!question) return;
    void play(testType, question);
  }

  // Move to a fresh question of `type`, resetting answer state. If audio is
  // already unlocked (user has played once) auto-play it; otherwise stay silent
  // until they press 播放.
  function goToQuestion(type: TestType) {
    const q = newQuestion(type);
    setQuestion(q);
    setAnswered(false);
    setPicked(null);
    if (unlockedRef.current) void play(type, q);
  }

  function switchType(type: TestType) {
    if (type === testType) return;
    setTestType(type);
    // Switching type generates a fresh question of that type.
    goToQuestion(type);
  }

  function answer(id: string) {
    if (answered || !question) return; // lock once answered until 下一題
    setAnswered(true);
    setPicked(id);
    setTotal((t) => t + 1);
    if (validate(question, id)) setScore((s) => s + 1);
  }

  function resetQuiz() {
    setScore(0);
    setTotal(0);
    goToQuestion(testType);
  }

  return (
    <section className="space-y-5 rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">聽力測驗</h2>
        <span className="text-sm text-gray-500">
          得分 {score}/{total}
        </span>
      </div>

      {audioError && (
        <p className="text-sm text-rose-600" role="alert">
          {audioError}
        </p>
      )}

      <p className="text-sm text-gray-500">
        用耳朵聽,辨認播放的是哪個{testType === "interval" ? "音程" : "和弦"}。
      </p>

      {/* Test type */}
      <FieldGroup label="測驗類型">
        <div className="flex gap-1">
          {TEST_TYPES.map((t) => (
            <ToggleButton
              key={t.id}
              active={testType === t.id}
              onClick={() => switchType(t.id)}
            >
              {t.label}
            </ToggleButton>
          ))}
        </div>
      </FieldGroup>

      {/* Play mode */}
      <FieldGroup label="播放方式">
        <div className="flex gap-1">
          {PLAY_MODES.map((m) => (
            <ToggleButton
              key={m.id}
              active={playMode === m.id}
              onClick={() => setPlayMode(m.id)}
            >
              {m.label}
            </ToggleButton>
          ))}
        </div>
      </FieldGroup>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={handlePlay}>
          ▶ 播放
        </Button>
        <Button variant="ghost" onClick={resetQuiz}>
          重設
        </Button>
      </div>

      {/* Options: NO fretboard, NO visual hint. Key by index — the major-triad
          option id is the empty string, so an id-as-key would collide with React's
          empty-string handling; rendering uses option.label and matching uses
          option.id / answerId (never id truthiness). */}
      {question && (
        <div className="flex flex-wrap gap-2">
          {question.options.map((option, i) => {
            const isAnswer = option.id === question.answerId;
            const isPicked = answered && option.id === picked;
            // Before answering: neutral. After: correct → green, wrong pick → red.
            const cls = !answered
              ? "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              : isAnswer
                ? "border-emerald-600 bg-emerald-600 text-white"
                : isPicked
                  ? "border-rose-600 bg-rose-600 text-white"
                  : "border-gray-300 bg-white text-gray-400";
            return (
              <button
                key={i}
                onClick={() => answer(option.id)}
                disabled={answered}
                className={`${QUIZ_PILL} ${cls}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}

      {answered && question && (
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm">
            {validate(question, picked ?? "") ? "答對了!" : "答錯了。"}正解:
            <span className="font-semibold">
              {" "}
              {question.options.find((o) => o.id === question.answerId)?.label}
            </span>
          </span>
          <Button variant="secondary" onClick={() => goToQuestion(testType)}>
            下一題 →
          </Button>
        </div>
      )}
    </section>
  );
}
