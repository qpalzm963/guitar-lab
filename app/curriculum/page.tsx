import type { Metadata } from "next";
import { CurriculumMap } from "@/components/curriculum/CurriculumMap";
import { PageShell } from "@/components/ui/PageShell";

export const metadata: Metadata = {
  title: "課程地圖 · guitar-lab",
  description: "六大領域的吉他課程地圖,標記已學進度並連到對應的練習工具。",
};

export default function CurriculumPage() {
  return (
    <PageShell
      eyebrow="開始學習"
      title="課程地圖"
      width="wide"
      subtitle="六大領域的學習路徑;勾選「已學」記錄進度(存在本機),有對應工具的項目可直接開啟,其餘標示「規劃中」。"
    >
      <CurriculumMap />
    </PageShell>
  );
}
