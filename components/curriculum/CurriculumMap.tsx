"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  CURRICULUM,
  CATEGORY_LEGEND,
  TOTAL_ITEMS,
  type CurriculumItem,
  type CurriculumCategory,
} from "@/lib/curriculum/data";
import { useProgress } from "@/lib/store/progress";
import { lessonSlugForItem } from "@/lib/course/data";

// Category badge colors. Kept muted so the row content stays the focus; the
// legend at the top spells each letter out in zh-TW.
const CATEGORY_STYLE: Record<CurriculumCategory, string> = {
  A: "bg-rose-100 text-rose-700",
  B: "bg-amber-100 text-amber-700",
  C: "bg-gray-100 text-gray-600",
  D: "bg-sky-100 text-sky-700",
};

function ItemRow({ item }: { item: CurriculumItem }) {
  // Subscribe to this item's done flag so the row re-renders on toggle. Reading
  // the record (not calling isDone) keeps the subscription value-based.
  const done = useProgress((s) => s.done[item.id] === true);
  const toggle = useProgress((s) => s.toggle);
  // For items with no built tool, the course lesson (if any) that teaches this
  // item — so we can offer 看課程 instead of a dead 規劃中 badge.
  const lessonSlug = item.tool ? undefined : lessonSlugForItem(item.id);

  return (
    <li className="flex items-center gap-2 py-1.5">
      <input
        type="checkbox"
        checked={done}
        onChange={() => toggle(item.id)}
        aria-label={`已學 ${item.title}`}
        className="h-4 w-4 shrink-0 cursor-pointer accent-rose-600"
      />
      <span
        className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold ${CATEGORY_STYLE[item.category]}`}
        title={CATEGORY_LEGEND.find((c) => c.id === item.category)?.label}
      >
        {item.category}
      </span>
      <span className={`flex-1 text-sm ${done ? "text-gray-400 line-through" : "text-gray-800"}`}>
        {item.title}
      </span>
      {item.tool ? (
        <Link
          href={item.tool}
          className="shrink-0 rounded-md border border-rose-200 px-2 py-0.5 text-xs text-rose-700 hover:bg-rose-50"
        >
          開啟工具 →
        </Link>
      ) : lessonSlug ? (
        // No built tool, but a course lesson teaches this item — link there
        // instead of a dead 規劃中 badge.
        <Link
          href={`/course/${lessonSlug}`}
          className="shrink-0 rounded-md border border-amber-200 px-2 py-0.5 text-xs text-amber-700 hover:bg-amber-50"
        >
          看課程 →
        </Link>
      ) : (
        <span className="shrink-0 rounded-md border border-gray-200 px-2 py-0.5 text-xs text-gray-400">
          規劃中
        </span>
      )}
    </li>
  );
}

export function CurriculumMap() {
  // Store uses skipHydration; pull persisted progress on the client only — same
  // pattern as FretboardExplorer's settings rehydrate.
  useEffect(() => {
    useProgress.persist.rehydrate();
  }, []);

  const doneTotal = useProgress((s) => Object.keys(s.done).length);
  const clearAll = useProgress((s) => s.clearAll);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="text-sm font-medium">
          已學 {doneTotal}/{TOTAL_ITEMS}
        </span>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {CATEGORY_LEGEND.map((c) => (
            <span key={c.id} className="flex items-center gap-1">
              <span
                className={`rounded px-1.5 py-0.5 font-semibold ${CATEGORY_STYLE[c.id]}`}
              >
                {c.id}
              </span>
              {c.label}
            </span>
          ))}
        </div>
        <button
          onClick={clearAll}
          className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer"
        >
          清除進度
        </button>
      </div>

      {/* The 6 areas as a responsive multi-column map (the curriculum spine). */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {CURRICULUM.map((group) => (
            <section
              key={group.area}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <h2 className="mb-2 border-b border-gray-100 pb-2 text-lg font-semibold">
                {group.area}
                <span className="ml-2 text-xs font-normal text-gray-400">
                  {group.items.length} 項
                </span>
              </h2>
              <ul className="divide-y divide-gray-50">
                {group.items.map((item) => (
                  <ItemRow key={item.id} item={item} />
                ))}
              </ul>
            </section>
        ))}
      </div>
    </div>
  );
}
