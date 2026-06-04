import type { Marker, NoteRole } from "@/lib/theory/types";
import { STANDARD_TUNING } from "@/lib/theory/fretboard";
import type { LabelMode } from "@/lib/store/settings";

const ROLE_FILL: Record<NoteRole, string> = {
  root: "#e11d48", // red
  scale: "#1f2937", // near-black
  reference: "#9ca3af", // gray
  custom: "#2563eb", // blue
  shared: "#9333ea", // purple (e.g. the shared tritone in the tritone-sub view)
};

const INLAY_SINGLE = [3, 5, 7, 9, 15, 17, 19, 21];
const INLAY_DOUBLE = [12, 24];

export interface FretboardProps {
  markers: Marker[];
  tuning?: readonly string[];
  toFret?: number;
  labelMode?: LabelMode;
  positionHighlight?: { from: number; to: number } | null;
  /**
   * Optional click handler enabling edit mode. When provided, a transparent
   * click target is drawn over every (string, fret) cell — including empty and
   * open-string (fret 0) cells — so callers can add/remove markers anywhere.
   * Omitted by default, so existing read-only usages are unaffected.
   */
  onCellClick?: (string: number, fret: number) => void;
  /**
   * Accessible name for the SVG (role=img). Defaults to a generic zh-TW label; a
   * caller can pass a descriptive one (e.g. "C 大調音階指板圖") so screen-reader
   * users learn the diagram's actual content, which is otherwise purely visual.
   */
  ariaLabel?: string;
}

// Dumb SVG renderer. Receives a marker list; never computes theory.
// String index 0 is the top row (high E); fret 0 markers sit left of the nut.
export function Fretboard({
  markers,
  tuning = STANDARD_TUNING,
  toFret = 15,
  labelMode = "name",
  positionHighlight = null,
  onCellClick,
  ariaLabel = "吉他指板圖",
}: FretboardProps) {
  const strings = tuning.length;
  const padL = 56;
  const padR = 24;
  const padT = 24;
  const padB = 30;
  const stringGap = 34;
  const fretW = 56;

  const nutX = padL;
  const boardH = (strings - 1) * stringGap;
  const width = nutX + toFret * fretW + padR;
  const height = padT + boardH + padB;

  const xFretLine = (n: number) => nutX + n * fretW;
  const xFretCenter = (n: number) => nutX + (n - 0.5) * fretW;
  const xOpen = nutX - 28;
  const yString = (i: number) => padT + i * stringGap;
  const midY = padT + boardH / 2;

  const fretNumbers = [0, 3, 5, 7, 9, 12, 15, 17, 19, 21, 24].filter(
    (n) => n <= toFret,
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{
        maxWidth: width,
        height: "auto",
        display: "block",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",
      }}
      role="img"
      aria-label={ariaLabel}
    >
      <rect x={0} y={0} width={width} height={height} fill="#ffffff" />

      {/* position highlight (把位) */}
      {positionHighlight && (
        <rect
          x={xFretLine(positionHighlight.from - 1)}
          y={padT - 12}
          width={(positionHighlight.to - positionHighlight.from + 1) * fretW}
          height={boardH + 24}
          fill="#22d3ee"
          opacity={0.25}
        />
      )}

      {/* inlay dots */}
      {INLAY_SINGLE.filter((n) => n <= toFret).map((n) => (
        <circle key={`i${n}`} cx={xFretCenter(n)} cy={midY} r={5} fill="#e5e7eb" />
      ))}
      {INLAY_DOUBLE.filter((n) => n <= toFret).map((n) => (
        <g key={`d${n}`}>
          <circle cx={xFretCenter(n)} cy={padT + stringGap * 1.5} r={5} fill="#e5e7eb" />
          <circle cx={xFretCenter(n)} cy={padT + stringGap * 3.5} r={5} fill="#e5e7eb" />
        </g>
      ))}

      {/* strings (low E thickest) */}
      {tuning.map((_, i) => (
        <line
          key={`s${i}`}
          x1={xOpen - 10}
          y1={yString(i)}
          x2={xFretLine(toFret)}
          y2={yString(i)}
          stroke="#6b7280"
          strokeWidth={1 + i * 0.4}
        />
      ))}

      {/* nut + frets */}
      <line x1={nutX} y1={yString(0)} x2={nutX} y2={yString(strings - 1)} stroke="#111827" strokeWidth={5} />
      {Array.from({ length: toFret }, (_, k) => k + 1).map((n) => (
        <line
          key={`f${n}`}
          x1={xFretLine(n)}
          y1={yString(0)}
          x2={xFretLine(n)}
          y2={yString(strings - 1)}
          stroke="#9ca3af"
          strokeWidth={1.5}
        />
      ))}

      {/* fret numbers */}
      {fretNumbers.map((n) => (
        <text
          key={`n${n}`}
          x={n === 0 ? xOpen : xFretCenter(n)}
          y={height - 10}
          textAnchor="middle"
          fontSize={11}
          fill="#9ca3af"
        >
          {n}
        </text>
      ))}

      {/* markers */}
      {markers
        .filter((m) => m.fret <= toFret)
        .map((m, idx) => {
          const cx = m.fret === 0 ? xOpen : xFretCenter(m.fret);
          const cy = yString(m.string);
          // A freeform label (e.g. a finger number set in the diagram editor)
          // overrides the labelMode spelling, per Marker.label's contract.
          const text =
            m.label ??
            (labelMode === "name"
              ? m.pitchClass
              : labelMode === "degree"
                ? (m.degree ?? "")
                : "");
          return (
            <g key={`m${idx}`}>
              <circle cx={cx} cy={cy} r={13} fill={ROLE_FILL[m.role]} stroke="#ffffff" strokeWidth={1.5} />
              {text && (
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={11}
                  fontWeight={600}
                  fill="#ffffff"
                >
                  {text}
                </text>
              )}
            </g>
          );
        })}

      {/* edit-mode click targets: transparent cells over EVERY (string, fret),
          including empty and open-string (fret 0) cells. Drawn last so they sit
          above markers — clicking an existing marker removes it. Only rendered
          when onCellClick is supplied, so read-only usages are untouched. */}
      {onCellClick &&
        tuning.map((_, stringIdx) =>
          Array.from({ length: toFret + 1 }, (_, fret) => {
            const cellX =
              fret === 0 ? xOpen - stringGap / 2 : xFretLine(fret - 1);
            const cellW = fret === 0 ? stringGap : fretW;
            return (
              <rect
                key={`c${stringIdx}-${fret}`}
                x={cellX}
                y={yString(stringIdx) - stringGap / 2}
                width={cellW}
                height={stringGap}
                fill="transparent"
                style={{ cursor: "pointer" }}
                onClick={() => onCellClick(stringIdx, fret)}
              />
            );
          }),
        )}
    </svg>
  );
}
