import type { Metadata } from "next";
import { IntervalExplorer } from "@/components/interval/IntervalExplorer";

export const metadata: Metadata = {
  title: "音程練習 · guitar-lab",
  description: "選根音與音程,在指板上看每個音程音的分布;可做視覺測驗。",
};

export default function IntervalsPage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-1 text-2xl font-bold">音程練習</h1>
      <p className="mb-6 text-sm text-gray-500">
        選根音與音程,看音程音在指板上的分布;可切換標籤(音名/級數)、匯出 PNG,或用視覺測驗練習辨認音程(暫無聲音)。
      </p>
      <IntervalExplorer />
    </main>
  );
}
