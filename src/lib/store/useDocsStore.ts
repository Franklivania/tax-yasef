import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ApprovedDocId } from "@/lib/docs/catalog";

type DocsStore = {
  /**
   * null = Auto routing (system chooses the best approved doc for the query)
   */
  selectedDocId: ApprovedDocId | null;
  setSelectedDocId: (docId: ApprovedDocId | null) => void;
  clearSelectedDoc: () => void;
};

export const useDocsStore = create<DocsStore>()(
  persist(
    (set) => ({
      selectedDocId: null,
      setSelectedDocId: (docId) => set({ selectedDocId: docId }),
      clearSelectedDoc: () => set({ selectedDocId: null }),
    }),
    {
      name: "tax-yasef-doc-selection",
      partialize: (state) => ({ selectedDocId: state.selectedDocId }),
    }
  )
);
