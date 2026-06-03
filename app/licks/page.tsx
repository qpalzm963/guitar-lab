import type { Metadata } from "next";
import { LicksViewer } from "@/components/licks/LicksViewer";

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
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-1 text-2xl font-bold">樂句庫</h1>
      <p className="mb-6 text-sm text-gray-500">
        依音階與曲風兩軸挑選樂句,渲染六線譜+五線譜;可播放、循環、調整速度,並顯示播放游標。
      </p>
      <LicksViewer />
    </main>
  );
}
