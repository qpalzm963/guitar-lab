"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Lesson } from "@/lib/course/data";
import type { CurriculumTool } from "@/lib/curriculum/data";
import { ALL_ITEMS } from "@/lib/curriculum/data";
import { useCourse } from "@/lib/store/course";
import { Quiz } from "./Quiz";

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

// The Pages basePath at runtime ("/guitar-lab" on Pages, "" in dev). Same source
// as lib/alphatab/assets.ts — the PDF lives under /public so its URL must carry
// the subpath prefix or it 404s on the deployed site.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Title lookup for the linked curriculum items, so the cross-reference shows the
// human title rather than the slug id.
const ITEM_TITLE = new Map(ALL_ITEMS.map((i) => [i.id, i.title]));

function PdfViewer({ pdf, title }: { pdf: string; title: string }) {
  // The teacher's PDFs are gitignored and NOT published, so on the deployed
  // (public) site the file is absent and the <iframe> would show a 404. We can't
  // reliably detect a cross-origin 404 inside an iframe, so we probe the URL with
  // a HEAD request first and only mount the iframe when the file is reachable;
  // otherwise we show a zh-TW placeholder. In local dev the file is present and
  // the probe succeeds. Probe runs client-side only (effect), so SSR is unaffected.
  const src = `${BASE_PATH}/materials/${pdf}`;
  const [status, setStatus] = useState<"checking" | "ok" | "missing">(
    "checking",
  );

  useEffect(() => {
    let cancelled = false;
    fetch(src, { method: "HEAD" })
      .then((res) => {
        if (!cancelled) setStatus(res.ok ? "ok" : "missing");
      })
      .catch(() => {
        if (!cancelled) setStatus("missing");
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  if (status === "missing") {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <p className="text-sm font-medium text-gray-600">
          教材 PDF 由老師本機提供(未公開)
        </p>
        <p className="text-xs text-gray-400">
          線上版不含老師的版權教材;下方的章節大綱、相關工具與小測驗皆可正常使用。
        </p>
      </div>
    );
  }

  if (status === "checking") {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-8">
        <p className="text-sm text-gray-400">載入教材中…</p>
      </div>
    );
  }

  return (
    <iframe
      src={src}
      title={`${title} 教材 PDF`}
      className="h-[70vh] w-full rounded-lg border border-gray-200"
    />
  );
}

export function LessonView({ lesson }: { lesson: Lesson }) {
  // Store uses skipHydration; pull persisted progress on the client only — same
  // pattern as CurriculumMap and FretboardExplorer.
  useEffect(() => {
    useCourse.persist.rehydrate();
  }, []);

  const done = useCourse((s) => s.lessons[lesson.slug]?.done === true);
  const quiz = useCourse((s) => s.lessons[lesson.slug]?.quiz);
  const toggleDone = useCourse((s) => s.toggleDone);

  return (
    <div className="space-y-8">
      <Link
        href="/course"
        className="inline-block text-sm text-rose-700 hover:underline"
      >
        ← 返回課程列表
      </Link>

      {/* PDF viewer (graceful fallback when the file is absent). */}
      <section>
        <h2 className="mb-2 text-lg font-semibold">教材</h2>
        <PdfViewer pdf={lesson.pdf} title={lesson.title} />
      </section>

      {/* Chapter outline. */}
      <section>
        <h2 className="mb-2 text-lg font-semibold">章節大綱</h2>
        <ol className="list-decimal space-y-1 pl-6 text-sm text-gray-700">
          {lesson.chapters.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ol>
      </section>

      {/* Linked curriculum items + tools. */}
      <section>
        <h2 className="mb-2 text-lg font-semibold">相關工具</h2>
        <div className="flex flex-wrap gap-2">
          {lesson.tools.map((t) => (
            <Link
              key={t}
              href={t}
              className="rounded-md border border-rose-200 px-3 py-1.5 text-sm text-rose-700 transition-colors hover:bg-rose-50"
            >
              開啟{TOOL_LABEL[t]} →
            </Link>
          ))}
        </div>
        {lesson.curriculumItemIds.length > 0 ? (
          <p className="mt-3 text-xs text-gray-500">
            對應課程地圖項目:
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
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
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
