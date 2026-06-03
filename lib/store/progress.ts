import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Tracks which curriculum items the learner has marked 已學 (done). We persist a
// plain record of id → true (a JSON-serializable set; a real Set would not
// survive JSON.stringify in the persist layer). Only completed ids are stored,
// so the blob stays small and absent keys read as not-done.
interface ProgressState {
  done: Record<string, true>;
  toggle: (id: string) => void;
  isDone: (id: string) => boolean;
  /** Number of items currently marked done. */
  doneCount: () => number;
  clearAll: () => void;
}

// Runtime guard: the persisted blob is untrusted (partial writes, hand edits),
// so coerce it to a clean record of string → true before trusting it. Anything
// that isn't a plain object, or any value that isn't exactly true, is dropped —
// a corrupt blob must degrade to "nothing learned", never crash the render.
function sanitizeDone(raw: unknown): Record<string, true> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
  const out: Record<string, true> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof k === "string" && v === true) out[k] = true;
  }
  return out;
}

// SSR-safe persist, mirroring lib/store/diagrams.ts: skipHydration keeps the
// store off localStorage during server/first-client render (no hydration
// mismatch); the client calls useProgress.persist.rehydrate() in an effect.
// version + migrate keep the stored shape evolvable and corruption-safe.
export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      done: {},
      toggle: (id) =>
        set((s) => {
          const next = { ...s.done };
          if (next[id]) delete next[id];
          else next[id] = true;
          return { done: next };
        }),
      isDone: (id) => get().done[id] === true,
      doneCount: () => Object.keys(get().done).length,
      clearAll: () => set({ done: {} }),
    }),
    {
      name: "guitar-lab:progress",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      // Corruption safety: coerce whatever is in localStorage to a clean record
      // instead of letting bad data through. Tolerates an absent persisted state.
      migrate: (persisted) => {
        const state = persisted as Partial<ProgressState> | undefined;
        return { ...(state ?? {}), done: sanitizeDone(state?.done) } as ProgressState;
      },
    },
  ),
);
