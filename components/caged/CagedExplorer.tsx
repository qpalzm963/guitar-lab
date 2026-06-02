"use client";

import { useMemo, useRef, useState } from "react";
import { Fretboard } from "@/components/fretboard/Fretboard";
import { cagedShapes, type CagedQuality } from "@/lib/theory/caged";
import { downloadSvgAsPng } from "@/lib/export/svgToPng";
import { ROOT_OPTIONS } from "@/lib/theory/notes";
import type { LabelMode } from "@/lib/store/settings";

// CAGED is a major/minor system; local state only (no persisted store — that's
// the scale tool's, and must not be modified). Mirrors ChordExplorer's controls.
const QUALITIES: { id: CagedQuality; label: string }[] = [
  { id: "major", label: "大三和弦 Major" },
  { id: "minor", label: "小三和弦 Minor" },
];

const LABELS: { id: LabelMode; label: string }[] = [
  { id: "name", label: "音名" },
  { id: "degree", label: "級數" },
];

export function CagedExplorer() {
  const [root, setRoot] = useState("C");
  const [quality, setQuality] = useState<CagedQuality>("major");
  const [labels, setLabels] = useState<LabelMode>("degree");
  // Index into the 5 shapes (ascending up the neck), 0 = lowest.
  const [shapeIdx, setShapeIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const shapes = useMemo(
    () => cagedShapes(root, quality),
    [root, quality],
  );

  // Root/quality changes rebuild the 5 shapes; reset to the lowest shape via the
  // "adjust state during render on key change" pattern (no setState-in-effect).
  const shapeKey = `${root}|${quality}`;
  const [prevShapeKey, setPrevShapeKey] = useState(shapeKey);
  if (shapeKey !== prevShapeKey) {
    setPrevShapeKey(shapeKey);
    setShapeIdx(0);
  }

  const current = shapes[shapeIdx];

  async function exportPng() {
    const svg = boardRef.current?.querySelector("svg");
    if (!svg || !current) return;
    setBusy(true);
    try {
      await downloadSvgAsPng(
        svg,
        `${root}${quality === "minor" ? "m" : ""}-CAGED-${current.shape}.png`,
      );
    } finally {
      setBusy(false);
    }
  }

  const pill =
    "rounded-md px-3 py-1.5 text-sm border transition-colors cursor-pointer";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-6">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-500">根音 Root</span>
          <select
            value={root}
            onChange={(e) => setRoot(e.target.value)}
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
          <span className="text-gray-500">和弦 Quality</span>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value as CagedQuality)}
            className="rounded-md border border-gray-300 px-3 py-1.5 min-w-44"
          >
            {QUALITIES.map((q) => (
              <option key={q.id} value={q.id}>
                {q.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1 text-sm">
          <span className="text-gray-500">標籤 Label</span>
          <div className="flex gap-1">
            {LABELS.map((l) => (
              <button
                key={l.id}
                onClick={() => setLabels(l.id)}
                className={`${pill} ${
                  labels === l.id
                    ? "border-rose-600 bg-rose-600 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={exportPng}
          disabled={busy || !current}
          className={`${pill} border-gray-800 bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50`}
        >
          {busy ? "匯出中…" : "匯出 PNG"}
        </button>
      </div>

      {/* Shape stepper: C → A → G → E → D, ordered up the neck. */}
      <div className="flex flex-col gap-1 text-sm">
        <span className="text-gray-500">把位 Shape(沿指板由低到高)</span>
        <div className="flex flex-wrap gap-1">
          {shapes.map((s, i) => (
            <button
              key={s.shape}
              onClick={() => setShapeIdx(i)}
              className={`${pill} font-mono ${
                i === shapeIdx
                  ? "border-rose-600 bg-rose-600 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {s.shape} 型
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-rose-600" /> 根音
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-gray-800" /> 和弦音
        </span>
        {current && (
          <span>
            目前:<b className="font-mono">{current.shape} 型</b> · 第 {current.from}-
            {current.to} 格
          </span>
        )}
      </div>

      <div
        ref={boardRef}
        className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-4"
      >
        <Fretboard
          markers={current?.markers ?? []}
          labelMode={labels}
          toFret={15}
          positionHighlight={
            current ? { from: current.from, to: current.to } : null
          }
        />
      </div>
    </div>
  );
}
