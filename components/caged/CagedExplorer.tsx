"use client";

import { useMemo, useRef, useState } from "react";
import { Fretboard } from "@/components/fretboard/Fretboard";
import { cagedShapes, type CagedQuality } from "@/lib/theory/caged";
import { downloadSvgAsPng } from "@/lib/export/svgToPng";
import { ROOT_OPTIONS } from "@/lib/theory/notes";
import type { LabelMode } from "@/lib/store/settings";
import { Button } from "@/components/ui/Button";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { Field, FieldGroup, Select } from "@/components/ui/Field";
import { ScrollableBoard } from "@/components/ui/ScrollableBoard";
import { useInitialParams, pickAllowed } from "@/lib/url/useInitialParams";

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
  // Default to 音名 (name) for consistency with the other explorers.
  const [labels, setLabels] = useState<LabelMode>("name");
  // Index into the 5 shapes (ascending up the neck), 0 = lowest.
  const [shapeIdx, setShapeIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  // Deep-link seeding (client only, after mount). e.g. /caged?root=C&quality=major.
  // Validated against ROOT_OPTIONS / QUALITIES ids; invalid/missing ignored.
  // Applied via the repo's "adjust state during render when an input changes"
  // pattern (mirrors prevShapeKey below), not a setState-in-effect: params is
  // null until hydration, so this fires once when it first becomes non-null.
  const params = useInitialParams();
  const [seededFrom, setSeededFrom] = useState<Record<string, string> | null>(
    null,
  );
  if (params && params !== seededFrom) {
    setSeededFrom(params);
    const r = pickAllowed(params, "root", ROOT_OPTIONS);
    if (r) setRoot(r);
    const q = pickAllowed(
      params,
      "quality",
      QUALITIES.map((x) => x.id),
    );
    if (q) setQuality(q as CagedQuality);
  }

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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-6">
        <Field label="根音 Root">
          <Select value={root} onChange={(e) => setRoot(e.target.value)}>
            {ROOT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="和弦 Quality">
          <Select
            value={quality}
            onChange={(e) => setQuality(e.target.value as CagedQuality)}
            className="min-w-44"
          >
            {QUALITIES.map((q) => (
              <option key={q.id} value={q.id}>
                {q.label}
              </option>
            ))}
          </Select>
        </Field>

        <FieldGroup label="標籤 Label">
          <div className="flex gap-1">
            {LABELS.map((l) => (
              <ToggleButton
                key={l.id}
                active={labels === l.id}
                onClick={() => setLabels(l.id)}
              >
                {l.label}
              </ToggleButton>
            ))}
          </div>
        </FieldGroup>

        <Button
          variant="secondary"
          onClick={exportPng}
          disabled={busy || !current}
        >
          {busy ? "匯出中…" : "匯出 PNG"}
        </Button>
      </div>

      {/* Shape stepper: C → A → G → E → D, ordered up the neck. */}
      <FieldGroup label="把位 Shape(沿指板由低到高)">
        <div className="flex flex-wrap gap-1">
          {shapes.map((s, i) => (
            <ToggleButton
              key={s.shape}
              active={i === shapeIdx}
              onClick={() => setShapeIdx(i)}
              className="font-mono"
            >
              {s.shape} 型
            </ToggleButton>
          ))}
        </div>
      </FieldGroup>

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

      <ScrollableBoard ref={boardRef}>
        <Fretboard
          markers={current?.markers ?? []}
          labelMode={labels}
          toFret={15}
          positionHighlight={
            current ? { from: current.from, to: current.to } : null
          }
          ariaLabel={`${root} CAGED ${current?.shape ?? ""}型指板圖${
            current ? `,第 ${current.from}-${current.to} 格` : ""
          }`}
        />
      </ScrollableBoard>
    </div>
  );
}
