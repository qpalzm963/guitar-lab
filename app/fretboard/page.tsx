import type { Metadata } from "next";
import { FretboardExplorer } from "@/components/fretboard/FretboardExplorer";

export const metadata: Metadata = {
  title: "指板探索 · guitar-lab",
  description: "選音階與根音,在指板上看音的分布。",
};

export default function FretboardPage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-1 text-2xl font-bold">指板探索</h1>
      <p className="mb-6 text-sm text-gray-500">
        選音階與根音,看音在指板上的分布;可切換標籤(音名/級數)、匯出 PNG 作業卡。
      </p>
      <FretboardExplorer />
    </main>
  );
}
