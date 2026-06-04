"use client";

import { useEffect, useRef, useState } from "react";
// Type-only import: erased at compile time (isolatedModules), so the 2.3 MB npm
// bundle never enters the Turbopack graph. The runtime is loaded separately from
// /public (see loadAlphaTab below) — same strategy proven by the P0 spike.
import type { AlphaTabApi } from "@coderline/alphatab";
import {
  ALPHATAB_FONT_DIR,
  ALPHATAB_MODULE,
  ALPHATAB_SOUNDFONT,
} from "@/lib/alphatab/assets";
import { Button } from "@/components/ui/Button";
import { ToggleButton } from "@/components/ui/ToggleButton";

// We deliberately do NOT `import('@coderline/alphatab')` for the runtime.
// alphaTab launches its Web Worker + Audio Worklet via
// `new Worker(new URL('./alphaTab.worker.mjs', import.meta.url))` from inside its
// own ESM bundle. If the bundle were processed by Turbopack, that import.meta.url
// would resolve into the bundler's chunk space and the sibling worker/worklet/
// soundfont lookups become fragile. Instead we load the vendored bundle as a
// plain static module so import.meta.url equals `/alphatab/alphaTab.mjs` and the
// siblings resolve with zero bundler involvement. The double ignore comment keeps
// both Webpack and Turbopack from touching the import. Asset URLs are
// basePath-prefixed (see lib/alphatab/assets) so they don't 404 on /guitar-lab.
type AlphaTabModule = typeof import("@coderline/alphatab");

function loadAlphaTab(): Promise<AlphaTabModule> {
  return import(
    /* webpackIgnore: true */ /* turbopackIgnore: true */ ALPHATAB_MODULE
  ) as Promise<AlphaTabModule>;
}

type Status = "loading" | "rendered" | "error";

// Tempo / speed presets. alphaTab's playbackSpeed is a multiplier on the score's
// own tempo, so the lick's authored tempo stays the reference and these scale it.
const SPEEDS = [0.25, 0.5, 0.75, 1] as const;

export interface AlphaTabPlayerProps {
  /** A valid alphaTex string. Changing it re-renders the score in place. */
  alphaTex: string;
}

export function AlphaTabPlayer({ alphaTex }: AlphaTabPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<AlphaTabApi | null>(null);

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("載入 alphaTab 中…");
  const [canPlay, setCanPlay] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [speed, setSpeed] = useState<number>(1);

  // Create the alphaTab API once. The score is (re)loaded from the alphaTex prop
  // by the second effect so changing licks doesn't tear down the synth/soundfont.
  useEffect(() => {
    let api: AlphaTabApi | null = null;
    let disposed = false;

    loadAlphaTab()
      .then((alphaTab) => {
        if (disposed || !containerRef.current) return;

        api = new alphaTab.AlphaTabApi(containerRef.current, {
          core: {
            // alphaTex is supplied at runtime via api.tex(); enable the mode.
            tex: true,
            fontDirectory: ALPHATAB_FONT_DIR,
            // Fallback if worker auto-detection from import.meta.url ever fails.
            scriptFile: ALPHATAB_MODULE,
          },
          player: {
            // PlayerMode.EnabledAutomatic. The JSON settings accept the enum key
            // as a string, so we avoid referencing the runtime enum object.
            // enableCursor / enableAnimatedBeatCursor default on under this mode,
            // giving the built-in playback cursor + beat highlight.
            playerMode: "EnabledAutomatic",
            soundFont: ALPHATAB_SOUNDFONT,
            scrollElement: containerRef.current,
          },
          display: { scale: 0.9 },
        });
        apiRef.current = api;

        api.error.on((err: Error) => {
          if (disposed) return;
          setStatus("error");
          setMessage(`alphaTab 錯誤:${err?.message ?? String(err)}`);
        });

        api.renderFinished.on(() => {
          if (disposed) return;
          setStatus("rendered");
          setMessage("樂譜已渲染。");
        });

        // Soundfont decode is the long pole for the synth; once loaded,
        // playPause() is meaningful (audio still needs a user gesture).
        api.soundFontLoaded.on(() => {
          if (disposed) return;
          setCanPlay(true);
        });

        // Drive the play/pause label from the engine, not from our click — the
        // synth can pause on its own (e.g. reaching the end without loop).
        api.playerStateChanged.on((args: { state: number }) => {
          if (disposed) return;
          setIsPlaying(args.state === 1); // PlayerState.Playing
        });

        api.tex(alphaTex);
      })
      .catch((err: unknown) => {
        if (disposed) return;
        setStatus("error");
        setMessage(
          `載入 alphaTab 失敗:${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      });

    return () => {
      disposed = true;
      try {
        api?.destroy();
      } catch {
        // best-effort teardown; ignore double-dispose in StrictMode
      }
      apiRef.current = null;
    };
    // Mount once. alphaTex changes are handled by the effect below so switching
    // licks re-renders the score without recreating the synth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render the score when the selected lick changes. Guarded on status so we
  // don't call tex() before the api exists; the mount effect handles first load.
  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    // Swap the score in place (no synth/soundfont reload). Stop any current
    // playback first so the cursor/transport reset cleanly to the new lick.
    setStatus("loading");
    setMessage("載入樂譜中…");
    api.stop();
    api.tex(alphaTex);
  }, [alphaTex]);

  // Keep the engine's loop/speed in sync with the controls. Setters are no-ops
  // until the api exists; re-applied on api creation via these same deps.
  useEffect(() => {
    if (apiRef.current) apiRef.current.isLooping = isLooping;
  }, [isLooping]);

  useEffect(() => {
    if (apiRef.current) apiRef.current.playbackSpeed = speed;
  }, [speed]);

  const statusColor =
    status === "error"
      ? "text-red-600"
      : status === "rendered"
        ? "text-green-700"
        : "text-gray-500";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          onClick={() => apiRef.current?.playPause()}
          disabled={!canPlay}
        >
          {!canPlay
            ? "載入播放器…"
            : isPlaying
              ? "⏸ 暫停"
              : "▶ 播放"}
        </Button>

        <ToggleButton
          active={isLooping}
          onClick={() => setIsLooping((v) => !v)}
        >
          🔁 循環{isLooping ? "(開)" : "(關)"}
        </ToggleButton>

        <div role="group" aria-label="播放速度" className="flex items-center gap-1">
          <span className="text-sm text-gray-500">速度</span>
          {SPEEDS.map((s) => (
            <ToggleButton
              key={s}
              active={speed === s}
              onClick={() => setSpeed(s)}
            >
              {s === 1 ? "原速" : `${s * 100}%`}
            </ToggleButton>
          ))}
        </div>

        <span className={`text-sm ${statusColor}`} role="status">
          {message}
        </span>
      </div>

      {/* alphaTab renders its SVG (notation + tab) into this container and draws
          the playback cursor over it. */}
      <div
        ref={containerRef}
        role="img"
        aria-label="樂譜(六線譜與五線譜)"
        className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-4"
      />
    </div>
  );
}
