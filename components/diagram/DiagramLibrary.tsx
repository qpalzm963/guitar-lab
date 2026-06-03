"use client";

import { useEffect, useRef, useState } from "react";
import { Fretboard } from "@/components/fretboard/Fretboard";
import { DiagramEditor } from "./DiagramEditor";
import { downloadSvgAsPng } from "@/lib/export/svgToPng";
import { useDiagrams, type SavedDiagram } from "@/lib/store/diagrams";

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
    void downloadSvgAsPng(svg, `${fallbackName}.png`);
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

  const pill =
    "rounded-md px-3 py-1.5 text-sm border transition-colors cursor-pointer";

  if (view.mode === "edit") {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setView({ mode: "list" })}
          className={`${pill} no-print border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}
        >
          ← 返回圖庫
        </button>
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
        <button
          onClick={() => setView({ mode: "edit" })}
          className={`${pill} border-rose-600 bg-rose-600 text-white hover:bg-rose-700`}
        >
          + 新增圖表
        </button>
        <button
          onClick={backupJson}
          className={`${pill} border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}
        >
          匯出 JSON 備份
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className={`${pill} border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}
        >
          匯入 JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={onImportFile}
          className="hidden"
        />
        <button
          onClick={() => {
            if (window.confirm("確定要清空整個圖庫嗎?此動作無法復原。")) {
              clearAll();
            }
          }}
          className={`${pill} border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}
        >
          清空圖庫
        </button>
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
                <time className="text-xs text-gray-400">
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
                />
              </div>
              <div className="mt-1 flex flex-wrap gap-2">
                <button
                  onClick={() => setView({ mode: "edit", diagram: d })}
                  className={`${pill} border-gray-800 bg-gray-900 text-white hover:bg-gray-700`}
                >
                  開啟 / 編輯
                </button>
                <button
                  onClick={() => exportItemPng(d.id, d.name)}
                  className={`${pill} border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}
                >
                  匯出 PNG
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`刪除「${d.name}」?`)) remove(d.id);
                  }}
                  className={`${pill} border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}
                >
                  刪除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
