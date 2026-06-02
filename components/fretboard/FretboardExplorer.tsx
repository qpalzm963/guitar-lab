"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Fretboard } from "./Fretboard";
import { scaleMarkers } from "@/lib/theory/scaleProjection";
import { scalePositions } from "@/lib/theory/positions";
import { downloadSvgAsPng } from "@/lib/export/svgToPng";
import { ROOT_OPTIONS } from "@/lib/theory/notes";
import { useSettings, type LabelMode } from "@/lib/store/settings";

const SCALES: { id: string; label: string }[] = [
  { id: "major", label: "大調 Major" },
  { id: "minor", label: "自然小調 Natural minor" },
  { id: "major pentatonic", label: "大調五聲 Major pent." },
  { id: "minor pentatonic", label: "小調五聲 Minor pent." },
  { id: "blues", label: "藍調 Blues" },
  { id: "harmonic minor", label: "和聲小調 Harmonic minor" },
  { id: "melodic minor", label: "旋律小調 Melodic minor" },
  { id: "dorian", label: "Dorian" },
  { id: "phrygian", label: "Phrygian" },
  { id: "lydian", label: "Lydian" },
  { id: "mixolydian", label: "Mixolydian" },
  { id: "locrian", label: "Locrian" },
];

const LABELS: { id: LabelMode; label: string }[] = [
  { id: "name", label: "音名" },
  { id: "degree", label: "級數" },
  { id: "none", label: "無" },
];

export function FretboardExplorer() {
  const root = useSettings((s) => s.root);
  const scaleName = useSettings((s) => s.scaleName);
  const labels = useSettings((s) => s.labels);
  const setRoot = useSettings((s) => s.setRoot);
  const setScale = useSettings((s) => s.setScale);
  const setLabels = useSettings((s) => s.setLabels);

  const [busy, setBusy] = useState(false);
  // -1 = 全部 (whole neck); otherwise an index into `positions`.
  const [posIndex, setPosIndex] = useState(-1);
  // Reset 把位 to 全部 when root/scale changes (the window set is different), via
  // the "adjust state during render on key change" pattern — avoids a cascading
  // setState-in-effect. See react.dev "you-might-not-need-an-effect".
  const posKey = `${root}|${scaleName}`;
  const [prevPosKey, setPrevPosKey] = useState(posKey);
  if (posKey !== prevPosKey) {
    setPrevPosKey(posKey);
    setPosIndex(-1);
  }
  const boardRef = useRef<HTMLDivElement>(null);

  // Store uses skipHydration; pull persisted settings on the client only.
  useEffect(() => {
    useSettings.persist.rehydrate();
  }, []);

  const allMarkers = useMemo(
    () => scaleMarkers(root, scaleName),
    [root, scaleName],
  );

  // Canonical position windows for this scale (empty for scales without a box
  // system, e.g. blues — the selector then only offers 全部).
  const positions = useMemo(
    () => scalePositions(root, scaleName),
    [root, scaleName],
  );

  const active = posIndex >= 0 ? positions[posIndex] : null;

  // When a position is selected, constrain the rendered markers to its window;
  // 全部 shows the whole neck.
  const markers = useMemo(() => {
    if (!active) return allMarkers;
    return allMarkers.filter(
      (m) => m.fret >= active.from && m.fret <= active.to,
    );
  }, [allMarkers, active]);

  async function exportPng() {
    const svg = boardRef.current?.querySelector("svg");
    if (!svg) return;
    setBusy(true);
    try {
      await downloadSvgAsPng(svg, `${root}-${scaleName.replace(/\s+/g, "-")}.png`);
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
          <span className="text-gray-500">音階 Scale</span>
          <select
            value={scaleName}
            onChange={(e) => setScale(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 min-w-56"
          >
            {SCALES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-500">把位 Position</span>
          <select
            value={posIndex}
            onChange={(e) => setPosIndex(Number(e.target.value))}
            disabled={positions.length === 0}
            className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-50"
          >
            <option value={-1}>全部</option>
            {positions.map((p) => (
              <option key={p.index} value={p.index}>
                {p.label}(第 {p.from}-{p.to} 格)
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
          disabled={busy}
          className={`${pill} border-gray-800 bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50`}
        >
          {busy ? "匯出中…" : "匯出 PNG"}
        </button>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-rose-600" /> 根音
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-gray-800" /> 音階音
        </span>
      </div>

      <div
        ref={boardRef}
        className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-4"
      >
        <Fretboard
          markers={markers}
          labelMode={labels}
          toFret={15}
          positionHighlight={active ? { from: active.from, to: active.to } : null}
        />
      </div>
    </div>
  );
}
