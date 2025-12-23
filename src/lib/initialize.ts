import { useUserStore } from "./store/useUserStore";
import { useTokenUsageStore } from "./store/useTokenUsageStore";
import { initializePromptPrime } from "./utils/ai";

export async function initializeApp(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const userStore = useUserStore.getState();
    if (!userStore.initialized) {
      await userStore.initialize();
    }

    const tokenStore = useTokenUsageStore.getState();
    tokenStore.syncUserToken();
    tokenStore.resetIfNeeded();

    // Initialize document ingestion system (non-blocking - app continues even if PDF fails)
    // This allows the app to function even if the PDF is corrupted or unavailable
    initializePromptPrime().catch((error) => {
      console.warn(
        "PDF initialization failed, but app will continue. Document features may be limited.",
        error
      );
      // Don't throw - allow app to continue without PDF
    });

    if (import.meta.env.DEV) {
      console.log("App initialized:", {
        userToken: userStore.userToken,
        initialized: userStore.initialized,
        ipAddress: userStore.ipAddress,
        identifier: userStore.getUserIdentifier(),
      });
    }
  } catch (error) {
    console.error("Failed to initialize app:", error);
  }
}

export function getCurrentUser() {
  const userStore = useUserStore.getState();
  return {
    token: userStore.userToken,
    identifier: userStore.getUserIdentifier(),
    ipAddress: userStore.ipAddress,
    browserInfo: userStore.browserInfo,
    initialized: userStore.initialized,
  };
}
