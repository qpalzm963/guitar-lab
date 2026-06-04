"use client";

import { useEffect, useRef, useState } from "react";
import { ROOT_OPTIONS } from "@/lib/theory/notes";
import { DroneEngine, DRONE_OCTAVES, DEFAULT_DRONE_OCTAVE } from "@/lib/audio/drone";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Field";

// A sustained reference tone for ear/intonation practice. Same rules as the
// metronome: the Tone.js engine is created lazily on the first 開始 click (inside
// the user gesture, where Tone.start() is awaited) and disposed on unmount.

// tonal/Tone read sharps; map the flat roots offered by ROOT_OPTIONS to the
// sharp spelling the synth expects for pitch (display still uses the flat name).
const FLAT_TO_SHARP: Record<string, string> = {
  Db: "C#",
  Eb: "D#",
  Ab: "G#",
  Bb: "A#",
  // (No Gb: ROOT_OPTIONS uses F# directly, so a Gb key never reaches here.)
};

export function Drone() {
  const [root, setRoot] = useState("A");
  const [octave, setOctave] = useState<number>(DEFAULT_DRONE_OCTAVE);
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const engineRef = useRef<DroneEngine | null>(null);

  function pitch(): string {
    const name = FLAT_TO_SHARP[root] ?? root;
    return `${name}${octave}`;
  }

  // Re-pitch live if the note/octave changes while sounding.
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine?.isPlaying) return;
    void engine.start(pitch()).catch(() => {
      setPlaying(false);
      setAudioError("無法切換音高,請重新開始。");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root, octave]);

  useEffect(() => {
    return () => {
      void engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  async function toggle() {
    try {
      if (playing) {
        await engineRef.current?.stop();
        setPlaying(false);
        return;
      }
      if (!engineRef.current) engineRef.current = new DroneEngine();
      await engineRef.current.start(pitch());
      setPlaying(true);
      setAudioError(null);
    } catch {
      setPlaying(false);
      setAudioError("無法啟動音訊,請先點擊頁面再試一次。");
    }
  }

  return (
    <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">持續音 (Drone)</h2>
        <Button
          variant={playing ? "secondary" : "primary"}
          onClick={toggle}
          aria-pressed={playing}
          className="min-w-20"
        >
          {playing ? "停止" : "開始"}
        </Button>
      </div>
      {audioError && (
        <p className="text-sm text-rose-600" role="alert">
          {audioError}
        </p>
      )}
      <p className="text-sm text-gray-500">
        播放一個持續的根音,用來練習音準與音感。
      </p>

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

        <Field label="八度 Octave">
          <Select
            value={octave}
            onChange={(e) => setOctave(Number(e.target.value))}
          >
            {DRONE_OCTAVES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </section>
  );
}
