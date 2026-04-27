"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export type ColorTheme = "pink" | "lavender" | "mint" | "peach" | "sky";

export const COLOR_THEMES: { value: ColorTheme; label: string; swatch: string }[] = [
  { value: "pink", label: "ピンク", swatch: "#e8a5b8" },
  { value: "lavender", label: "ラベンダー", swatch: "#b8a4d4" },
  { value: "mint", label: "ミント", swatch: "#8fcfb4" },
  { value: "peach", label: "ピーチ", swatch: "#f2b8a0" },
  { value: "sky", label: "スカイ", swatch: "#9cc4e0" },
];

export const COLOR_STORAGE_KEY = "ortace.colorTheme";

type ColorThemeContextValue = {
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
};

const ColorThemeContext = React.createContext<ColorThemeContextValue | null>(null);

function readInitialTheme(): ColorTheme {
  if (typeof document === "undefined") return "pink";
  const attr = document.documentElement.getAttribute("data-theme") as ColorTheme | null;
  if (attr && COLOR_THEMES.some((t) => t.value === attr)) return attr;
  return "pink";
}

function ColorThemeController({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = React.useState<ColorTheme>(readInitialTheme);

  const setColorTheme = React.useCallback((next: ColorTheme) => {
    setColorThemeState(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      window.localStorage.setItem(COLOR_STORAGE_KEY, next);
    } catch {
      // localStorage unavailable (e.g. private mode) — ignore
    }
  }, []);

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme }}>
      {children}
    </ColorThemeContext.Provider>
  );
}

export function useColorTheme() {
  const ctx = React.useContext(ColorThemeContext);
  if (!ctx) throw new Error("useColorTheme must be used within ThemeProvider");
  return ctx;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ColorThemeController>{children}</ColorThemeController>
    </NextThemesProvider>
  );
}
