import { useUserStore } from './store/useUserStore';
import { useTokenUsageStore } from './store/useTokenUsageStore';


export async function initializeApp(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const userStore = useUserStore.getState();
    if (!userStore.initialized) {
      await userStore.initialize();
    }

    const tokenStore = useTokenUsageStore.getState();
    tokenStore.syncUserToken();
    tokenStore.resetIfNeeded();

    if (import.meta.env.DEV) {
      console.log('App initialized:', {
        userToken: userStore.userToken,
        initialized: userStore.initialized,
        ipAddress: userStore.ipAddress,
        identifier: userStore.getUserIdentifier(),
      });
    }
  } catch (error) {
    console.error('Failed to initialize app:', error);
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

