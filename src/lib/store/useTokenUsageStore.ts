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
  "Llama 4 Maverick": {
    minute: createWindow(60000),
    day: createWindow(86400000),
  },
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
          const defaultUsage = initModelUsage();
          const updated = { ...state.modelUsage };
          let changed = false;

          // Ensure all models exist
          for (const model in defaultUsage) {
            if (!updated[model as ModelID]) {
              updated[model as ModelID] = defaultUsage[model as ModelID];
              changed = true;
            }
          }

          // Reset windows that have expired
          for (const model in updated) {
            const usage = updated[model as ModelID];
            if (usage && usage.minute && usage.minute.resetAt <= now) {
              usage.minute = createWindow(60000);
              changed = true;
            }
            if (usage && usage.day && usage.day.resetAt <= now) {
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
        let usage = state.modelUsage[model];

        // Safety check: if usage doesn't exist, initialize it
        if (!usage) {
          const defaultUsage = initModelUsage();
          set({
            modelUsage: { ...state.modelUsage, [model]: defaultUsage[model] },
          });
          usage = get().modelUsage[model];
        }

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
          let usage = state.modelUsage[model];

          // Safety check: if usage doesn't exist, initialize it
          if (!usage) {
            const defaultUsage = initModelUsage();
            usage = defaultUsage[model];
          } else {
            usage = { ...usage };
          }

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

        // Safety check: if usage doesn't exist, initialize it
        if (!usage) {
          const defaultUsage = initModelUsage();
          set({
            modelUsage: { ...state.modelUsage, [model]: defaultUsage[model] },
          });
          const updatedState = get();
          const updatedUsage = updatedState.modelUsage[model];

          if (
            updatedUsage.minute.requests >= limits.requestsPerMin ||
            updatedUsage.day.requests >= limits.requestsPerDay
          ) {
            return 0;
          }

          return Math.min(
            limits.tokensPerMin - updatedUsage.minute.tokens,
            limits.tokensPerDay - updatedUsage.day.tokens
          );
        }

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

          // Ensure all models are initialized (migration for new models)
          const defaultUsage = initModelUsage();
          const updatedUsage = { ...state.modelUsage };
          let needsUpdate = false;

          for (const model in defaultUsage) {
            if (!updatedUsage[model as ModelID]) {
              updatedUsage[model as ModelID] = defaultUsage[model as ModelID];
              needsUpdate = true;
            }
          }

          if (needsUpdate) {
            state.modelUsage = updatedUsage;
          }
        }
      },
    }
  )
);

// Sync usage data to server
async function syncUsageToServer() {
  if (typeof window === "undefined") return;

  try {
    const state = useTokenUsageStore.getState();
    const userToken = useUserStore.getState().userToken;
    const ipAddress = useUserStore.getState().ipAddress;

    await fetch("/api/tracking/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userToken,
        ipAddress,
        modelUsage: state.modelUsage,
      }),
    });
  } catch (error) {
    // Silently fail - don't interrupt user experience
    if (import.meta.env.DEV) {
      console.warn("Failed to sync usage data:", error);
    }
  }
}

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

  // Sync usage data periodically (every 30 seconds)
  setInterval(() => {
    syncUsageToServer();
  }, 30000);

  // Sync immediately on load
  setTimeout(() => {
    syncUsageToServer();
  }, 2000);

  // Sync after each usage update
  const originalAddUsage = useTokenUsageStore.getState().addUsage;
  useTokenUsageStore.setState({
    addUsage: (model, tokens) => {
      originalAddUsage(model, tokens);
      // Debounce sync - only sync after 5 seconds of inactivity
      const timeoutId = (
        window as Window & {
          __usageSyncTimeout?: ReturnType<typeof setTimeout>;
        }
      ).__usageSyncTimeout;
      if (timeoutId) clearTimeout(timeoutId);
      (
        window as Window & {
          __usageSyncTimeout?: ReturnType<typeof setTimeout>;
        }
      ).__usageSyncTimeout = setTimeout(() => {
        syncUsageToServer();
      }, 5000);
    },
  });
}
