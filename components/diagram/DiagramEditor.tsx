"use client";

import { useMemo, useRef, useState } from "react";
import { Fretboard } from "@/components/fretboard/Fretboard";
import { downloadSvgAsPng } from "@/lib/export/svgToPng";
import { scaleMarkers } from "@/lib/theory/scaleProjection";
import { pitchClassAt, STANDARD_TUNING } from "@/lib/theory/fretboard";
import { ROOT_OPTIONS } from "@/lib/theory/notes";
import { useDiagrams, type SavedDiagram } from "@/lib/store/diagrams";
import type { Marker, NoteRole } from "@/lib/theory/types";

const TO_FRET = 15;

// Role palette: zh-TW label → the NoteRole stored on the marker. Colors mirror
// Fretboard.tsx's ROLE_FILL so the swatch matches what's drawn on the board.
const ROLES: { id: NoteRole; label: string; color: string }[] = [
  { id: "root", label: "根音", color: "#e11d48" },
  { id: "scale", label: "音階音", color: "#1f2937" },
  { id: "reference", label: "參考音", color: "#9ca3af" },
  { id: "custom", label: "自訂", color: "#2563eb" },
];

// Scales offered by the "從音階載入" convenience seed (a subset is plenty here;
// the full list lives in the dedicated scale tool).
const SEED_SCALES: { id: string; label: string }[] = [
  { id: "major", label: "大調 Major" },
  { id: "minor", label: "自然小調 Natural minor" },
  { id: "major pentatonic", label: "大調五聲 Major pent." },
  { id: "minor pentatonic", label: "小調五聲 Minor pent." },
];

export interface DiagramEditorProps {
  /** When editing a saved diagram, its data seeds the editor. */
  initial?: SavedDiagram;
  /** Called after a successful 儲存 (save/update), e.g. to return to the list. */
  onSaved?: (diagram: SavedDiagram) => void;
}

export function DiagramEditor({ initial, onSaved }: DiagramEditorProps) {
  const tuning = useMemo(
    () => (initial ? initial.tuning : [...STANDARD_TUNING]),
    [initial],
  );

  const addDiagram = useDiagrams((s) => s.add);
  const updateDiagram = useDiagrams((s) => s.update);

  const [markers, setMarkers] = useState<Marker[]>(initial?.markers ?? []);
  const [activeRole, setActiveRole] = useState<NoteRole>("root");
  const [label, setLabel] = useState("");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [seedRoot, setSeedRoot] = useState("C");
  const [seedScale, setSeedScale] = useState("major");
  const [busy, setBusy] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  // When the caller swaps which saved diagram we're editing, reset the form to
  // the new diagram. "Adjust state during render on key change" (react.dev), the
  // same pattern FretboardExplorer uses — avoids a setState-in-effect cascade.
  const [prevId, setPrevId] = useState(initial?.id);
  if (initial?.id !== prevId) {
    setPrevId(initial?.id);
    setMarkers(initial?.markers ?? []);
    setTitle(initial?.title ?? "");
    setName(initial?.name ?? "");
    setLabel("");
  }

  // Click an empty cell → add a marker with the active role + current label;
  // click an existing marker (same string+fret) → remove it.
  function handleCellClick(string: number, fret: number) {
    setMarkers((prev) => {
      const idx = prev.findIndex(
        (m) => m.string === string && m.fret === fret,
      );
      if (idx !== -1) {
        return prev.filter((_, i) => i !== idx);
      }
      const trimmed = label.trim();
      const marker: Marker = {
        string,
        fret,
        pitchClass: pitchClassAt(tuning[string], fret),
        role: activeRole,
        isRoot: activeRole === "root",
        ...(trimmed ? { label: trimmed } : {}),
      };
      return [...prev, marker];
    });
  }

  function seedFromScale() {
    setMarkers(
      scaleMarkers(seedRoot, seedScale, { tuning, toFret: TO_FRET }),
    );
  }

  function clear() {
    setMarkers([]);
  }

  async function exportPng() {
    const svg = boardRef.current?.querySelector("svg");
    if (!svg) return;
    setBusy(true);
    try {
      await downloadSvgAsPng(svg, `${(name || title || "diagram").trim()}.png`);
    } finally {
      setBusy(false);
    }
  }

  function save() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      // Name is the library's primary identifier; require it before saving.
      window.alert("請先輸入圖表名稱再儲存。");
      return;
    }
    const trimmedTitle = title.trim();
    if (initial) {
      updateDiagram(initial.id, {
        name: trimmedName,
        title: trimmedTitle || undefined,
        tuning,
        toFret: TO_FRET,
        markers,
      });
      onSaved?.({ ...initial, name: trimmedName, title: trimmedTitle, markers });
      return;
    }
    const now = Date.now();
    const diagram: SavedDiagram = {
      id: crypto.randomUUID(),
      name: trimmedName,
      title: trimmedTitle || undefined,
      createdAt: now,
      updatedAt: now,
      tuning,
      toFret: TO_FRET,
      markers,
    };
    addDiagram(diagram);
    onSaved?.(diagram);
  }

  const pill =
    "rounded-md px-3 py-1.5 text-sm border transition-colors cursor-pointer";

  return (
    <div className="space-y-5 diagram-editor">
      {/* controls — hidden when printing */}
      <div className="no-print space-y-4">
        <div className="flex flex-wrap items-end gap-6">
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-gray-500">角色 Role(點空格新增,點圓點移除)</span>
            <div className="flex gap-1">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setActiveRole(r.id)}
                  className={`${pill} flex items-center gap-1.5 ${
                    activeRole === r.id
                      ? "border-rose-600 bg-rose-600 text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: r.color }}
                  />
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-500">標籤文字 Label(可留空)</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="例如 1、3、R"
              className="rounded-md border border-gray-300 px-3 py-1.5 w-40"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-end gap-6">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-500">圖表標題 Title(印在圖上方)</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如 C 大調第一把位"
              className="rounded-md border border-gray-300 px-3 py-1.5 w-72"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-500">名稱 Name(儲存到圖庫用)</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如 小明-作業1"
              className="rounded-md border border-gray-300 px-3 py-1.5 w-56"
            />
          </label>
        </div>

        {/* 從音階載入 convenience seed */}
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-500">從音階載入 Root</span>
            <select
              value={seedRoot}
              onChange={(e) => setSeedRoot(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5"
            >
              {ROOT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-500">Scale</span>
            <select
              value={seedScale}
              onChange={(e) => setSeedScale(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 min-w-48"
            >
              {SEED_SCALES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={seedFromScale}
            className={`${pill} border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}
          >
            從音階載入
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={clear}
            className={`${pill} border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}
          >
            清空
          </button>
          <button
            onClick={exportPng}
            disabled={busy}
            className={`${pill} border-gray-800 bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50`}
          >
            {busy ? "匯出中…" : "匯出 PNG"}
          </button>
          <button
            onClick={() => window.print()}
            className={`${pill} border-gray-800 bg-gray-900 text-white hover:bg-gray-700`}
          >
            列印
          </button>
          <button
            onClick={save}
            className={`${pill} border-rose-600 bg-rose-600 text-white hover:bg-rose-700`}
          >
            {initial ? "更新" : "儲存"}
          </button>
        </div>
      </div>

      {/* print region: only the title + board reaches the printed page */}
      <div className="print-area rounded-lg border border-gray-200 bg-white p-4">
        {title.trim() && (
          <h2 className="mb-3 text-center text-lg font-semibold text-gray-900">
            {title.trim()}
          </h2>
        )}
        <div ref={boardRef} className="overflow-x-auto">
          <Fretboard
            markers={markers}
            tuning={tuning}
            toFret={TO_FRET}
            labelMode="name"
            onCellClick={handleCellClick}
          />
        </div>
      </div>
    </div>
  );
}
