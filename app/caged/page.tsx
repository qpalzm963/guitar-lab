import type { Metadata } from "next";
import { CagedExplorer } from "@/components/caged/CagedExplorer";

export const metadata: Metadata = {
  title: "CAGED 系統 · guitar-lab",
  description: "選根音與和弦性質,逐一檢視 C/A/G/E/D 五個把位在指板上的位置。",
};

export default function CagedPage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-1 text-2xl font-bold">CAGED 系統</h1>
      <p className="mb-6 text-sm text-gray-500">
        選根音與和弦性質,沿指板由低到高逐一檢視 C/A/G/E/D 五個把位的和弦音分布;可切換標籤(音名/級數)、匯出 PNG 作業卡。
      </p>
      <CagedExplorer />
    </main>
  );
}
