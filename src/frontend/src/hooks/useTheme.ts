/**
 * useTheme — persists dark/light theme preference in localStorage.
 *
 * - Initial value: reads from localStorage key "ai-code-review-theme".
 * - Falls back to system prefers-color-scheme when no stored value.
 * - Applies/removes the "dark" class on <html> whenever theme changes.
 */
import { useCallback, useEffect, useState } from "react";

type Theme = "dark" | "light";

const STORAGE_KEY = "ai-code-review-theme";

/** Reads the initial theme — localStorage first, then system preference. */
function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // Sync theme class to <html> and persist to localStorage on every change.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage may be unavailable in private browsing; ignore.
    }
  }, [theme]);

  const toggleTheme = useCallback(
    () => setTheme((prev) => (prev === "dark" ? "light" : "dark")),
    [],
  );

  return { theme, toggleTheme };
}
