import type { Metadata } from "next";
import { ChordExplorer } from "@/components/chord/ChordExplorer";
import { PageShell } from "@/components/ui/PageShell";

export const metadata: Metadata = {
  title: "和弦工具 · guitar-lab",
  description: "選根音與和弦類型,看和弦音在指板上的分布與常用按法。",
};

export default function ChordsPage() {
  return (
    <PageShell
      eyebrow="樂理工具"
      title="和弦工具"
      subtitle="選根音與和弦類型,看和弦音在指板上的分布與常用按法;可切換標籤(音名/級數)、匯出 PNG 作業卡。"
    >
      <ChordExplorer />
    </PageShell>
  );
}
