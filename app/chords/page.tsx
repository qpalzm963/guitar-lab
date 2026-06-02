import type { Metadata } from "next";
import { ChordExplorer } from "@/components/chord/ChordExplorer";

export const metadata: Metadata = {
  title: "和弦工具 · guitar-lab",
  description: "選根音與和弦類型,看和弦音在指板上的分布與常用按法。",
};

export default function ChordsPage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-1 text-2xl font-bold">和弦工具</h1>
      <p className="mb-6 text-sm text-gray-500">
        選根音與和弦類型,看和弦音在指板上的分布與常用按法;可切換標籤(音名/級數)、匯出 PNG 作業卡。
      </p>
      <ChordExplorer />
    </main>
  );
}
