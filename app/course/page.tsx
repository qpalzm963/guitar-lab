import type { Metadata } from "next";
import { CourseList } from "@/components/course/CourseList";

export const metadata: Metadata = {
  title: "課程 · guitar-lab",
  description:
    "依老師教材整理的五堂課:音階、CAGED、和弦系統、順階和弦、基本功;每課含教材、章節大綱、相關工具與小測驗,並記錄完成進度。",
};

// Server shell (same pattern as /intervals and /harmony): static metadata + a
// client island holding all interaction. Fully static-exportable.
export default function CoursePage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-1 text-2xl font-bold">課程</h1>
      <p className="mb-6 text-sm text-gray-500">
        依老師教材整理的五堂課。每課提供教材 PDF、章節大綱、可直接開啟的練習工具,以及一個小測驗;完成狀態與測驗成績存在本機。
      </p>
      <CourseList />
    </main>
  );
}
