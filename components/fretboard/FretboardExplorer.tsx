"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Fretboard } from "./Fretboard";
import { scaleMarkers } from "@/lib/theory/scaleProjection";
import { scalePositions } from "@/lib/theory/positions";
import { downloadSvgAsPng } from "@/lib/export/svgToPng";
import { ROOT_OPTIONS } from "@/lib/theory/notes";
import { useSettings, type LabelMode } from "@/lib/store/settings";
import { Button } from "@/components/ui/Button";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { Field, FieldGroup, Select } from "@/components/ui/Field";
import { ScrollableBoard } from "@/components/ui/ScrollableBoard";
import {
  useInitialParams,
  pickAllowed,
} from "@/lib/url/useInitialParams";

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

  // Deep-link seeding (client only, after mount — no hydration mismatch). A
  // lesson/curriculum link like /fretboard?root=Eb&scale=major pre-selects the
  // subject. Params are validated against the real option ids; invalid/missing
  // params are ignored so the current/persisted state stands. Runs after the
  // rehydrate effect above, so a deep-link wins over the persisted root/scale.
  const params = useInitialParams();
  useEffect(() => {
    if (!params) return;
    const root = pickAllowed(params, "root", ROOT_OPTIONS);
    if (root) setRoot(root);
    const scale = pickAllowed(
      params,
      "scale",
      SCALES.map((s) => s.id),
    );
    if (scale) setScale(scale);
  }, [params, setRoot, setScale]);

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

        <Field label="音階 Scale">
          <Select
            value={scaleName}
            onChange={(e) => setScale(e.target.value)}
            className="min-w-56"
          >
            {SCALES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="把位 Position">
          <Select
            value={posIndex}
            onChange={(e) => setPosIndex(Number(e.target.value))}
            disabled={positions.length === 0}
            className="disabled:opacity-50"
          >
            <option value={-1}>全部</option>
            {positions.map((p) => (
              <option key={p.index} value={p.index}>
                {p.label}(第 {p.from}-{p.to} 格)
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

        <Button variant="secondary" onClick={exportPng} disabled={busy}>
          {busy ? "匯出中…" : "匯出 PNG"}
        </Button>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-rose-600" /> 根音
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-gray-800" /> 音階音
        </span>
      </div>

      <ScrollableBoard ref={boardRef}>
        <Fretboard
          markers={markers}
          labelMode={labels}
          toFret={15}
          positionHighlight={active ? { from: active.from, to: active.to } : null}
          ariaLabel={`${root} ${
            SCALES.find((s) => s.id === scaleName)?.label ?? scaleName
          } 指板圖${active ? `,第 ${active.from}-${active.to} 格` : ""}`}
        />
      </ScrollableBoard>
    </div>
  );
}
