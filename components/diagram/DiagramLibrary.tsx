"use client";

import { useEffect, useRef, useState } from "react";
import { Fretboard } from "@/components/fretboard/Fretboard";
import { DiagramEditor } from "./DiagramEditor";
import { downloadSvgAsPng } from "@/lib/export/svgToPng";
import { useDiagrams, type SavedDiagram } from "@/lib/store/diagrams";
import { Button } from "@/components/ui/Button";

// Open/edit avoids a dynamic [id] route (static export can't prerender runtime
// ids): the editor is rendered inline via local view state. "list" shows the
// library; "edit" embeds DiagramEditor seeded with the chosen diagram. A new
// diagram uses the same editor with no seed.
type View =
  | { mode: "list" }
  | { mode: "edit"; diagram?: SavedDiagram };

export function DiagramLibrary() {
  const diagrams = useDiagrams((s) => s.diagrams);
  const remove = useDiagrams((s) => s.remove);
  const clearAll = useDiagrams((s) => s.clearAll);
  const exportJson = useDiagrams((s) => s.exportJson);
  const importJson = useDiagrams((s) => s.importJson);

  const [view, setView] = useState<View>({ mode: "list" });
  const [hydrated, setHydrated] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Store uses skipHydration; pull persisted diagrams on the client only. We
  // flag hydration to avoid rendering the SSR-empty list before localStorage is
  // read. zustand resolves rehydrate() in a microtask (even for sync storage),
  // so onFinishHydration fires after this effect returns — setState there is the
  // lint-approved external-system callback, not a synchronous setState-in-effect.
  useEffect(() => {
    const unsub = useDiagrams.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    useDiagrams.persist.rehydrate();
    return unsub;
  }, []);

  function exportItemPng(id: string, fallbackName: string) {
    const svg = document.querySelector<SVGSVGElement>(
      `[data-preview="${id}"] svg`,
    );
    if (!svg) return;
    downloadSvgAsPng(svg, `${fallbackName}.png`).catch(() => {
      window.alert("匯出 PNG 失敗,請重試。");
    });
  }

  function backupJson() {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = "guitar-lab-diagrams.json";
      a.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset the input so picking the same file again re-fires onChange.
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = importJson(String(reader.result ?? ""));
      if (!res.ok) {
        window.alert(`匯入失敗:${res.error ?? "未知錯誤"}`);
      }
    };
    reader.readAsText(file);
  }

  if (view.mode === "edit") {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setView({ mode: "list" })}
          className="no-print"
        >
          ← 返回圖庫
        </Button>
        <DiagramEditor
          initial={view.diagram}
          onSaved={() => setView({ mode: "list" })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={() => setView({ mode: "edit" })}>
          + 新增圖表
        </Button>
        <Button variant="ghost" onClick={backupJson}>
          匯出 JSON 備份
        </Button>
        <Button variant="ghost" onClick={() => fileRef.current?.click()}>
          匯入 JSON
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={onImportFile}
          className="hidden"
        />
        <Button
          variant="ghost"
          onClick={() => {
            if (window.confirm("確定要清空整個圖庫嗎?此動作無法復原。")) {
              clearAll();
            }
          }}
        >
          清空圖庫
        </Button>
      </div>

      {!hydrated ? (
        <p className="text-sm text-gray-400">載入中…</p>
      ) : diagrams.length === 0 ? (
        <p className="text-sm text-gray-500">
          還沒有儲存的圖表。點「新增圖表」開始製作作業卡。
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {diagrams.map((d) => (
            <li
              key={d.id}
              className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-gray-900">{d.name}</span>
                <time
                  dateTime={new Date(d.createdAt).toISOString()}
                  className="text-xs text-gray-500"
                >
                  {new Date(d.createdAt).toLocaleDateString("zh-TW")}
                </time>
              </div>
              {d.title ? (
                <p className="text-xs text-gray-500">{d.title}</p>
              ) : null}
              <div
                data-preview={d.id}
                className="overflow-hidden rounded border border-gray-100"
              >
                <Fretboard
                  markers={d.markers}
                  tuning={d.tuning}
                  toFret={d.toFret}
                  labelMode="name"
                  ariaLabel={`${d.name} 的指板圖${d.title ? `:${d.title}` : ""}`}
                />
              </div>
              <div className="mt-1 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  aria-label={`開啟 / 編輯「${d.name}」`}
                  onClick={() => setView({ mode: "edit", diagram: d })}
                >
                  開啟 / 編輯
                </Button>
                <Button
                  variant="ghost"
                  aria-label={`匯出「${d.name}」為 PNG`}
                  onClick={() => exportItemPng(d.id, d.name)}
                >
                  匯出 PNG
                </Button>
                <Button
                  variant="ghost"
                  aria-label={`刪除「${d.name}」`}
                  onClick={() => {
                    if (window.confirm(`刪除「${d.name}」?`)) remove(d.id);
                  }}
                >
                  刪除
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
