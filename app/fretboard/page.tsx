import type { Metadata } from "next";
import { FretboardExplorer } from "@/components/fretboard/FretboardExplorer";
import { PageShell } from "@/components/ui/PageShell";

export const metadata: Metadata = {
  title: "指板探索 · guitar-lab",
  description: "選音階與根音,在指板上看音的分布。",
};

export default function FretboardPage() {
  return (
    <PageShell
      eyebrow="樂理工具"
      title="指板探索"
      subtitle="選音階與根音,看音在指板上的分布;可切換標籤(音名/級數)、匯出 PNG 作業卡。"
    >
      <FretboardExplorer />
    </PageShell>
  );
}
