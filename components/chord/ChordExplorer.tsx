"use client";

import { useMemo, useRef, useState } from "react";
import { Fretboard } from "@/components/fretboard/Fretboard";
import { ChordDiagram } from "./ChordDiagram";
import { chordMarkers, CHORD_TYPES } from "@/lib/theory/chords";
import { findChordShape } from "@/data/chordShapes";
import { downloadSvgsAsPng } from "@/lib/export/svgToPng";
import { ROOT_OPTIONS } from "@/lib/theory/notes";
import type { LabelMode } from "@/lib/store/settings";

// Chord tool keeps name/級數 only; "無" is omitted because a chord box without
// labels conveys little. Local state (no persisted store) — settings.ts is the
// scale tool's store and must not be modified.
const LABELS: { id: LabelMode; label: string }[] = [
  { id: "name", label: "音名" },
  { id: "degree", label: "級數" },
];

export function ChordExplorer() {
  const [root, setRoot] = useState("C");
  const [type, setType] = useState("");
  const [labels, setLabels] = useState<LabelMode>("name");
  const [busy, setBusy] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const markers = useMemo(() => chordMarkers(root, type), [root, type]);
  const shape = useMemo(() => findChordShape(root, type), [root, type]);

  async function exportPng() {
    // DOM order: fretboard neck first (top), then the fingering box if shown —
    // matching the "neck on top" stack the export produces.
    const svgs = boardRef.current
      ? Array.from(boardRef.current.querySelectorAll("svg"))
      : [];
    if (svgs.length === 0) return;
    setBusy(true);
    try {
      await downloadSvgsAsPng(svgs, `${root}${type || "maj"}-chord.png`);
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
          <span className="text-gray-500">和弦 Chord</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 min-w-56"
          >
            {CHORD_TYPES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
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
          <span className="inline-block h-3 w-3 rounded-full bg-gray-800" /> 和弦音
        </span>
      </div>

      <div
        ref={boardRef}
        className="space-y-4 overflow-x-auto rounded-lg border border-gray-200 bg-white p-4"
      >
        <Fretboard markers={markers} labelMode={labels} toFret={15} />
        {shape ? (
          <div>
            <p className="mb-2 text-xs text-gray-500">常用按法 Common fingering</p>
            <ChordDiagram shape={shape} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
