"use client";

import { useMemo, useState } from "react";
import { AlphaTabPlayer } from "@/components/licks/AlphaTabPlayer";
import {
  LICKS,
  SCALES,
  STYLES,
  filterLicks,
  type Lick,
  type ScaleId,
  type StyleId,
} from "@/lib/licks/data";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { FieldGroup } from "@/components/ui/Field";

// Two-axis browser: a 音階 (scale) selector AND a 曲風 (style) selector. Either can
// be "全部" (no filter on that axis); the intersection drives the list. Selecting
// a lick loads it into the AlphaTabPlayer. This scale×style index is the viewer's
// differentiator over a flat tab list.
export function LicksViewer() {
  const [scale, setScale] = useState<ScaleId | null>(null);
  const [style, setStyle] = useState<StyleId | null>(null);

  const matches = useMemo(() => filterLicks(scale, style), [scale, style]);

  // The chosen lick, by id, so it survives filter changes when still in range.
  const [selectedId, setSelectedId] = useState<string>(LICKS[0].id);
  const selected: Lick | undefined = useMemo(
    () => matches.find((l) => l.id === selectedId) ?? matches[0],
    [matches, selectedId],
  );

  return (
    <div className="space-y-5">
      {/* Axis 1: 音階 */}
      <FieldGroup label="音階 Scale">
        <div className="flex flex-wrap gap-1">
          <ToggleButton active={scale === null} onClick={() => setScale(null)}>
            全部
          </ToggleButton>
          {SCALES.map((s) => (
            <ToggleButton
              key={s.id}
              active={scale === s.id}
              onClick={() => setScale(s.id)}
            >
              {s.label}
            </ToggleButton>
          ))}
        </div>
      </FieldGroup>

      {/* Axis 2: 曲風 */}
      <FieldGroup label="曲風 Style">
        <div className="flex flex-wrap gap-1">
          <ToggleButton active={style === null} onClick={() => setStyle(null)}>
            全部
          </ToggleButton>
          {STYLES.map((s) => (
            <ToggleButton
              key={s.id}
              active={style === s.id}
              onClick={() => setStyle(s.id)}
            >
              {s.label}
            </ToggleButton>
          ))}
        </div>
      </FieldGroup>

      {/* Matching licks */}
      <FieldGroup label={`樂句 (${matches.length})`}>
        {matches.length === 0 ? (
          <p className="text-sm text-gray-500">此組合暫無樂句,試試其他篩選。</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {matches.map((l) => (
              <ToggleButton
                key={l.id}
                active={selected?.id === l.id}
                onClick={() => setSelectedId(l.id)}
              >
                {l.title}
              </ToggleButton>
            ))}
          </div>
        )}
      </FieldGroup>

      {/* Selected lick: meta + player */}
      {selected && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="text-lg font-semibold">{selected.title}</h2>
            <span className="text-sm text-gray-500">調性 {selected.key}</span>
            <span className="text-sm text-gray-500">速度 {selected.tempo} BPM</span>
            {selected.difficulty && (
              <span className="text-sm text-gray-500">
                難度 {selected.difficulty}
              </span>
            )}
          </div>

          {/* key on id: remount the player per lick so the synth state resets
              cleanly when switching (the player also handles in-place tex swaps,
              but a fresh instance is the simplest correct reset). */}
          <AlphaTabPlayer key={selected.id} alphaTex={selected.alphaTex} />
        </div>
      )}
    </div>
  );
}
