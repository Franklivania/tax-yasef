import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ModelID } from "../types/models";
import { ModelLimits } from "../types/models";
import { useUserStore } from "./useUserStore";

type UsageWindow = {
  tokens: number;
  requests: number;
  resetAt: number;
};

type TokenUsageStore = {
  userToken: string;
  modelUsage: Record<ModelID, { minute: UsageWindow; day: UsageWindow }>;
  canUse: (model: ModelID, tokens: number) => boolean;
  addUsage: (model: ModelID, tokens: number) => void;
  getRemaining: (model: ModelID) => number;
  resetIfNeeded: () => void;
  syncUserToken: () => void;
};

const createWindow = (durationMs: number): UsageWindow => ({
  tokens: 0,
  requests: 0,
  resetAt: Date.now() + durationMs,
});

const initModelUsage = (): Record<
  ModelID,
  { minute: UsageWindow; day: UsageWindow }
> => ({
  "GPT-4 OSS": { minute: createWindow(60000), day: createWindow(86400000) },
  "GPT-OSS": { minute: createWindow(60000), day: createWindow(86400000) },
  "Llama 3.1": { minute: createWindow(60000), day: createWindow(86400000) },
  "Llama Guard 4": { minute: createWindow(60000), day: createWindow(86400000) },
  "Groq Compound": { minute: createWindow(60000), day: createWindow(86400000) },
});

export const useTokenUsageStore = create<TokenUsageStore>()(
  persist(
    (set, get) => ({
      userToken: useUserStore.getState().userToken,
      modelUsage: initModelUsage(),

      syncUserToken: () => {
        const userToken = useUserStore.getState().userToken;
        set({ userToken });
      },

      resetIfNeeded: () => {
        const now = Date.now();
        set((state) => {
          const updated = { ...state.modelUsage };
          let changed = false;

          for (const model in updated) {
            const usage = updated[model as ModelID];
            if (usage.minute.resetAt <= now) {
              usage.minute = createWindow(60000);
              changed = true;
            }
            if (usage.day.resetAt <= now) {
              usage.day = createWindow(86400000);
              changed = true;
            }
          }

          return changed ? { modelUsage: updated } : state;
        });
      },

      canUse: (model: ModelID, tokens: number) => {
        const state = get();
        state.resetIfNeeded();

        const limits = ModelLimits[model];
        const usage = state.modelUsage[model];

        const minuteOk =
          usage.minute.tokens + tokens <= limits.tokensPerMin &&
          usage.minute.requests + 1 <= limits.requestsPerMin;
        const dayOk =
          usage.day.tokens + tokens <= limits.tokensPerDay &&
          usage.day.requests + 1 <= limits.requestsPerDay;

        return minuteOk && dayOk;
      },

      addUsage: (model: ModelID, tokens: number) => {
        set((state) => {
          const usage = { ...state.modelUsage[model] };
          usage.minute = {
            ...usage.minute,
            tokens: usage.minute.tokens + tokens,
            requests: usage.minute.requests + 1,
          };
          usage.day = {
            ...usage.day,
            tokens: usage.day.tokens + tokens,
            requests: usage.day.requests + 1,
          };
          return { modelUsage: { ...state.modelUsage, [model]: usage } };
        });
      },

      getRemaining: (model: ModelID) => {
        const state = get();
        state.resetIfNeeded();

        const limits = ModelLimits[model];
        const usage = state.modelUsage[model];

        if (
          usage.minute.requests >= limits.requestsPerMin ||
          usage.day.requests >= limits.requestsPerDay
        ) {
          return 0;
        }

        return Math.min(
          limits.tokensPerMin - usage.minute.tokens,
          limits.tokensPerDay - usage.day.tokens
        );
      },
    }),
    {
      name: "tax-yasef-token-usage-storage",
      partialize: (state) => ({
        userToken: state.userToken,
        modelUsage: state.modelUsage,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.userToken = useUserStore.getState().userToken;
        }
      },
    }
  )
);

if (typeof window !== "undefined") {
  const syncToken = () => {
    const userToken = useUserStore.getState().userToken;
    const currentToken = useTokenUsageStore.getState().userToken;
    if (userToken !== currentToken) {
      useTokenUsageStore.getState().syncUserToken();
    }
  };

  syncToken();
  useUserStore.subscribe((state) => {
    if (state.initialized) {
      syncToken();
    }
  });
}
