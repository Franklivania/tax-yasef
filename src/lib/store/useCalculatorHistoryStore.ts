import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CalculatorHistoryEntry } from "@/lib/types/calculator-history";

type CalculatorHistoryStore = {
  entries: CalculatorHistoryEntry[];
  addEntry: (entry: CalculatorHistoryEntry) => void;
  removeEntry: (id: string) => void;
  clear: () => void;
  getAll: () => CalculatorHistoryEntry[];
  getLatest: () => CalculatorHistoryEntry | undefined;
};

export const useCalculatorHistoryStore = create<CalculatorHistoryStore>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (entry) => {
        set((state) => ({
          entries: [entry, ...state.entries].slice(0, 50),
        }));
      },

      removeEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        }));
      },

      clear: () => set({ entries: [] }),

      getAll: () => get().entries,

      getLatest: () => {
        const entries = get().entries;
        return entries.length > 0 ? entries[0] : undefined;
      },
    }),
    {
      name: "tax-yasef-calculator-history-storage",
      partialize: (state) => ({ entries: state.entries }),
    }
  )
);
