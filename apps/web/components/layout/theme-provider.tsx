"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

import { defaultThemeId, themePresetIds } from "@/lib/theme-presets";

const storageKey = "artsite-theme";

const ThemeContext = createContext<{
  themeId: string;
  setThemeId: (themeId: string) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState(defaultThemeId);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);

    if (stored && themePresetIds.has(stored)) {
      setThemeId(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = themeId;
    window.localStorage.setItem(storageKey, themeId);
  }, [themeId]);

  const value = useMemo(
    () => ({
      themeId,
      setThemeId: (nextThemeId: string) => {
        if (!themePresetIds.has(nextThemeId)) {
          return;
        }

        setThemeId(nextThemeId);
      }
    }),
    [themeId]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
