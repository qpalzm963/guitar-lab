import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Marker } from "@/lib/theory/types";

// A saved homework diagram. We store ONLY the diagram data (the Marker list +
// board config), never a rasterized PNG: PNGs are large and would blow the
// localStorage quota fast. PNG export is re-derived on demand from the markers.
export interface SavedDiagram {
  id: string;
  name: string;
  /** zh-TW caption shown above the board (optional). */
  title?: string;
  createdAt: number;
  updatedAt: number;
  tuning: string[];
  toFret: number;
  markers: Marker[];
}

interface DiagramsState {
  diagrams: SavedDiagram[];
  add: (diagram: SavedDiagram) => void;
  update: (id: string, patch: Partial<Omit<SavedDiagram, "id">>) => void;
  remove: (id: string) => void;
  clearAll: () => void;
  /** Serialize the whole library to a JSON backup string. */
  exportJson: () => string;
  /**
   * Replace the library from a JSON backup string produced by exportJson.
   * Replace (not merge) semantics: the imported list becomes the library, so a
   * backup restores an exact snapshot. Validates the shape; on any malformed
   * input returns { ok: false } and leaves the current library untouched.
   */
  importJson: (json: string) => { ok: boolean; error?: string };
}

// Runtime shape guards. The persisted blob and any imported JSON are untrusted,
// so we validate before trusting them — a corrupt entry must not crash the app.
function isMarker(v: unknown): v is Marker {
  if (typeof v !== "object" || v === null) return false;
  const m = v as Record<string, unknown>;
  return (
    typeof m.string === "number" &&
    typeof m.fret === "number" &&
    typeof m.pitchClass === "string" &&
    typeof m.role === "string" &&
    typeof m.isRoot === "boolean"
  );
}

function isSavedDiagram(v: unknown): v is SavedDiagram {
  if (typeof v !== "object" || v === null) return false;
  const d = v as Record<string, unknown>;
  return (
    typeof d.id === "string" &&
    typeof d.name === "string" &&
    typeof d.createdAt === "number" &&
    typeof d.updatedAt === "number" &&
    Array.isArray(d.tuning) &&
    d.tuning.every((t) => typeof t === "string") &&
    typeof d.toFret === "number" &&
    Array.isArray(d.markers) &&
    d.markers.every(isMarker)
  );
}

/** Parse an array of SavedDiagram from unknown JSON; null if shape is invalid. */
function parseDiagrams(raw: unknown): SavedDiagram[] | null {
  if (!Array.isArray(raw)) return null;
  if (!raw.every(isSavedDiagram)) return null;
  return raw as SavedDiagram[];
}

// SSR-safe persist, mirroring lib/store/settings.ts: skipHydration keeps the
// store off localStorage during server/first-client render (no hydration
// mismatch); the client calls useDiagrams.persist.rehydrate() in an effect.
// version + migrate keep the stored shape evolvable.
export const useDiagrams = create<DiagramsState>()(
  persist(
    (set, get) => ({
      diagrams: [],
      add: (diagram) =>
        set((s) => ({ diagrams: [...s.diagrams, diagram] })),
      update: (id, patch) =>
        set((s) => ({
          diagrams: s.diagrams.map((d) =>
            d.id === id ? { ...d, ...patch, updatedAt: Date.now() } : d,
          ),
        })),
      remove: (id) =>
        set((s) => ({ diagrams: s.diagrams.filter((d) => d.id !== id) })),
      clearAll: () => set({ diagrams: [] }),
      exportJson: () => JSON.stringify(get().diagrams, null, 2),
      importJson: (json) => {
        let raw: unknown;
        try {
          raw = JSON.parse(json);
        } catch {
          return { ok: false, error: "JSON 格式錯誤" };
        }
        const parsed = parseDiagrams(raw);
        if (!parsed) return { ok: false, error: "資料格式不符" };
        set({ diagrams: parsed });
        return { ok: true };
      },
    }),
    {
      name: "guitar-lab:diagrams",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      // Corruption safety: if the persisted blob is malformed (e.g. a partial
      // write or a hand-edited localStorage), fall back to an empty library
      // instead of letting bad data through and crashing the render.
      migrate: (persisted) => {
        const state = persisted as Partial<DiagramsState> | undefined;
        const safe = parseDiagrams(state?.diagrams) ?? [];
        return { ...(state ?? {}), diagrams: safe } as DiagramsState;
      },
    },
  ),
);
