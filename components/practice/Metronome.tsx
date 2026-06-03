"use client";

import { useEffect, useRef, useState } from "react";
import {
  MetronomeEngine,
  SUBDIVISIONS,
  ACCENT_MODES,
  BEATS_PER_BAR_OPTIONS,
  BPM_MIN,
  BPM_MAX,
  clampBpm,
  type Subdivision,
  type AccentMode,
  type MetronomeConfig,
} from "@/lib/audio/metronome";
import { Button } from "@/components/ui/Button";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { FieldGroup } from "@/components/ui/Field";

// The visual beat indicator and all config live in React state. The audio
// engine (Tone.js) is created lazily on the first 開始 click — never at module
// scope and never during render — so this stays SSR-/static-export-safe.

export function Metronome() {
  const [bpm, setBpm] = useState(90);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [subdivision, setSubdivision] = useState<Subdivision>("4n");
  const [accentMode, setAccentMode] = useState<AccentMode>("downbeat");

  // Tempo ramp (加速練習)
  const [rampEnabled, setRampEnabled] = useState(false);
  const [rampStep, setRampStep] = useState(5);
  const [rampEveryBars, setRampEveryBars] = useState(4);
  const [rampMax, setRampMax] = useState(160);

  const [running, setRunning] = useState(false);
  // -1 = no beat lit (stopped). The audio engine drives this via getDraw, so the
  // indicator stays in sync with the click rather than React's render timing.
  const [currentBeat, setCurrentBeat] = useState(-1);

  const engineRef = useRef<MetronomeEngine | null>(null);

  function buildConfig(): MetronomeConfig {
    return {
      bpm: clampBpm(bpm),
      beatsPerBar,
      subdivision,
      accentMode,
      ramp: {
        enabled: rampEnabled,
        step: rampStep,
        everyBars: rampEveryBars,
        max: rampMax,
      },
    };
  }

  // Push live config changes to a running engine (tempo/accent update without a
  // restart; meter/subdivision change requires a restart to re-schedule).
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !engine.isRunning) return;
    const meterChanged = engine.setConfig(buildConfig());
    if (meterChanged) {
      // Restart to apply the new subdivision/meter scheduling cleanly.
      void (async () => {
        await engine.stop();
        await engine.start();
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpm, beatsPerBar, subdivision, accentMode, rampEnabled, rampStep, rampEveryBars, rampMax]);

  // Teardown on unmount: dispose the engine so the AudioContext nodes are freed.
  useEffect(() => {
    return () => {
      void engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  async function handleStart() {
    // CRITICAL: engine.start() awaits Tone.start() inside this user-gesture
    // handler before the transport runs — the #1 "no sound" fix.
    if (!engineRef.current) {
      engineRef.current = new MetronomeEngine(buildConfig(), (beat) => {
        setCurrentBeat(beat);
      });
    } else {
      engineRef.current.setConfig(buildConfig());
    }
    await engineRef.current.start();
    setRunning(true);
  }

  async function handleStop() {
    await engineRef.current?.stop();
    setRunning(false);
    setCurrentBeat(-1);
  }

  async function toggle() {
    if (running) await handleStop();
    else await handleStart();
  }

  return (
    <section className="space-y-5 rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">節拍器</h2>
        <Button
          variant={running ? "secondary" : "primary"}
          onClick={toggle}
          className="min-w-20"
        >
          {running ? "停止" : "開始"}
        </Button>
      </div>

      {/* Visual beat indicator */}
      <div className="flex flex-wrap gap-2" aria-label="拍點指示">
        {Array.from({ length: beatsPerBar }).map((_, i) => {
          const lit = running && currentBeat === i;
          const isDownbeat = i === 0;
          return (
            <span
              key={i}
              className={`inline-block h-5 w-5 rounded-full border transition-colors ${
                lit
                  ? isDownbeat
                    ? "border-rose-600 bg-rose-600"
                    : "border-blue-600 bg-blue-600"
                  : "border-gray-300 bg-gray-100"
              }`}
            />
          );
        })}
      </div>

      {/* BPM: slider + number */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="w-16 text-sm text-gray-500">速度 BPM</span>
          <input
            type="range"
            min={BPM_MIN}
            max={BPM_MAX}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="flex-1 accent-rose-600"
          />
          <input
            type="number"
            min={BPM_MIN}
            max={BPM_MAX}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            onBlur={(e) => setBpm(clampBpm(Number(e.target.value)))}
            className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
        </div>
      </div>

      {/* Beats per bar */}
      <FieldGroup label="每小節拍數">
        <div className="flex gap-1">
          {BEATS_PER_BAR_OPTIONS.map((n) => (
            <ToggleButton
              key={n}
              active={beatsPerBar === n}
              onClick={() => setBeatsPerBar(n)}
            >
              {n}
            </ToggleButton>
          ))}
        </div>
      </FieldGroup>

      {/* Subdivision */}
      <FieldGroup label="細分音符">
        <div className="flex flex-wrap gap-1">
          {SUBDIVISIONS.map((s) => (
            <ToggleButton
              key={s.id}
              active={subdivision === s.id}
              onClick={() => setSubdivision(s.id)}
            >
              {s.label}
            </ToggleButton>
          ))}
        </div>
      </FieldGroup>

      {/* Accent mode */}
      <FieldGroup label="重音">
        <div className="flex flex-wrap gap-1">
          {ACCENT_MODES.map((m) => (
            <ToggleButton
              key={m.id}
              active={accentMode === m.id}
              onClick={() => setAccentMode(m.id)}
            >
              {m.label}
            </ToggleButton>
          ))}
        </div>
      </FieldGroup>

      {/* Tempo ramp (加速練習) */}
      <div className="space-y-2 rounded-md border border-gray-200 p-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={rampEnabled}
            onChange={(e) => setRampEnabled(e.target.checked)}
            className="accent-rose-600"
          />
          加速練習
        </label>
        <div
          className={`flex flex-wrap items-end gap-4 text-sm ${
            rampEnabled ? "" : "pointer-events-none opacity-40"
          }`}
        >
          <label className="flex flex-col gap-1">
            <span className="text-gray-500">每 N 小節</span>
            <input
              type="number"
              min={1}
              value={rampEveryBars}
              onChange={(e) =>
                setRampEveryBars(Math.max(1, Number(e.target.value)))
              }
              className="w-20 rounded-md border border-gray-300 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-gray-500">加速 (BPM)</span>
            <input
              type="number"
              min={1}
              value={rampStep}
              onChange={(e) => setRampStep(Math.max(1, Number(e.target.value)))}
              className="w-20 rounded-md border border-gray-300 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-gray-500">最高 (BPM)</span>
            <input
              type="number"
              min={BPM_MIN}
              max={BPM_MAX}
              value={rampMax}
              onChange={(e) => setRampMax(clampBpm(Number(e.target.value)))}
              className="w-20 rounded-md border border-gray-300 px-2 py-1"
            />
          </label>
        </div>
      </div>
    </section>
  );
}
