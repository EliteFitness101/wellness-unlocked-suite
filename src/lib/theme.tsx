import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeSkin = "feminine" | "masculine" | "neutral";

const THEMES: ThemeSkin[] = ["feminine", "masculine", "neutral"];
const STORAGE_KEY = "aura-theme";

type ThemeContextValue = { theme: ThemeSkin; setTheme: (t: ThemeSkin) => void };

const ThemeContext = createContext<ThemeContextValue>({
  theme: "feminine",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeSkin>("feminine");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeSkin | null;
    if (stored && THEMES.includes(stored)) setThemeState(stored);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    THEMES.forEach((t) => root.classList.remove(`theme-${t}`));
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  const setTheme = (t: ThemeSkin) => {
    setThemeState(t);
    window.localStorage.setItem(STORAGE_KEY, t);
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

export const themeLabels: Record<ThemeSkin, string> = {
  feminine: "Blush Couture",
  masculine: "Noir Steel",
  neutral: "Ivory Calm",
};
