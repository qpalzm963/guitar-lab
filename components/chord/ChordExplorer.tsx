"use client";

import { useMemo, useRef, useState } from "react";
import { Fretboard } from "@/components/fretboard/Fretboard";
import { ChordDiagram } from "./ChordDiagram";
import { chordMarkers, CHORD_TYPES } from "@/lib/theory/chords";
import { findChordShape } from "@/data/chordShapes";
import { downloadSvgsAsPng } from "@/lib/export/svgToPng";
import { ROOT_OPTIONS } from "@/lib/theory/notes";
import type { LabelMode } from "@/lib/store/settings";
import { Button } from "@/components/ui/Button";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { Field, FieldGroup, Select } from "@/components/ui/Field";
import { ScrollableBoard } from "@/components/ui/ScrollableBoard";
import { useInitialParams, pickAllowed } from "@/lib/url/useInitialParams";

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

  // Deep-link seeding (client only, after mount). e.g. /chords?root=C&type=maj7.
  // Validated against ROOT_OPTIONS / CHORD_TYPES ids ("" = major triad is a
  // valid id); invalid/missing params are ignored. Applied via the repo's
  // "adjust state during render when an input changes" pattern (see the posKey
  // pattern in FretboardExplorer) rather than a setState-in-effect: params is
  // null until hydration, so this fires once when it first becomes non-null.
  const params = useInitialParams();
  const [seededFrom, setSeededFrom] = useState<Record<string, string> | null>(
    null,
  );
  if (params && params !== seededFrom) {
    setSeededFrom(params);
    const r = pickAllowed(params, "root", ROOT_OPTIONS);
    if (r) setRoot(r);
    const t = pickAllowed(
      params,
      "type",
      CHORD_TYPES.map((c) => c.id),
    );
    if (t !== undefined) setType(t);
  }

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

        <Field label="和弦 Chord">
          <Select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="min-w-56"
          >
            {CHORD_TYPES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
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
          <span className="inline-block h-3 w-3 rounded-full bg-gray-800" /> 和弦音
        </span>
      </div>

      <ScrollableBoard ref={boardRef} className="space-y-4">
        <Fretboard markers={markers} labelMode={labels} toFret={15} />
        {shape ? (
          <div>
            <p className="mb-2 text-xs text-gray-500">常用按法 Common fingering</p>
            <ChordDiagram shape={shape} />
          </div>
        ) : null}
      </ScrollableBoard>
    </div>
  );
}
