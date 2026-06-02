import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type LabelMode = "name" | "degree" | "none";

interface SettingsState {
  root: string;
  scaleName: string;
  labels: LabelMode;
  setRoot: (root: string) => void;
  setScale: (scaleName: string) => void;
  setLabels: (labels: LabelMode) => void;
}

// v1 offered sharp-only roots; the pickers now use a curated enharmonic set
// (lib/theory/notes.ts) so tonal spells keys cleanly. Map the legacy sharp roots
// that are no longer offered to their flat equivalents; F# stays (still offered).
const LEGACY_ROOT_MAP: Record<string, string> = {
  "C#": "Db",
  "D#": "Eb",
  "G#": "Ab",
  "A#": "Bb",
};

function normalizeRoot(root: string): string {
  return LEGACY_ROOT_MAP[root] ?? root;
}

// SSR-safe: skipHydration means the store never touches localStorage during
// server render or first client render (both use the defaults, so no hydration
// mismatch). The client calls useSettings.persist.rehydrate() in an effect.
// version + migrate keep stored data evolvable; v1→v2 normalizes legacy roots.
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      root: "C",
      scaleName: "major",
      labels: "name",
      setRoot: (root) => set({ root }),
      setScale: (scaleName) => set({ scaleName }),
      setLabels: (labels) => set({ labels }),
    }),
    {
      name: "guitar-lab:settings",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      migrate: (persisted, version) => {
        const state = persisted as SettingsState;
        if (version < 2 && state?.root) {
          return { ...state, root: normalizeRoot(state.root) };
        }
        return state;
      },
    },
  ),
);
