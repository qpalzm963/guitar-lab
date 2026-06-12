import type { ReactElement } from "react";
import type { LessonFigureId } from "@/lib/course/lessonContent";
import { Fretboard } from "@/components/fretboard/Fretboard";
import { scaleMarkers } from "@/lib/theory/scaleProjection";

// Inline lesson figures (圖解). Pure presentational SVGs keyed by LessonFigureId:
// the content layer (lessonContent.ts) references a figure by id only, so it
// stays React-free, and this Record is typed over the full id union — adding an
// id without a renderer (or vice versa) fails to compile. Colors follow the
// app's existing fretboard palette (root red #e11d48, near-black #1f2937,
// grays) plus amber #f59e0b for "unstable" — the one semantic this palette
// didn't have yet. The small-map figure reuses the real Fretboard renderer and
// the theory layer (scaleMarkers), so the diagram can never drift from what
// /fretboard itself would show.

const CAPTION_CLS = "text-xs leading-relaxed text-gray-500";

// ── 小地圖:第 1–4 弦、第 5–8 格的 Am 五聲 ──────────────────────────────
function SmallMapFigure() {
  // Real theory data, same generator as /fretboard: Am pentatonic projected on
  // frets 5–8, kept only on strings 1–4 (marker string index 0–3 = 細弦那四條).
  const markers = scaleMarkers("A", "minor pentatonic", {
    fromFret: 5,
    toFret: 8,
  }).filter((m) => m.string <= 3);
  return (
    <figure className="space-y-1.5">
      <div className="overflow-x-auto rounded-md border border-gray-200">
        <Fretboard
          markers={markers}
          toFret={9}
          positionHighlight={{ from: 5, to: 8 }}
          ariaLabel="即興小地圖:第 1–4 弦、第 5–8 格的 A 小調五聲,共八個音,根音 A 以紅色標示"
        />
      </div>
      <figcaption className={CAPTION_CLS}>
        小地圖:水藍色框 = 第 5–8 格,只用第 1–4 弦,共 8
        個音。紅色是根音 A(第 4 弦第 7 格、第 1 弦第 5 格)——迷路就滑回它。
      </figcaption>
    </figure>
  );
}

// ── 節奏動機:同節奏、只換音 ────────────────────────────────────────────
function RhythmMotifFigure() {
  const x0 = 84; // beat ruler origin
  const bw = 112; // one beat
  // One bar of the motif: 長(1拍)、短短(半拍×2)、休(1拍)、長(1拍).
  const hits = [
    { beat: 0, len: 1 },
    { beat: 1, len: 0.5 },
    { beat: 1.5, len: 0.5 },
    { beat: 3, len: 1 },
  ];
  const rows = [
    { label: "第一句", y: 22, notes: ["A", "A", "C", "E"] },
    { label: "第二句", y: 74, notes: ["C", "C", "E", "A"] },
  ];
  return (
    <figure className="space-y-1.5">
      <svg
        viewBox="0 0 560 144"
        width="100%"
        style={{ maxWidth: 560, height: "auto", display: "block" }}
        role="img"
        aria-label="節奏動機圖解:兩個樂句的節奏完全相同,只更換音(A、C、E)"
      >
        {/* beat grid */}
        {[0, 1, 2, 3, 4].map((b) => (
          <line
            key={b}
            x1={x0 + b * bw}
            y1={14}
            x2={x0 + b * bw}
            y2={116}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        ))}
        {[0, 1, 2, 3].map((b) => (
          <text
            key={b}
            x={x0 + b * bw + bw / 2}
            y={132}
            textAnchor="middle"
            fontSize={11}
            fill="#9ca3af"
          >
            第 {b + 1} 拍
          </text>
        ))}
        {rows.map((row) => (
          <g key={row.label}>
            <text
              x={76}
              y={row.y + 22}
              textAnchor="end"
              fontSize={12}
              fill="#6b7280"
            >
              {row.label}
            </text>
            {hits.map((h, i) => (
              <g key={i}>
                <rect
                  x={x0 + h.beat * bw + 2}
                  y={row.y}
                  width={h.len * bw - 4}
                  height={34}
                  rx={6}
                  fill="#fff1f2"
                  stroke="#fda4af"
                />
                <text
                  x={x0 + h.beat * bw + (h.len * bw) / 2}
                  y={row.y + 22}
                  textAnchor="middle"
                  fontSize={13}
                  fontWeight={600}
                  fill="#be123c"
                >
                  {row.notes[i]}
                </text>
              </g>
            ))}
            {/* the rest on beat 3 */}
            <text
              x={x0 + 2.5 * bw}
              y={row.y + 22}
              textAnchor="middle"
              fontSize={11}
              fill="#d1d5db"
            >
              (休)
            </text>
          </g>
        ))}
      </svg>
      <figcaption className={CAPTION_CLS}>
        節奏動機:兩句的節奏完全一樣(長、短短、休、長),只把音換掉——同節奏、不同音,聽起來就是同一個句子在發展。
      </figcaption>
    </figure>
  );
}

// ── 呼叫與回應:2 小節彈、2 小節留白,問句停不安定音、答句落安定音 ──────
function CallResponseFigure() {
  const x0 = 20;
  const barW = 65; // 8 bars over 520px
  const segs = [
    { bar: 0, kind: "play", label: "問句(彈)", end: "G", endFill: "#f59e0b" },
    { bar: 2, kind: "rest", label: "留白(2 小節)" },
    { bar: 4, kind: "play", label: "答句(彈)", end: "A", endFill: "#e11d48" },
    { bar: 6, kind: "rest", label: "留白(2 小節)" },
  ] as const;
  return (
    <figure className="space-y-1.5">
      <svg
        viewBox="0 0 560 178"
        width="100%"
        style={{ maxWidth: 560, height: "auto", display: "block" }}
        role="img"
        aria-label="呼叫與回應圖解:兩小節彈、兩小節留白;問句句尾停不安定音 G,答句句尾落安定音 A"
      >
        {/* bar ticks + numbers */}
        {Array.from({ length: 9 }, (_, i) => (
          <line
            key={i}
            x1={x0 + i * barW}
            y1={30}
            x2={x0 + i * barW}
            y2={88}
            stroke="#f3f4f6"
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <text
            key={i}
            x={x0 + i * barW + barW / 2}
            y={102}
            textAnchor="middle"
            fontSize={10}
            fill="#9ca3af"
          >
            {i + 1}
          </text>
        ))}
        {segs.map((s) => {
          const x = x0 + s.bar * barW + 2;
          const w = barW * 2 - 4;
          return (
            <g key={s.bar}>
              {s.kind === "play" ? (
                <rect
                  x={x}
                  y={36}
                  width={w}
                  height={44}
                  rx={8}
                  fill="#fff1f2"
                  stroke="#fda4af"
                />
              ) : (
                <rect
                  x={x}
                  y={36}
                  width={w}
                  height={44}
                  rx={8}
                  fill="#ffffff"
                  stroke="#d1d5db"
                  strokeDasharray="5 4"
                />
              )}
              <text
                x={s.kind === "play" ? x + w / 2 - 10 : x + w / 2}
                y={58}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={12}
                fill={s.kind === "play" ? "#be123c" : "#9ca3af"}
              >
                {s.label}
              </text>
              {s.kind === "play" && (
                <g>
                  <circle cx={x + w - 16} cy={58} r={10} fill={s.endFill} />
                  <text
                    x={x + w - 16}
                    y={58}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={10}
                    fontWeight={600}
                    fill="#ffffff"
                  >
                    {s.end}
                  </text>
                </g>
              )}
            </g>
          );
        })}
        {/* legend */}
        <circle cx={28} cy={130} r={7} fill="#f59e0b" />
        <text x={42} y={134} fontSize={11} fill="#4b5563">
          不安定音 D、G:句尾停這裡像問句,留下懸念
        </text>
        <circle cx={28} cy={154} r={7} fill="#e11d48" />
        <text x={42} y={158} fontSize={11} fill="#4b5563">
          安定音 A、C、E:句尾落這裡像答句,回到家
        </text>
      </svg>
      <figcaption className={CAPTION_CLS}>
        呼叫與回應的骨架:彈兩小節、空兩小節。圓點是句尾的目標音——問句停不安定音(例:G),答句落回安定音(例:A)。
      </figcaption>
    </figure>
  );
}

// ── 每日 30 分鐘配置 ───────────────────────────────────────────────────
function Daily30Figure() {
  const x0 = 20;
  const perMin = 520 / 30;
  const segs = [
    { min: 5, label: "暖手", fill: "#94a3b8" },
    { min: 10, label: "一句變三句", fill: "#e11d48" },
    { min: 5, label: "小地圖根音", fill: "#0891b2" },
    { min: 10, label: "應用+錄音", fill: "#059669" },
  ];
  let acc = 0;
  const placed = segs.map((s) => {
    const x = x0 + acc * perMin;
    acc += s.min;
    return { ...s, x, w: s.min * perMin };
  });
  return (
    <figure className="space-y-1.5">
      <svg
        viewBox="0 0 560 100"
        width="100%"
        style={{ maxWidth: 560, height: "auto", display: "block" }}
        role="img"
        aria-label="每日 30 分鐘練習配置:暖手 5 分、一句變三句 10 分、小地圖根音 5 分、應用與錄音 10 分"
      >
        <defs>
          <clipPath id="daily30-round">
            <rect x={x0} y={24} width={520} height={36} rx={8} />
          </clipPath>
        </defs>
        <g clipPath="url(#daily30-round)">
          {placed.map((s) => (
            <rect
              key={s.label}
              x={s.x}
              y={24}
              width={s.w}
              height={36}
              fill={s.fill}
            />
          ))}
        </g>
        {placed.map((s) => (
          <g key={s.label}>
            <text
              x={s.x + s.w / 2}
              y={42}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={12}
              fontWeight={600}
              fill="#ffffff"
            >
              {s.min} 分
            </text>
            <text
              x={s.x + s.w / 2}
              y={78}
              textAnchor="middle"
              fontSize={11}
              fill="#4b5563"
            >
              {s.label}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className={CAPTION_CLS}>
        每日 30 分鐘:暖手 5 分 → 詞彙(一句變三句)10 分 → 地圖(不看圖回根音)5
        分 → 應用 + 錄 30 秒自評 10 分。
      </figcaption>
    </figure>
  );
}

// Typed over the full LessonFigureId union: a missing (or extra) entry is a
// compile error, which is the whole integrity story between content and figures.
const FIGURES: Record<LessonFigureId, () => ReactElement> = {
  "improv-small-map": SmallMapFigure,
  "improv-rhythm-motif": RhythmMotifFigure,
  "improv-call-response": CallResponseFigure,
  "improv-daily-30": Daily30Figure,
};

export function LessonFigure({ id }: { id: LessonFigureId }) {
  const Figure = FIGURES[id];
  return <Figure />;
}
