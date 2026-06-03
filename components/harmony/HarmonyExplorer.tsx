"use client";

import { useMemo, useRef, useState } from "react";
import { Fretboard } from "@/components/fretboard/Fretboard";
import { ROOT_OPTIONS } from "@/lib/theory/notes";
import { downloadSvgAsPng } from "@/lib/export/svgToPng";
import type { LabelMode } from "@/lib/store/settings";
import type { Marker } from "@/lib/theory/types";
import {
  secondaryDominants,
  borrowedChords,
  tritoneSub,
  inversions,
  drop2Voicings,
  chordShapeMarkers,
  inversionMarkers,
  drop2Markers,
  DROP2_STRING_SETS,
} from "@/lib/theory/harmony";

// The 5 advanced-harmony concepts, in curriculum order.
type Concept = "secondary" | "borrowed" | "tritone" | "inversion" | "drop2";
const CONCEPTS: { id: Concept; label: string }[] = [
  { id: "secondary", label: "次屬和弦" },
  { id: "borrowed", label: "大小調互換" },
  { id: "tritone", label: "三全音代理" },
  { id: "inversion", label: "轉位和弦" },
  { id: "drop2", label: "Drop 2" },
];

// Major keys reuse the curated enharmonic root set (clean scale spellings).
const KEY_OPTIONS = ROOT_OPTIONS;

// Dominant-7th symbols for the tritone-sub picker (every root, dom7 only).
const DOM7_OPTIONS = ROOT_OPTIONS.map((r) => `${r}7`);

// Chord qualities offered for the inversion picker (triads → 3 inversions,
// 7th chords → 4). Kept small and all verified to resolve in tonal.
const INVERSION_QUALITIES: { id: string; label: string }[] = [
  { id: "", label: "大三和弦 Major" },
  { id: "m", label: "小三和弦 Minor" },
  { id: "maj7", label: "大七 Maj7" },
  { id: "7", label: "屬七 Dom7" },
  { id: "m7", label: "小七 m7" },
];

// Seventh-chord qualities for Drop 2 (needs exactly 4 tones).
const DROP2_QUALITIES: { id: string; label: string }[] = [
  { id: "maj7", label: "大七 Maj7" },
  { id: "7", label: "屬七 Dom7" },
  { id: "m7", label: "小七 m7" },
  { id: "m7b5", label: "半減七 m7b5" },
  { id: "dim7", label: "減七 dim7" },
];

const LABELS: { id: LabelMode; label: string }[] = [
  { id: "name", label: "音名" },
  { id: "degree", label: "級數" },
];

const pill =
  "rounded-md px-3 py-1.5 text-sm border transition-colors cursor-pointer";
const selectCls = "rounded-md border border-gray-300 px-3 py-1.5";
const activePill = "border-rose-600 bg-rose-600 text-white";
const idlePill = "border-gray-300 bg-white text-gray-700 hover:bg-gray-50";

function Legend({ entries }: { entries: { color: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
      {entries.map((e) => (
        <span key={e.label} className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: e.color }}
          />
          {e.label}
        </span>
      ))}
    </div>
  );
}

export function HarmonyExplorer() {
  const [concept, setConcept] = useState<Concept>("secondary");
  const [labels, setLabels] = useState<LabelMode>("degree");
  const [busy, setBusy] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  // Per-concept controls (each concept keeps its own independent selection).
  const [key, setKey] = useState("C"); // secondary + borrowed
  const [secTarget, setSecTarget] = useState("V"); // chosen secondary-dom target
  const [borrowLabel, setBorrowLabel] = useState("iv");
  const [tritoneChord, setTritoneChord] = useState("G7");
  const [invRoot, setInvRoot] = useState("C");
  const [invQuality, setInvQuality] = useState("");
  const [invIdx, setInvIdx] = useState(0);
  const [drop2Root, setDrop2Root] = useState("C");
  const [drop2Quality, setDrop2Quality] = useState("maj7");
  const [drop2Set, setDrop2Set] = useState(DROP2_STRING_SETS[0].id);
  const [drop2Inv, setDrop2Inv] = useState(0);

  // ---- derived theory data (pure functions, memoized) ----
  const secList = useMemo(() => secondaryDominants(key), [key]);
  const sec = useMemo(
    () => secList.find((s) => s.target === secTarget) ?? secList[0],
    [secList, secTarget],
  );

  const borrowList = useMemo(() => borrowedChords(key), [key]);
  const borrow = useMemo(
    () => borrowList.find((b) => b.label === borrowLabel) ?? borrowList[0],
    [borrowList, borrowLabel],
  );

  const tritone = useMemo(() => tritoneSub(tritoneChord), [tritoneChord]);

  const invList = useMemo(
    () => inversions(`${invRoot}${invQuality}`),
    [invRoot, invQuality],
  );
  const inv = useMemo(
    () => invList[Math.min(invIdx, invList.length - 1)] ?? invList[0],
    [invList, invIdx],
  );

  const drop2List = useMemo(
    () => drop2Voicings(`${drop2Root}${drop2Quality}`, drop2Set),
    [drop2Root, drop2Quality, drop2Set],
  );
  const drop2 = useMemo(
    () => drop2List[Math.min(drop2Inv, drop2List.length - 1)] ?? drop2List[0],
    [drop2List, drop2Inv],
  );

  // ---- markers + explanation + legend per concept ----
  const { markers, explanation, legend, exportName } = useMemo<{
    markers: Marker[];
    explanation: React.ReactNode;
    legend: { color: string; label: string }[];
    exportName: string;
  }>(() => {
    switch (concept) {
      case "secondary": {
        if (!sec)
          return { markers: [], explanation: null, legend: [], exportName: "harmony" };
        return {
          markers: chordShapeMarkers(sec.chord),
          legend: [
            { color: "#e11d48", label: "根音" },
            { color: "#1f2937", label: "和弦音" },
          ],
          exportName: `${sec.chord.symbol}-secondary-dominant`,
          explanation: (
            <>
              <p>
                <span className="font-semibold">{sec.chord.symbol}</span> ={" "}
                <span className="font-semibold">{sec.label}</span>(在 {key} 大調)
                ,解決到 {sec.target} 級({sec.targetChord})。
              </p>
              <p className="mt-1 text-gray-500">
                次屬和弦是「某順階和弦的屬七」:把目標和弦暫時當成主和弦,在它上方完全五度疊一個屬七。
                {sec.chord.symbol} 的大三度({sec.chord.notes[1]})是導向{" "}
                {sec.target} 的臨時導音。
              </p>
            </>
          ),
        };
      }
      case "borrowed": {
        if (!borrow)
          return { markers: [], explanation: null, legend: [], exportName: "harmony" };
        return {
          markers: chordShapeMarkers(borrow.chord),
          legend: [
            { color: "#e11d48", label: "根音" },
            { color: "#1f2937", label: "和弦音" },
          ],
          exportName: `${borrow.chord.symbol}-borrowed`,
          explanation: (
            <>
              <p>
                <span className="font-semibold">{borrow.label}</span> ={" "}
                <span className="font-semibold">{borrow.chord.symbol}</span>
                ,借自 {key} 的平行小調({key} minor)。
              </p>
              <p className="mt-1 text-gray-500">
                大小調互換:從同主音小調借來的和弦,為大調增添小調色彩。和弦音{" "}
                {borrow.chord.notes.join("、")}。
              </p>
            </>
          ),
        };
      }
      case "tritone": {
        if (!tritone)
          return {
            markers: [],
            explanation: (
              <p className="text-gray-500">請選擇一個屬七和弦。</p>
            ),
            legend: [],
            exportName: "harmony",
          };
        // Original chord dark, sub chord blue; both projected on the neck.
        const origMarkers = chordShapeMarkers(tritone.original, {
          nonRootRole: "scale",
        });
        const subMarkers = chordShapeMarkers(tritone.sub, {
          nonRootRole: "custom",
        });
        return {
          markers: [...origMarkers, ...subMarkers],
          legend: [
            { color: "#e11d48", label: `根音` },
            { color: "#1f2937", label: `${tritone.original.symbol}(原)` },
            { color: "#2563eb", label: `${tritone.sub.symbol}(代理)` },
          ],
          exportName: `${tritone.original.symbol}-tritone-sub`,
          explanation: (
            <>
              <p>
                <span className="font-semibold">{tritone.original.symbol}</span>{" "}
                的三全音代理是{" "}
                <span className="font-semibold">{tritone.sub.symbol}</span>
                (根音相距三全音)。
              </p>
              <p className="mt-1 text-gray-500">
                兩個屬七共用同一組三全音{" "}
                <span className="font-semibold">
                  {tritone.sharedTritoneNotes.join(" / ")}
                </span>
                (彼此的 3 音與 b7 音互換),所以可以互相代理。
                紅=共同根音層級、深=原和弦、藍=代理和弦。
              </p>
            </>
          ),
        };
      }
      case "inversion": {
        if (!inv)
          return { markers: [], explanation: null, legend: [], exportName: "harmony" };
        return {
          markers: inversionMarkers(inv),
          legend: [
            { color: "#e11d48", label: "根音" },
            { color: "#1f2937", label: "和弦音" },
            { color: "#9ca3af", label: "低音(bass)" },
          ],
          exportName: `${inv.symbol.replace("/", "-over-")}-inversion`,
          explanation: (
            <>
              <p>
                <span className="font-semibold">{inv.symbol}</span> ={" "}
                <span className="font-semibold">{inv.label}</span>,最低音(bass)
                為 <span className="font-semibold">{inv.bass}</span>(第{" "}
                {inv.bassDegree} 音)。
              </p>
              <p className="mt-1 text-gray-500">
                轉位:和弦音不變({inv.notes.join("、")}),改變最低音。
                指板無法強制哪個音最低,因此以灰點 + (低音) 標出該擔任 bass
                的音;實際彈奏時把它放在最低聲部。
              </p>
            </>
          ),
        };
      }
      case "drop2": {
        if (!drop2)
          return {
            markers: [],
            explanation: (
              <p className="text-gray-500">請選擇一個七和弦。</p>
            ),
            legend: [],
            exportName: "harmony",
          };
        return {
          markers: drop2Markers(drop2),
          legend: [
            { color: "#e11d48", label: "根音" },
            { color: "#1f2937", label: "和弦音" },
            { color: "#9ca3af", label: "低音(bass)" },
          ],
          exportName: `${drop2Root}${drop2Quality}-drop2-${drop2.label}`,
          explanation: (
            <>
              <p>
                <span className="font-semibold">
                  {drop2Root}
                  {drop2Quality}
                </span>{" "}
                Drop 2 · {drop2.label},最低音{" "}
                <span className="font-semibold">{drop2.bass}</span>(第{" "}
                {drop2.bassDegree} 音)。
              </p>
              <p className="mt-1 text-gray-500">
                Drop 2:把密集排列(1-3-5-7)四音和弦中「從上數第二個音」降八度,
                使四個音落在相鄰四條弦上,適合在指板上彈奏。此處顯示在{" "}
                {DROP2_STRING_SETS.find((s) => s.id === drop2Set)?.label}。
              </p>
            </>
          ),
        };
      }
    }
  }, [
    concept,
    key,
    sec,
    borrow,
    tritone,
    inv,
    drop2,
    drop2Root,
    drop2Quality,
    drop2Set,
  ]);

  async function exportPng() {
    const svg = boardRef.current?.querySelector("svg");
    if (!svg) return;
    setBusy(true);
    try {
      await downloadSvgAsPng(svg, `${exportName}.png`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* concept selector */}
      <div className="flex flex-wrap gap-1">
        {CONCEPTS.map((c) => (
          <button
            key={c.id}
            onClick={() => setConcept(c.id)}
            className={`${pill} ${concept === c.id ? activePill : idlePill}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* per-concept controls */}
      <div className="flex flex-wrap items-end gap-6">
        {(concept === "secondary" || concept === "borrowed") && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-500">調 Key (大調)</span>
            <select
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className={selectCls}
            >
              {KEY_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
        )}

        {concept === "secondary" && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-500">目標和弦 Target</span>
            <select
              value={secTarget}
              onChange={(e) => setSecTarget(e.target.value)}
              className={`${selectCls} min-w-56`}
            >
              {secList.map((s) => (
                <option key={s.target} value={s.target}>
                  {s.label} → {s.target}({s.targetChord}) = {s.chord.symbol}
                </option>
              ))}
            </select>
          </label>
        )}

        {concept === "borrowed" && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-500">借用和弦 Borrowed</span>
            <select
              value={borrowLabel}
              onChange={(e) => setBorrowLabel(e.target.value)}
              className={`${selectCls} min-w-56`}
            >
              {borrowList.map((b) => (
                <option key={b.label} value={b.label}>
                  {b.label} = {b.chord.symbol}
                </option>
              ))}
            </select>
          </label>
        )}

        {concept === "tritone" && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-500">屬七和弦 Dominant 7th</span>
            <select
              value={tritoneChord}
              onChange={(e) => setTritoneChord(e.target.value)}
              className={selectCls}
            >
              {DOM7_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        )}

        {concept === "inversion" && (
          <>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-500">根音 Root</span>
              <select
                value={invRoot}
                onChange={(e) => setInvRoot(e.target.value)}
                className={selectCls}
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
                value={invQuality}
                onChange={(e) => {
                  setInvQuality(e.target.value);
                  setInvIdx(0);
                }}
                className={`${selectCls} min-w-56`}
              >
                {INVERSION_QUALITIES.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-gray-500">轉位 Inversion</span>
              <div className="flex flex-wrap gap-1">
                {invList.map((iv, i) => (
                  <button
                    key={iv.symbol}
                    onClick={() => setInvIdx(i)}
                    className={`${pill} ${invIdx === i ? activePill : idlePill}`}
                  >
                    {iv.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {concept === "drop2" && (
          <>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-500">根音 Root</span>
              <select
                value={drop2Root}
                onChange={(e) => setDrop2Root(e.target.value)}
                className={selectCls}
              >
                {ROOT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-500">七和弦 7th chord</span>
              <select
                value={drop2Quality}
                onChange={(e) => setDrop2Quality(e.target.value)}
                className={`${selectCls} min-w-48`}
              >
                {DROP2_QUALITIES.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-500">弦組 String set</span>
              <select
                value={drop2Set}
                onChange={(e) => setDrop2Set(e.target.value)}
                className={`${selectCls} min-w-44`}
              >
                {DROP2_STRING_SETS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-gray-500">轉位 Inversion</span>
              <div className="flex flex-wrap gap-1">
                {drop2List.map((d, i) => (
                  <button
                    key={d.inversion}
                    onClick={() => setDrop2Inv(i)}
                    className={`${pill} ${drop2Inv === i ? activePill : idlePill}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* label toggle + export (shared) */}
        <div className="flex flex-col gap-1 text-sm">
          <span className="text-gray-500">標籤 Label</span>
          <div className="flex gap-1">
            {LABELS.map((l) => (
              <button
                key={l.id}
                onClick={() => setLabels(l.id)}
                className={`${pill} ${labels === l.id ? activePill : idlePill}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={exportPng}
          disabled={busy || markers.length === 0}
          className={`${pill} border-gray-800 bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50`}
        >
          {busy ? "匯出中…" : "匯出 PNG"}
        </button>
      </div>

      {legend.length > 0 && <Legend entries={legend} />}

      <div
        ref={boardRef}
        className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-4"
      >
        <Fretboard markers={markers} labelMode={labels} toFret={15} />
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed">
        {explanation}
      </div>
    </div>
  );
}
