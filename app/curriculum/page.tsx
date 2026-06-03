import type { Metadata } from "next";
import { CurriculumMap } from "@/components/curriculum/CurriculumMap";

export const metadata: Metadata = {
  title: "課程地圖 · guitar-lab",
  description: "六大領域的吉他課程地圖,標記已學進度並連到對應的練習工具。",
};

export default function CurriculumPage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-1 text-2xl font-bold">課程地圖</h1>
      <p className="mb-6 text-sm text-gray-500">
        六大領域的學習路徑;勾選「已學」記錄進度(存在本機),有對應工具的項目可直接開啟,其餘標示「規劃中」。
      </p>
      <CurriculumMap />
    </main>
  );
}
