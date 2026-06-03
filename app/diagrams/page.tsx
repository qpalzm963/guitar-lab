import type { Metadata } from "next";
import { DiagramLibrary } from "@/components/diagram/DiagramLibrary";
import { PageShell } from "@/components/ui/PageShell";

export const metadata: Metadata = {
  title: "圖表編輯器 · guitar-lab",
  description: "手動製作指板圖作業卡,儲存到圖庫,匯出 PNG 或列印。",
};

export default function DiagramsPage() {
  return (
    <PageShell
      eyebrow="練習與製作"
      title="圖表編輯器"
      subtitle="在指板上點按新增/移除音點,自訂角色與標籤,製作作業卡;可存入圖庫、匯出 PNG、列印。"
    >
      <DiagramLibrary />
    </PageShell>
  );
}
