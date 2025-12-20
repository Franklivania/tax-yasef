import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Themes = "light" | "dark" | "system";

type ThemeStore = {
  theme: Themes;
  setTheme: (theme: Themes) => void;
  toggleTheme: () => void;
  getEffectiveTheme: () => "light" | "dark";
  isDark: () => boolean;
  isLight: () => boolean;
}

const defaultTheme: Themes = "system";

const getSystemTheme = (): "light" | "dark" => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (theme: Themes) => {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;
  
  if (effectiveTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: defaultTheme,
      setTheme: (theme: Themes) => {
        set({ theme });
        applyTheme(theme);
      },
      toggleTheme: () => {
        const current = get().theme;
        const newTheme = current === 'system' 
          ? (getSystemTheme() === 'dark' ? 'light' : 'dark')
          : (current === 'dark' ? 'light' : 'dark');
        set({ theme: newTheme });
        applyTheme(newTheme);
      },
      getEffectiveTheme: () => {
        const theme = get().theme;
        if (theme === 'system') {
          return getSystemTheme();
        }
        return theme;
      },
      isDark: () => get().getEffectiveTheme() === 'dark',
      isLight: () => get().getEffectiveTheme() === 'light',
    }),
    {
      name: 'tax-yasef-theme-storage',
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme);
        }
      },
    }
  )
)

// Initialize theme and listen to system changes
if (typeof window !== 'undefined') {
  // Apply theme immediately from localStorage (before Zustand rehydrates)
  const stored = localStorage.getItem('tax-yasef-theme-storage');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Zustand persist stores as {state: {theme: "light"}, version: 0}
      const theme = parsed?.state?.theme || defaultTheme;
      applyTheme(theme);
    } catch { 
      applyTheme(defaultTheme);
    }
  } else {
    applyTheme(defaultTheme);
  }

  // Listen to system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleSystemThemeChange = () => {
    // Use setTimeout to ensure store is initialized
    setTimeout(() => {
      const currentTheme = useThemeStore.getState().theme;
      if (currentTheme === 'system') {
        applyTheme('system');
      }
    }, 0);
  };
  mediaQuery.addEventListener('change', handleSystemThemeChange);
}