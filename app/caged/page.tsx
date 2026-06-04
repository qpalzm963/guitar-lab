import type { Metadata } from "next";
import { CagedExplorer } from "@/components/caged/CagedExplorer";
import { PageShell } from "@/components/ui/PageShell";

export const metadata: Metadata = {
  title: "CAGED 系統 · guitar-lab",
  description: "選根音與和弦性質,逐一檢視 C/A/G/E/D 五個把位區域內的和弦音分布。",
};

export default function CagedPage() {
  return (
    <PageShell
      eyebrow="樂理工具"
      title="CAGED 系統"
      subtitle="選根音與和弦性質,沿指板由低到高檢視 C/A/G/E/D 五個把位區域;每區顯示該範圍內所有和弦音的位置(而非單一指型外框)。可切換標籤(音名/級數)、匯出 PNG 作業卡。"
    >
      <CagedExplorer />
    </PageShell>
  );
}
