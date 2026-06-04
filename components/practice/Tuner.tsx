"use client";

import { useEffect, useRef, useState } from "react";
import {
  frequencyToReading,
  IN_TUNE_CENTS,
  type PitchReading,
  type TunerMode,
} from "@/lib/theory/pitchMath";
import type { TunerEngine, TunerStatus } from "@/lib/audio/tuner";
import { Button } from "@/components/ui/Button";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { FieldGroup } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";

// Microphone guitar tuner. The TunerEngine (raw Web Audio) is imported and
// constructed lazily on the first 開始調音 click — inside the user gesture, where
// getUserMedia() may prompt and the AudioContext can resume. Nothing here touches
// a browser API during render/SSR (isSupported runs only in a mount effect), so
// this stays static-export-safe.

// How long to keep showing the last note after the signal drops, so brief gaps
// between plucks (or finger lifts) don't blank the readout mid-tune.
const NOTE_HOLD_MS = 500;
// EMA weight for the new sample. Lower = smoother/laggier needle. ~0.25 lets the
// needle glide toward the true pitch over a few frames instead of jittering.
const EMA_ALPHA = 0.25;

// What the indicator actually renders — a smoothed snapshot, distinct from the
// raw per-frame reading so the needle glides and the note can linger.
interface Display {
  noteName: string;
  stringIndex?: number;
  cents: number;
  frequency: number;
  inTune: boolean;
}

export function Tuner() {
  const [status, setStatus] = useState<TunerStatus>("idle");
  const [mode, setMode] = useState<TunerMode>("guitar");
  const [display, setDisplay] = useState<Display | null>(null);

  const engineRef = useRef<TunerEngine | null>(null);
  // The frequency callback is created once with the engine, but mode can change
  // live; read it through a ref so a 模式 switch re-maps without rebuilding.
  const modeRef = useRef<TunerMode>(mode);
  // Smoothing/decay state lives in refs (mutated every audio frame, not render).
  const emaCentsRef = useRef<number | null>(null);
  const emaFreqRef = useRef<number | null>(null);
  const lastReadingRef = useRef<PitchReading | null>(null);
  const lastHitAtRef = useRef<number>(0);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Feature-detect ONLY here (never during render/SSR — isSupported touches
  // navigator + AudioContext). Done lazily so the import resolves client-side.
  useEffect(() => {
    let active = true;
    void import("@/lib/audio/tuner").then(({ TunerEngine }) => {
      if (active && !TunerEngine.isSupported()) setStatus("unsupported");
    });
    return () => {
      active = false;
    };
  }, []);

  // Unmount teardown — CRITICAL: releases the mic (stops stream tracks, clears
  // the browser recording indicator) even if the user navigates away while live.
  useEffect(() => {
    return () => {
      void engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  // Called from the engine's rAF loop (~60fps) with the latest detected pitch.
  // EMA-smooths the needle and holds the last note for NOTE_HOLD_MS so short
  // silences between plucks don't flash the readout to "—".
  function handleFrequency(hz: number | null) {
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();

    if (hz != null) {
      const reading = frequencyToReading(hz, modeRef.current);
      lastReadingRef.current = reading;
      lastHitAtRef.current = now;
      emaCentsRef.current =
        emaCentsRef.current == null
          ? reading.cents
          : emaCentsRef.current + EMA_ALPHA * (reading.cents - emaCentsRef.current);
      emaFreqRef.current =
        emaFreqRef.current == null
          ? reading.frequency
          : emaFreqRef.current +
            EMA_ALPHA * (reading.frequency - emaFreqRef.current);
      const cents = emaCentsRef.current;
      setDisplay({
        noteName: reading.noteName,
        stringIndex: reading.stringIndex,
        cents,
        frequency: emaFreqRef.current,
        // Recompute in-tune from the SMOOTHED cents so the 準 badge matches the
        // needle the user sees, not the noisier raw frame.
        inTune: Math.abs(cents) <= IN_TUNE_CENTS,
      });
      return;
    }

    // Silent/unpitched frame. Keep the last note (frozen needle) briefly, then
    // decay to the placeholder once the gap exceeds the hold window.
    const last = lastReadingRef.current;
    if (last && now - lastHitAtRef.current < NOTE_HOLD_MS) return;
    lastReadingRef.current = null;
    emaCentsRef.current = null;
    emaFreqRef.current = null;
    setDisplay(null);
  }

  function resetSmoothing() {
    emaCentsRef.current = null;
    emaFreqRef.current = null;
    lastReadingRef.current = null;
    lastHitAtRef.current = 0;
    setDisplay(null);
  }

  async function start() {
    setStatus("requesting");
    try {
      const { TunerEngine } = await import("@/lib/audio/tuner");
      const engine = new TunerEngine(handleFrequency);
      engineRef.current = engine;
      await engine.start();
      setStatus("listening");
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      setStatus(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "error");
      resetSmoothing();
    }
  }

  async function stop() {
    try {
      await engineRef.current?.stop();
    } catch {
      // Stopping never needs to surface — the mic is going quiet regardless.
    }
    engineRef.current = null;
    setStatus("idle");
    resetSmoothing();
  }

  const listening = status === "listening";

  async function toggle() {
    if (listening) await stop();
    else await start();
  }

  // Needle position: clamp cents to ±50 → 0..100% across the track.
  const clamped =
    display == null ? 0 : Math.max(-50, Math.min(50, display.cents));
  const signedCents =
    display == null
      ? "—"
      : `${display.cents > 0 ? "+" : ""}${Math.round(display.cents)}`;

  return (
    <section className="space-y-5 rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">調音器</h2>
        <Button
          variant={listening ? "secondary" : "primary"}
          onClick={toggle}
          aria-pressed={listening}
          disabled={status === "unsupported" || status === "requesting"}
          className="min-w-24"
        >
          {listening ? "停止" : "開始調音"}
        </Button>
      </div>

      {/* Per-status helper / error text (zh-TW). */}
      {status === "idle" && (
        <p className="text-sm text-gray-500">點擊開始並允許麥克風權限。</p>
      )}
      {status === "requesting" && (
        <p className="text-sm text-gray-500">請在瀏覽器允許使用麥克風…</p>
      )}
      {status === "denied" && (
        <p className="text-sm text-rose-600" role="alert">
          麥克風權限被拒,請在瀏覽器網站設定開啟後再試一次。
        </p>
      )}
      {status === "error" && (
        <p className="text-sm text-rose-600" role="alert">
          無法存取麥克風,請確認裝置麥克風後重試。
        </p>
      )}
      {status === "unsupported" && (
        <p className="text-sm text-rose-600" role="alert">
          此瀏覽器不支援麥克風存取。
        </p>
      )}
      {listening && display == null && (
        <p className="text-sm text-gray-500">請撥一根弦…</p>
      )}

      {/* Mode: 吉他 (snap to open strings) / 半音階 (nearest semitone). */}
      <FieldGroup label="模式">
        <div className="flex gap-1">
          <ToggleButton
            active={mode === "guitar"}
            onClick={() => setMode("guitar")}
          >
            吉他
          </ToggleButton>
          <ToggleButton
            active={mode === "chromatic"}
            onClick={() => setMode("chromatic")}
          >
            半音階
          </ToggleButton>
        </div>
      </FieldGroup>

      {/* Tuning indicator. */}
      <div className="space-y-3">
        {/* Note readout — announced to screen readers via the live region. */}
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-1"
        >
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-semibold tabular-nums">
              {display ? display.noteName : "—"}
            </span>
            {display &&
              (display.inTune ? (
                <Badge tone="success">準 ✓</Badge>
              ) : (
                // Non-color cue (not red/green alone) for colorblind users: a
                // word + arrow for the deviation. Flat = below pitch → tune up.
                <span className="text-sm font-medium text-rose-600">
                  {display.cents < 0 ? "偏低 ↑" : "偏高 ↓"}
                </span>
              ))}
          </div>
          {mode === "guitar" && display?.stringIndex != null && (
            <span className="text-sm text-gray-500">
              第{display.stringIndex + 1}弦
            </span>
          )}
        </div>

        {/* Cents bar: center tick + a marker that slides with the deviation. */}
        <div>
          <div className="relative h-3 rounded-full bg-gray-100">
            {/* Center (in-tune) tick. */}
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gray-300" />
            {display && (
              <div
                className={`absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[left] duration-75 ${
                  display.inTune ? "bg-emerald-500" : "bg-rose-600"
                }`}
                style={{ left: `${50 + clamped}%` }}
              />
            )}
          </div>
          <div className="mt-1 flex justify-between text-xs text-gray-400">
            <span>♭ 低</span>
            <span>高 ♯</span>
          </div>
        </div>

        {/* Live numeric detail. */}
        <p className="text-center font-mono text-sm tabular-nums text-gray-500">
          {display
            ? `${display.frequency.toFixed(1)} Hz · ${signedCents} ¢`
            : "— Hz · — ¢"}
        </p>
      </div>
    </section>
  );
}
