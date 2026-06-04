import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/ui/PageShell";

export const metadata: Metadata = {
  title: "找不到頁面 · guitar-lab",
  description: "你要找的頁面不存在,或可能已經被移動。",
};

export default function NotFound() {
  return (
    <PageShell
      eyebrow="404"
      title="找不到這個頁面"
      width="reading"
      subtitle="你要找的頁面不存在,或可能已經被移動。回首頁重新開始,或直接前往課程。"
    >
      <div className="flex flex-wrap gap-3">
        <Button href="/">回首頁</Button>
        <Button href="/course" variant="ghost">
          前往課程 →
        </Button>
      </div>
    </PageShell>
  );
}
