import type { ChordShape } from "@/data/chordShapes";

// Dumb SVG chord-box. Renders one curated fingering from data/chordShapes.ts.
// Orientation matches Fretboard.tsx: strings are horizontal rows with
// string index 0 (high E) on the top row; frets run left→right. Muted/open
// strings get x / o left of the nut. Never computes theory.
//
// Colors mirror Fretboard.tsx: nut #111827, frets #9ca3af, strings #6b7280,
// fretted dots use the same red as the root marker (#e11d48).

export interface ChordDiagramProps {
  shape: ChordShape;
  /** Number of fret columns to draw. Default 5 (standard open-chord box). */
  fretCount?: number;
}

export function ChordDiagram({ shape, fretCount = 5 }: ChordDiagramProps) {
  const strings = shape.frets.length; // 6
  const padL = 28; // room for x/o markers left of the nut
  const padR = 16;
  const padT = 18; // room for chord name
  const padB = 14;
  const stringGap = 22;
  const fretW = 28;

  const nutX = padL;
  const boardH = (strings - 1) * stringGap;
  const width = nutX + fretCount * fretW + padR;
  const height = padT + boardH + padB;

  const yString = (i: number) => padT + i * stringGap;
  const xFretLine = (n: number) => nutX + n * fretW;
  const xFretCenter = (n: number) => nutX + (n - 0.5) * fretW;
  const xMarker = nutX - 14; // x/o column

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      style={{
        height: "auto",
        display: "block",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",
      }}
      role="img"
      aria-label={`${shape.name} chord diagram`}
    >
      <rect x={0} y={0} width={width} height={height} fill="#ffffff" />

      {/* chord name */}
      <text
        x={nutX + (fretCount * fretW) / 2}
        y={12}
        textAnchor="middle"
        fontSize={13}
        fontWeight={700}
        fill="#111827"
      >
        {shape.name}
      </text>

      {/* strings (high E top, low E thickest at bottom) */}
      {shape.frets.map((_, i) => (
        <line
          key={`s${i}`}
          x1={nutX}
          y1={yString(i)}
          x2={xFretLine(fretCount)}
          y2={yString(i)}
          stroke="#6b7280"
          strokeWidth={1 + i * 0.3}
        />
      ))}

      {/* nut + frets */}
      <line
        x1={nutX}
        y1={yString(0)}
        x2={nutX}
        y2={yString(strings - 1)}
        stroke="#111827"
        strokeWidth={5}
      />
      {Array.from({ length: fretCount }, (_, k) => k + 1).map((n) => (
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

      {/* x / o markers and fretted dots */}
      {shape.frets.map((fret, i) => {
        const cy = yString(i);
        if (fret < 0) {
          return (
            <text
              key={`x${i}`}
              x={xMarker}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={12}
              fontWeight={600}
              fill="#6b7280"
            >
              ×
            </text>
          );
        }
        if (fret === 0) {
          return (
            <circle
              key={`o${i}`}
              cx={xMarker}
              cy={cy}
              r={5}
              fill="none"
              stroke="#6b7280"
              strokeWidth={1.5}
            />
          );
        }
        const finger = shape.fingers?.[i];
        return (
          <g key={`d${i}`}>
            <circle
              cx={xFretCenter(fret)}
              cy={cy}
              r={8}
              fill="#e11d48"
              stroke="#ffffff"
              strokeWidth={1.5}
            />
            {finger ? (
              <text
                x={xFretCenter(fret)}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={10}
                fontWeight={600}
                fill="#ffffff"
              >
                {finger}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
