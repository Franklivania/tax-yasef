import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ModelID, ModelOption, Models } from "../types/models";
import { ModelOptions, ModelParams } from "../types/models";

type ModelStore = {
  model: ModelID;
  setModel: (model: ModelID) => void;
  getModelValue: () => Models;
  getModelOption: () => ModelOption;
  modelOptions: readonly ModelOption[];
  modelParams: Record<ModelID, Models>;
};

const defaultModel = ModelOptions[0].label;

export const useModelStore = create<ModelStore>()(
  persist(
    (set, get) => ({
      model: defaultModel,
      setModel: (model: ModelID) => set({ model }),
      getModelValue: () => ModelParams[get().model],
      getModelOption: () => {
        const currentModel = get().model;
        return (
          ModelOptions.find((option) => option.label === currentModel) ||
          ModelOptions[0]
        );
      },
      modelOptions: ModelOptions,
      modelParams: ModelParams,
    }),
    {
      name: "tax-yasef-model-storage",
      partialize: (state) => ({ model: state.model }),
    }
  )
);
