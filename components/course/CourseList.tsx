"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ORDERED_LESSONS, TOTAL_LESSONS } from "@/lib/course/data";
import { useCourse } from "@/lib/store/course";

// Topics the teacher still delivers live (video / handouts), not as built tools
// or PDFs in this app. We surface them as a light placeholder so the course feels
// complete without inventing content. These mirror the 6-area map's C-category
// areas that are "lesson content, no interactive tool".
const TEACHER_TOPICS = ["技巧", "曲風", "編曲", "器材"];

function LessonCard({
  slug,
  order,
  title,
  summary,
}: {
  slug: string;
  order: number;
  title: string;
  summary: string;
}) {
  // Subscribe to this lesson's record so the card reflects done / quiz status.
  const done = useCourse((s) => s.lessons[slug]?.done === true);
  const quiz = useCourse((s) => s.lessons[slug]?.quiz);

  return (
    <Link
      href={`/course/${slug}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-rose-200 hover:bg-rose-50/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">
            <span className="mr-2 text-gray-400">第 {order} 課</span>
            {title}
          </h2>
          <p className="mt-1 text-sm text-gray-500">{summary}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {done ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              已完成
            </span>
          ) : (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              未完成
            </span>
          )}
          {quiz ? (
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                quiz.passed
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              測驗 {quiz.score}/{quiz.total}
            </span>
          ) : (
            <span className="rounded-full bg-gray-50 px-2 py-0.5 text-xs text-gray-400">
              未測驗
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function CourseList() {
  // skipHydration store: rehydrate on the client only (same pattern as the map).
  useEffect(() => {
    useCourse.persist.rehydrate();
  }, []);

  const doneTotal = useCourse((s) =>
    Object.values(s.lessons).filter((l) => l.done === true).length,
  );

  return (
    <div className="space-y-6">
      <span className="text-sm font-medium">
        已完成 {doneTotal}/{TOTAL_LESSONS} 課
      </span>

      <div className="space-y-3">
        {ORDERED_LESSONS.map((l) => (
          <LessonCard
            key={l.slug}
            slug={l.slug}
            order={l.order}
            title={l.title}
            summary={l.summary}
          />
        ))}
      </div>

      {/* Teacher-delivered content placeholder — no fake content, just a note. */}
      <section className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
        <h2 className="text-sm font-semibold text-gray-700">老師補充教學內容</h2>
        <p className="mt-1 text-xs text-gray-500">
          以下主題由老師以影片/講義方式補充教學,本工具不提供對應內容:
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TEACHER_TOPICS.map((t) => (
            <span
              key={t}
              className="rounded-md border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-500"
            >
              {t}(教學中)
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
