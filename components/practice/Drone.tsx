"use client";

import { useEffect, useRef, useState } from "react";
import { ROOT_OPTIONS } from "@/lib/theory/notes";
import { DroneEngine, DRONE_OCTAVES, DEFAULT_DRONE_OCTAVE } from "@/lib/audio/drone";

// A sustained reference tone for ear/intonation practice. Same rules as the
// metronome: the Tone.js engine is created lazily on the first 開始 click (inside
// the user gesture, where Tone.start() is awaited) and disposed on unmount.

const pill =
  "rounded-md px-3 py-1.5 text-sm border transition-colors cursor-pointer";

// tonal/Tone read sharps; map the flat roots offered by ROOT_OPTIONS to the
// sharp spelling the synth expects for pitch (display still uses the flat name).
const FLAT_TO_SHARP: Record<string, string> = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
};

export function Drone() {
  const [root, setRoot] = useState("A");
  const [octave, setOctave] = useState<number>(DEFAULT_DRONE_OCTAVE);
  const [playing, setPlaying] = useState(false);
  const engineRef = useRef<DroneEngine | null>(null);

  function pitch(): string {
    const name = FLAT_TO_SHARP[root] ?? root;
    return `${name}${octave}`;
  }

  // Re-pitch live if the note/octave changes while sounding.
  useEffect(() => {
    const engine = engineRef.current;
    if (engine?.isPlaying) void engine.start(pitch());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root, octave]);

  useEffect(() => {
    return () => {
      void engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  async function toggle() {
    if (playing) {
      await engineRef.current?.stop();
      setPlaying(false);
      return;
    }
    if (!engineRef.current) engineRef.current = new DroneEngine();
    await engineRef.current.start(pitch());
    setPlaying(true);
  }

  return (
    <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">持續音 (Drone)</h2>
        <button
          onClick={toggle}
          className={`${pill} min-w-20 ${
            playing
              ? "border-gray-800 bg-gray-900 text-white hover:bg-gray-700"
              : "border-rose-600 bg-rose-600 text-white"
          }`}
        >
          {playing ? "停止" : "開始"}
        </button>
      </div>
      <p className="text-sm text-gray-500">
        播放一個持續的根音,用來練習音準與音感。
      </p>

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
          <span className="text-gray-500">八度 Octave</span>
          <select
            value={octave}
            onChange={(e) => setOctave(Number(e.target.value))}
            className="rounded-md border border-gray-300 px-3 py-1.5"
          >
            {DRONE_OCTAVES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
