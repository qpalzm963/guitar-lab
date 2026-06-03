"use client";

import { useSyncExternalStore } from "react";

/**
 * Static-export-safe deep-link param reading.
 *
 * We deliberately do NOT use next/navigation's `useSearchParams`: it forces the
 * tree into a Suspense boundary and triggers a CSR bailout that complicates the
 * static export (`output: 'export'`). Reading `window.location.search` is safe
 * as long as it only happens in the browser, after the first (hydration-matching)
 * render — same principle as the existing `persist.rehydrate()` pattern.
 *
 * We use `useSyncExternalStore` rather than a setState-in-effect for two reasons:
 *  1. It is the React-blessed way to read browser/external state without a
 *     hydration mismatch — `getServerSnapshot` returns the server value (null),
 *     so SSR and the first client render agree, then React swaps in the real
 *     value. No setState-in-effect (which the repo's lint forbids).
 *  2. The snapshot is referentially stable (parsed once, cached), so React does
 *     not loop.
 *
 * The parse/validate steps are pure functions (no `window`) so they are
 * unit-testable on their own.
 */

/** Parse a raw `location.search` string into a flat string→string map. */
export function parseSearch(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const out: Record<string, string> = {};
  for (const [k, v] of params.entries()) out[k] = v;
  return out;
}

/**
 * Pick a value from parsed params only if it is in `allowed`; otherwise return
 * `undefined` (so callers fall back to their current default). `allowed` may be
 * any iterable of valid ids — pass the same id list the picker uses, so an
 * unknown/typo/invalid param is ignored gracefully.
 */
export function pickAllowed(
  params: Record<string, string>,
  key: string,
  allowed: Iterable<string>,
): string | undefined {
  const value = params[key];
  if (value == null) return undefined;
  const set = allowed instanceof Set ? allowed : new Set(allowed);
  return set.has(value) ? value : undefined;
}

// Module-level cache so getSnapshot returns a STABLE reference (required by
// useSyncExternalStore — a fresh object every call would loop). The query string
// is read once; deep-links only seed initial state, so we never resubscribe to
// later history changes (the no-op subscribe reflects that).
let cached: { search: string; parsed: Record<string, string> } | null = null;

function getClientSnapshot(): Record<string, string> {
  const search = window.location.search;
  if (!cached || cached.search !== search) {
    cached = { search, parsed: parseSearch(search) };
  }
  return cached.parsed;
}

// Server (and the first client render) see null — no params applied yet — so the
// rendered output matches and there is no hydration mismatch. After hydration,
// React reads getClientSnapshot and the real params flow in.
const getServerSnapshot = (): Record<string, string> | null => null;

// Deep-links seed initial state only; we don't react to later URL changes, so
// the subscription is a no-op (returns an unsubscribe that does nothing).
const subscribe = () => () => {};

/**
 * Read the page's query string. Returns `null` on the server and the first
 * client render, then the parsed params after hydration. Callers validate each
 * param (see `pickAllowed`) and seed their state from the non-null value.
 */
export function useInitialParams(): Record<string, string> | null {
  return useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
}
