import type { Marker, NoteRole } from "@/lib/theory/types";
import { STANDARD_TUNING } from "@/lib/theory/fretboard";
import type { LabelMode } from "@/lib/store/settings";

const ROLE_FILL: Record<NoteRole, string> = {
  root: "#e11d48", // red
  scale: "#1f2937", // near-black
  reference: "#9ca3af", // gray
  custom: "#2563eb", // blue
};

const INLAY_SINGLE = [3, 5, 7, 9, 15, 17, 19, 21];
const INLAY_DOUBLE = [12, 24];

export interface FretboardProps {
  markers: Marker[];
  tuning?: readonly string[];
  toFret?: number;
  labelMode?: LabelMode;
  positionHighlight?: { from: number; to: number } | null;
}

// Dumb SVG renderer. Receives a marker list; never computes theory.
// String index 0 is the top row (high E); fret 0 markers sit left of the nut.
export function Fretboard({
  markers,
  tuning = STANDARD_TUNING,
  toFret = 15,
  labelMode = "name",
  positionHighlight = null,
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
      aria-label="guitar fretboard diagram"
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
          const text =
            labelMode === "name"
              ? m.pitchClass
              : labelMode === "degree"
                ? (m.degree ?? "")
                : "";
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
    </svg>
  );
}
