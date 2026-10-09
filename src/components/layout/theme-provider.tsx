"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeChoice = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

interface ThemeContextType {
  theme: ThemeChoice;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeChoice) => void;
  reduceTransparency: boolean;
  setReduceTransparency: (value: boolean) => void;
  reduceMotion: boolean;
  setReduceMotion: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): ThemeChoice {
  if (typeof window === "undefined") return "system";
  try {
    return (localStorage.getItem("akshelf-theme") as ThemeChoice) || "system";
  } catch {
    return "system";
  }
}

function getInitialResolved(choice: ThemeChoice): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  try {
    if (choice === "system") {
      return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
    return choice;
  } catch {
    return "dark";
  }
}

function getInitialTransparency(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("akshelf-transparency") === "reduced";
  } catch {
    return false;
  }
}

function getInitialMotion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("akshelf-motion") === "reduced";
  } catch {
    return false;
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    getInitialResolved(getInitialTheme()),
  );
  const [reduceTransparency, setReduceTransparencyState] =
    useState<boolean>(getInitialTransparency);
  const [reduceMotion, setReduceMotionState] = useState<boolean>(getInitialMotion);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");

    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        const nextResolved: ResolvedTheme = e.matches ? "light" : "dark";
        setResolvedTheme(nextResolved);
        document.documentElement.setAttribute("data-theme", nextResolved);
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, [theme]);

  const setTheme = (choice: ThemeChoice) => {
    setThemeState(choice);
    try {
      localStorage.setItem("akshelf-theme", choice);
      const isLight =
        choice === "light" ||
        (choice === "system" && window.matchMedia("(prefers-color-scheme: light)").matches);
      const resolved: ResolvedTheme = isLight ? "light" : "dark";
      setResolvedTheme(resolved);
      document.documentElement.setAttribute("data-theme", resolved);
    } catch {}
  };

  const setReduceTransparency = (enabled: boolean) => {
    setReduceTransparencyState(enabled);
    try {
      if (enabled) {
        localStorage.setItem("akshelf-transparency", "reduced");
        document.documentElement.setAttribute("data-transparency", "reduced");
      } else {
        localStorage.removeItem("akshelf-transparency");
        document.documentElement.removeAttribute("data-transparency");
      }
    } catch {}
  };

  const setReduceMotion = (enabled: boolean) => {
    setReduceMotionState(enabled);
    try {
      if (enabled) {
        localStorage.setItem("akshelf-motion", "reduced");
        document.documentElement.setAttribute("data-motion", "reduced");
      } else {
        localStorage.removeItem("akshelf-motion");
        document.documentElement.removeAttribute("data-motion");
      }
    } catch {}
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        reduceTransparency,
        setReduceTransparency,
        reduceMotion,
        setReduceMotion,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
