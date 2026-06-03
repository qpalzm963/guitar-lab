// Shared base-path wiring for alphaTab's runtime assets.
//
// alphaTab's runtime (the ESM bundle, its worker/worklet siblings, the Bravura
// font and the soundfont) is vendored under public/alphatab/ and loaded as plain
// static URLs — NOT through the bundler (see components/licks/AlphaTabPlayer for
// why). On GitHub Pages the app is served from the /guitar-lab subpath, so those
// absolute /public URLs MUST be prefixed with the Pages basePath or they 404.
// next.config.ts exposes that basePath as NEXT_PUBLIC_BASE_PATH (empty in dev).
//
// Both the licks player and the P0 spike build their alphaTab URLs from here so
// the prefix logic lives in exactly one place.

/** The Pages basePath at runtime: "/guitar-lab" on Pages, "" in local dev. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Root of the vendored alphaTab runtime assets, basePath-prefixed. */
export const ALPHATAB_BASE = `${BASE_PATH}/alphatab`;

/**
 * The non-minified ESM entry. import.meta.url inside this bundle then points
 * under /public, so its sibling worker/worklet/soundfont lookups stay correct
 * when served from the subpath.
 */
export const ALPHATAB_MODULE = `${ALPHATAB_BASE}/alphaTab.mjs`;

/** Bravura music font directory (trailing slash required by alphaTab). */
export const ALPHATAB_FONT_DIR = `${ALPHATAB_BASE}/font/`;

/** General-MIDI soundfont used by the synth. */
export const ALPHATAB_SOUNDFONT = `${ALPHATAB_BASE}/soundfont/sonivox.sf3`;
