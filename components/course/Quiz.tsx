"use client";

import { useState } from "react";
import type { Question } from "@/lib/course/data";
import { useCourse } from "@/lib/store/course";

// Reusable multiple-choice quiz. Each question gives IMMEDIATE feedback the
// moment an option is picked (the picked option locks; correct/incorrect and the
// explanation show), so the learner learns as they go rather than only at the
// end. When every question has been answered we show the score and persist the
// result (best attempt) to the course store, keyed by the lesson slug.
//
// Pass threshold is a simple majority (>= 60%); "passed" is recorded so the list
// page can show a 通過 badge. The component is fully client-side and SSR-safe (no
// store reads during render — it only writes on completion and on retry reset).

const PASS_RATIO = 0.6;

export function Quiz({
  lessonSlug,
  questions,
}: {
  lessonSlug: string;
  questions: Question[];
}) {
  const recordQuiz = useCourse((s) => s.recordQuiz);

  // picked[i] = the option index the learner chose for question i (or -1).
  const [picked, setPicked] = useState<number[]>(() =>
    questions.map(() => -1),
  );
  const [recorded, setRecorded] = useState(false);

  const answeredCount = picked.filter((p) => p >= 0).length;
  const allAnswered = answeredCount === questions.length;
  const score = picked.reduce(
    (n, p, i) => n + (p === questions[i].answer ? 1 : 0),
    0,
  );
  const passed = questions.length > 0 && score / questions.length >= PASS_RATIO;

  function choose(qIndex: number, optIndex: number) {
    // Once answered, a question locks — picking is a one-shot per attempt.
    if (picked[qIndex] >= 0) return;
    const next = picked.slice();
    next[qIndex] = optIndex;
    setPicked(next);

    // If this answer completes the quiz, persist the result once.
    if (next.every((p) => p >= 0) && !recorded) {
      const finalScore = next.reduce(
        (n, p, i) => n + (p === questions[i].answer ? 1 : 0),
        0,
      );
      recordQuiz(lessonSlug, {
        score: finalScore,
        total: questions.length,
        passed: finalScore / questions.length >= PASS_RATIO,
      });
      setRecorded(true);
    }
  }

  function retry() {
    setPicked(questions.map(() => -1));
    setRecorded(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">小測驗</h2>
        <span className="text-sm text-gray-500">
          已作答 {answeredCount}/{questions.length}
        </span>
      </div>

      <ol className="space-y-5">
        {questions.map((q, qi) => {
          const chosen = picked[qi];
          const answered = chosen >= 0;
          return (
            <li
              key={q.id}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <p className="mb-3 text-sm font-medium text-gray-800">
                {qi + 1}. {q.prompt}
              </p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const isCorrect = oi === q.answer;
                  const isChosen = oi === chosen;
                  // Styling: before answering, neutral hover buttons. After
                  // answering, mark the correct option green and a wrong pick red.
                  let cls =
                    "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors";
                  if (!answered) {
                    cls +=
                      " border-gray-200 hover:bg-rose-50 hover:border-rose-200 cursor-pointer";
                  } else if (isCorrect) {
                    cls += " border-emerald-300 bg-emerald-50 text-emerald-800";
                  } else if (isChosen) {
                    cls += " border-rose-300 bg-rose-50 text-rose-800";
                  } else {
                    cls += " border-gray-200 text-gray-400";
                  }
                  return (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => choose(qi, oi)}
                      disabled={answered}
                      className={cls}
                    >
                      {opt}
                      {answered && isCorrect ? "  ✓" : ""}
                      {answered && isChosen && !isCorrect ? "  ✗" : ""}
                    </button>
                  );
                })}
              </div>
              {answered ? (
                <p
                  className={`mt-3 text-xs ${
                    chosen === q.answer ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {chosen === q.answer ? "答對了!" : "答錯了。"} {q.explanation}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>

      {allAnswered ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <span className="text-sm font-medium">
            得分 {score}/{questions.length}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              passed
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {passed ? "通過" : "再加油"}
          </span>
          <button
            type="button"
            onClick={retry}
            className="ml-auto rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer"
          >
            重新測驗
          </button>
        </div>
      ) : null}
    </div>
  );
}
