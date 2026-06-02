import type { Metadata } from "next";
import { AlphaTabSpike } from "@/components/spike/AlphaTabSpike";

export const metadata: Metadata = {
  title: "alphaTab spike · guitar-lab",
  description: "Isolated spike: render + playback via @coderline/alphatab.",
};

// Isolated technical spike. Not linked from the app nav. De-risks the future
// "licks / tab viewer" phase by proving alphaTab can render notation and wire
// up playback under Next.js 16 + Turbopack. See AlphaTabSpike for the loading
// strategy (runtime ESM import from /public to bypass bundler worker tracing).
export default function AlphaTabSpikePage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-1 text-2xl font-bold">alphaTab spike</h1>
      <p className="mb-6 text-sm text-gray-500">
        隔離測試:用 @coderline/alphatab 渲染吉他譜並接上播放器。此頁不在正式導覽中。
      </p>
      <AlphaTabSpike />
    </main>
  );
}
