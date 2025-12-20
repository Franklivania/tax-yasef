import { create } from 'zustand';
import { getUserIP, getUserBrowserInfo } from '../user-details';
import { getCookie, setCookie } from '../utils/cookies';

type UserStore = {
  userToken: string;
  ipAddress: string | null;
  browserInfo: ReturnType<typeof getUserBrowserInfo> | null;
  initialized: boolean;
  initialize: () => Promise<void>;
  getUserIdentifier: () => string;
}

// Generate a unique user token
const generateUserToken = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `user_${timestamp}_${random}`;
};

// Get or create user token from cookies
const getCookieToken = (): string => {
  const COOKIE_NAME = 'tax-yasef-user-token';
  const stored = getCookie(COOKIE_NAME);
  
  if (stored) return stored;
  
  const token = generateUserToken();
  setCookie(COOKIE_NAME, token, {
    days: 7,
    sameSite: 'Lax',
    secure: true,
  });
  
  return token;
};

export const useUserStore = create<UserStore>((set, get) => ({
  userToken: getCookieToken(),
  ipAddress: null,
  browserInfo: null,
  initialized: false,
  
  initialize: async () => {
    if (get().initialized) return;
    
    const ip = await getUserIP();
    const browserInfo = getUserBrowserInfo();
    
    set({
      ipAddress: ip,
      browserInfo,
      initialized: true,
    });
  },
  
  getUserIdentifier: () => {
    const state = get();
    if (state.ipAddress) {
      return `${state.userToken}_${state.ipAddress}`;
    }
    return state.userToken;
  },
}));

if (typeof window !== 'undefined') {
  useUserStore.getState().initialize();
}

