import type { Metadata } from "next";
import { CourseList } from "@/components/course/CourseList";
import { PageShell } from "@/components/ui/PageShell";

export const metadata: Metadata = {
  title: "課程 · guitar-lab",
  description:
    "六堂吉他課:基本功、音程、音階、和弦系統、順階和弦、CAGED;每課含原創課程講解、相關工具與小測驗,並記錄學習進度。",
};

// Server shell (same pattern as /intervals and /harmony): static metadata + a
// client island holding all interaction. Fully static-exportable.
export default function CoursePage() {
  return (
    <PageShell
      eyebrow="開始學習"
      title="課程"
      width="reading"
      subtitle="六堂課,每課含原創課程講解(目標、概念、常見錯誤、練習步驟)、可直接開啟的練習工具,以及一個小測驗;完成狀態與測驗成績都存在你的瀏覽器本機。"
    >
      <CourseList />
    </PageShell>
  );
}
