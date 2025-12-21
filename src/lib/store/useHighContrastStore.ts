/**
 * High Contrast Mode Store
 * Manages high contrast mode state for accessibility
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

type HighContrastStore = {
  enabled: boolean;
  toggle: () => void;
  setEnabled: (enabled: boolean) => void;
};

export const useHighContrastStore = create<HighContrastStore>()(
  persist(
    (set) => ({
      enabled: false,
      toggle: () => set((state) => ({ enabled: !state.enabled })),
      setEnabled: (enabled: boolean) => set({ enabled }),
    }),
    {
      name: "tax-yasef-high-contrast",
    }
  )
);
