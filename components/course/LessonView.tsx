"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { Lesson } from "@/lib/course/data";
import type { CurriculumTool } from "@/lib/curriculum/data";
import { ALL_ITEMS } from "@/lib/curriculum/data";
import { LESSON_CONTENT } from "@/lib/course/lessonContent";
import { useCourse } from "@/lib/store/course";
import { Quiz } from "./Quiz";
import { LessonFigure } from "./LessonFigures";

// zh-TW labels for the "相關工具" links. Kept here (not in curriculum data) because
// these are course-page presentation strings; the routes themselves are validated
// against the real app routes by the data test.
const TOOL_LABEL: Record<CurriculumTool, string> = {
  "/fretboard": "指板探索",
  "/chords": "和弦工具",
  "/caged": "CAGED 系統",
  "/intervals": "音程練習",
  "/harmony": "進階和聲",
  "/practice": "練習工具",
  "/licks": "樂句庫",
  "/spike/alphatab": "alphaTab 譜例",
};

// Title lookup for the linked curriculum items, so the cross-reference shows the
// human title rather than the slug id.
const ITEM_TITLE = new Map(ALL_ITEMS.map((i) => [i.id, i.title]));

const toolLinkCls =
  "inline-block rounded-md border border-rose-200 px-3 py-1.5 text-sm text-rose-700 transition-colors hover:bg-rose-50";

export function LessonView({ lesson }: { lesson: Lesson }) {
  // Store uses skipHydration; pull persisted progress on the client only — same
  // pattern as CurriculumMap and FretboardExplorer.
  useEffect(() => {
    useCourse.persist.rehydrate();
  }, []);

  const done = useCourse((s) => s.lessons[lesson.slug]?.done === true);
  const quiz = useCourse((s) => s.lessons[lesson.slug]?.quiz);
  const toggleDone = useCourse((s) => s.toggleDone);

  // Original, copyright-safe written lesson (replaces the teacher's PDFs — the
  // app ships none of them). See lib/course/lessonContent.ts.
  const content = LESSON_CONTENT[lesson.slug];

  return (
    <div className="space-y-8">
      <Link
        href="/course"
        className="inline-block text-sm text-rose-700 hover:underline"
      >
        ← 返回課程列表
      </Link>

      {content && (
        <>
          {/* Objectives. */}
          <section>
            <h2 className="mb-2 text-lg font-semibold">學習目標</h2>
            <ul className="list-disc space-y-1 pl-6 text-sm text-gray-700">
              {content.objectives.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </section>

          {/* Lesson body — original written sections. */}
          {content.sections.map((s) => (
            <section key={s.heading} className="space-y-2">
              <h2 className="text-lg font-semibold">{s.heading}</h2>
              {s.paragraphs.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-gray-700">
                  {p}
                </p>
              ))}
              {s.diagram ? <LessonFigure id={s.diagram} /> : null}
              {s.bullets && s.bullets.length > 0 ? (
                <ul className="list-disc space-y-1 pl-6 text-sm text-gray-700">
                  {s.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : null}
              {s.tool ? (
                <Link href={s.tool.href} className={toolLinkCls}>
                  {s.tool.label} →
                </Link>
              ) : null}
            </section>
          ))}

          {/* Common mistakes. */}
          <section>
            <h2 className="mb-2 text-lg font-semibold">常見錯誤</h2>
            <ul className="list-disc space-y-1 pl-6 text-sm text-gray-700">
              {content.commonMistakes.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </section>

          {/* Practice steps. */}
          <section>
            <h2 className="mb-2 text-lg font-semibold">練習步驟</h2>
            <ol className="list-decimal space-y-1 pl-6 text-sm text-gray-700">
              {content.practiceSteps.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ol>
          </section>
        </>
      )}

      {/* Linked curriculum items + tools. */}
      <section>
        <h2 className="mb-2 text-lg font-semibold">相關工具</h2>
        <div className="flex flex-wrap gap-2">
          {lesson.tools.map((t) => (
            <Link
              key={t}
              href={`${t}${lesson.toolParams?.[t] ?? ""}`}
              className={toolLinkCls}
            >
              開啟{TOOL_LABEL[t]} →
            </Link>
          ))}
        </div>
        {lesson.curriculumItemIds.length > 0 ? (
          <p className="mt-3 text-xs text-gray-500">
            涵蓋主題:
            {lesson.curriculumItemIds
              .map((id) => ITEM_TITLE.get(id) ?? id)
              .join("、")}
          </p>
        ) : null}
      </section>

      {/* Quiz. */}
      <section>
        <Quiz lessonSlug={lesson.slug} questions={lesson.quiz} />
        {quiz ? (
          <p className="mt-2 text-xs text-gray-500">
            最佳成績:{quiz.score}/{quiz.total}
            {quiz.passed ? "(已通過)" : ""}
          </p>
        ) : null}
      </section>

      {/* Mark-done. */}
      <section className="flex items-center gap-3 border-t border-gray-100 pt-6">
        <button
          type="button"
          onClick={() => toggleDone(lesson.slug)}
          className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            done
              ? "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              : "bg-rose-600 text-white hover:bg-rose-700"
          }`}
        >
          {done ? "✓ 已完成(點此取消)" : "標記完成"}
        </button>
        {done ? (
          <span className="text-sm text-emerald-700">這課已標記為完成</span>
        ) : null}
      </section>
    </div>
  );
}
