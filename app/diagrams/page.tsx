import type { Metadata } from "next";
import { DiagramLibrary } from "@/components/diagram/DiagramLibrary";

export const metadata: Metadata = {
  title: "圖表編輯器 · guitar-lab",
  description: "手動製作指板圖作業卡,儲存到圖庫,匯出 PNG 或列印。",
};

export default function DiagramsPage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-1 text-2xl font-bold">圖表編輯器</h1>
      <p className="mb-6 text-sm text-gray-500">
        在指板上點按新增/移除音點,自訂角色與標籤,製作作業卡;可存入圖庫、匯出 PNG、列印。
      </p>
      <DiagramLibrary />
    </main>
  );
}
