import type { Metadata } from "next";
import { LicksViewer } from "@/components/licks/LicksViewer";
import { PageShell } from "@/components/ui/PageShell";

export const metadata: Metadata = {
  title: "樂句庫 · guitar-lab",
  description:
    "依音階與曲風兩軸瀏覽吉他樂句,渲染六線譜與五線譜,可播放、循環與調整速度。",
};

// Server shell (same pattern as /intervals): static metadata + a client island.
// The viewer and its alphaTab player are client-only (alphaTab needs the browser),
// so all the heavy runtime stays in the /licks bundle.
export default function LicksPage() {
  return (
    <PageShell
      eyebrow="練習與製作"
      title="樂句庫"
      subtitle="依音階與曲風兩軸挑選樂句,渲染六線譜+五線譜;可播放、循環、調整速度,並顯示播放游標。"
    >
      <LicksViewer />
    </PageShell>
  );
}
