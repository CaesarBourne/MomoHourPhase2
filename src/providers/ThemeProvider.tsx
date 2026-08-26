'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'momo-hour-theme';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

/**
 * Manual light/dark toggle, layered on top of the system-preference default
 * that already worked via Tailwind's `dark:` classes. First load with no
 * saved choice still follows the OS/browser (`prefers-color-scheme`) - this
 * only kicks in once someone actually clicks the toggle, then remembers that
 * explicit choice in localStorage from then on, overriding the OS setting.
 *
 * The inline script in `app/layout.tsx`'s `<head>` sets the same class
 * BEFORE hydration (reading the same storage key + same system-preference
 * fallback) so there's no flash of the wrong theme on load - this provider
 * only needs to keep that class in sync after the fact and expose the toggle.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Real value is set in the effect below (client-only); this initial guess
  // just avoids `theme` being briefly undefined - the inline head script has
  // already applied the correct class to <html> by the time this runs.
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(stored ?? system);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
      return next;
    });
  }, []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
