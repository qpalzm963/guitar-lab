import type { Metadata } from "next";
import { HarmonyExplorer } from "@/components/harmony/HarmonyExplorer";
import { PageShell } from "@/components/ui/PageShell";

export const metadata: Metadata = {
  title: "進階和聲 · guitar-lab",
  description:
    "在指板上互動探索次屬和弦、大小調互換、三全音代理、轉位和弦與 Drop 2 voicing。",
};

// Server shell (same pattern as /intervals and /licks): static metadata + a
// client island holding all interaction. The page is fully static-exportable.
export default function HarmonyPage() {
  return (
    <PageShell
      eyebrow="樂理工具"
      title="進階和聲"
      subtitle="五個互動主題:次屬和弦、大小調互換(借用和弦)、三全音代理、轉位和弦、Drop 2 voicing。選擇主題與參數,即可在指板上看到對應的和弦音、級數與低音,並匯出 PNG。"
    >
      <HarmonyExplorer />
    </PageShell>
  );
}
