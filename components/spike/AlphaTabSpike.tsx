"use client";

import { useEffect, useRef, useState } from "react";
// Type-only import: erased at compile time (isolatedModules), so the 2.3 MB
// npm bundle never enters the Turbopack graph. The runtime code is loaded
// separately from /public (see loadAlphaTab below).
import type { AlphaTabApi } from "@coderline/alphatab";
import {
  ALPHATAB_FONT_DIR,
  ALPHATAB_MODULE,
  ALPHATAB_SOUNDFONT,
} from "@/lib/alphatab/assets";

// We deliberately do NOT `import('@coderline/alphatab')` for the runtime.
// alphaTab launches its Web Worker + Audio Worklet via
// `new Worker(new URL('./alphaTab.worker.mjs', import.meta.url))` from inside
// its own ESM bundle. If the bundle were processed by Turbopack, that
// import.meta.url would resolve into the bundler's chunk space and the sibling
// worker/worklet/soundfont lookups become fragile.
//
// Instead we copy alphaTab's dist into /public/alphatab and load the bundle as
// a plain static module at runtime. import.meta.url inside it then equals
// `/alphatab/alphaTab.mjs`, so the worker, worklet, Bravura font and soundfont
// all resolve as siblings with zero bundler involvement. The double ignore
// comment keeps both Webpack and Turbopack from touching the import.
//
// We load the non-minified ESM entry on purpose: alphaTab.mjs imports
// `./alphaTab.core.mjs` and spawns its worker/worklet from the non-min sibling
// names, so the public/alphatab layout must mirror dist/ exactly. (Using the
// .min entry would 404 on its non-min siblings.) These four .mjs files plus
// font/ and soundfont/ are the complete runtime asset set.
// Asset URLs (entry mjs, font dir, soundfont) are basePath-prefixed in the
// shared helper so they don't 404 on the /guitar-lab subpath. import.meta.url
// inside the loaded bundle then also points under /public, so its sibling
// worker/worklet/soundfont lookups stay correct when served from the subpath.
type AlphaTabModule = typeof import("@coderline/alphatab");

function loadAlphaTab(): Promise<AlphaTabModule> {
  return import(
    /* webpackIgnore: true */ /* turbopackIgnore: true */ ALPHATAB_MODULE
  ) as Promise<AlphaTabModule>;
}

// A short, recognizable alphaTex riff (low-E-string ascending). Renders as
// notation + tab; gives the player something audible on a user gesture.
const TEX = ":4 0.6 2.6 3.6 0.5 2.5 3.5 | 0.4 2.4 :2 0.3";

type Status = "loading" | "rendered" | "error";

export function AlphaTabSpike() {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<AlphaTabApi | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [canPlay, setCanPlay] = useState(false);
  const [message, setMessage] = useState<string>("Loading alphaTab…");

  useEffect(() => {
    let api: AlphaTabApi | null = null;
    let disposed = false;

    loadAlphaTab()
      .then((alphaTab) => {
        if (disposed || !containerRef.current) return;

        api = new alphaTab.AlphaTabApi(containerRef.current, {
          core: {
            // alphaTex passed directly via the `tex` option below.
            tex: true,
            // Plain static URLs under /public — no bundler resolution.
            fontDirectory: ALPHATAB_FONT_DIR,
            // Belt-and-suspenders: alphaTab auto-detects the worker from the
            // module URL, but if that path ever fails it falls back to
            // scriptFile. Point it at the public bundle so the fallback works.
            scriptFile: ALPHATAB_MODULE,
          },
          player: {
            // PlayerMode.EnabledAutomatic. The JSON settings accept the enum
            // key as a string, so we avoid referencing the runtime enum object.
            playerMode: "EnabledAutomatic",
            soundFont: ALPHATAB_SOUNDFONT,
            scrollElement: containerRef.current,
          },
          display: {
            scale: 0.9,
          },
        });
        apiRef.current = api;

        api.error.on((err: Error) => {
          if (disposed) return;
          setStatus("error");
          setMessage(`alphaTab error: ${err?.message ?? String(err)}`);
        });

        api.renderFinished.on(() => {
          if (disposed) return;
          setStatus("rendered");
          setMessage("Tab rendered.");
        });

        // Fires once the soundfont is decoded. That's the long pole for the
        // synth, so once it's loaded playPause() is meaningful (audio still
        // needs a user gesture). The per-synth `readyForPlayback` lives on
        // api.player; the top-level soundFontLoaded emitter is the clean signal.
        api.soundFontLoaded.on(() => {
          if (disposed) return;
          setCanPlay(true);
        });

        api.tex(TEX);
      })
      .catch((err: unknown) => {
        if (disposed) return;
        setStatus("error");
        setMessage(
          `Failed to load alphaTab module: ${
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
  }, []);

  function handlePlay() {
    // Audio playback requires a user gesture — this click provides it.
    apiRef.current?.playPause();
  }

  const statusColor =
    status === "error"
      ? "text-red-600"
      : status === "rendered"
        ? "text-green-700"
        : "text-gray-500";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          onClick={handlePlay}
          disabled={!canPlay}
          className="rounded-md border border-gray-800 bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {canPlay ? "▶ Play / Pause" : "Loading player…"}
        </button>
        <span className={`text-sm ${statusColor}`} role="status">
          {message}
        </span>
      </div>

      {/* alphaTab renders its SVG into this container. */}
      <div
        ref={containerRef}
        className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-4"
      />
    </div>
  );
}
