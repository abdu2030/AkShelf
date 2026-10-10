"use client";

import React, { createContext, useContext, useRef, useSyncExternalStore } from "react";
import { useServerInsertedHTML } from "next/navigation";

export type ThemeChoice = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

export interface ThemeContextType {
  theme: ThemeChoice;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeChoice) => void;
  reduceTransparency: boolean;
  setReduceTransparency: (value: boolean) => void;
  reduceMotion: boolean;
  setReduceMotion: (value: boolean) => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_INIT_SCRIPT = `(function() {
  try {
    var storedTheme = localStorage.getItem('akshelf-theme') || 'system';
    var resolvedTheme = storedTheme;
    if (storedTheme === 'system') {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', resolvedTheme);

    var storedTransparency = localStorage.getItem('akshelf-transparency');
    if (storedTransparency === 'reduced') {
      document.documentElement.setAttribute('data-transparency', 'reduced');
    } else {
      document.documentElement.removeAttribute('data-transparency');
    }

    var storedMotion = localStorage.getItem('akshelf-motion');
    if (storedMotion === 'reduced') {
      document.documentElement.setAttribute('data-motion', 'reduced');
    } else {
      document.documentElement.removeAttribute('data-motion');
    }
  } catch (e) {}
})();`;

export function ThemeScript() {
  const isInserted = useRef(false);

  useServerInsertedHTML(() => {
    if (isInserted.current) return null;
    isInserted.current = true;
    return (
      <script
        key="akshelf-theme-init"
        dangerouslySetInnerHTML={{
          __html: THEME_INIT_SCRIPT,
        }}
      />
    );
  });

  return null;
}

// Store listeners for syncing external browser events (storage, matchMedia, custom mutations)
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  if (typeof window === "undefined") {
    return () => {
      listeners.delete(callback);
    };
  }

  window.addEventListener("storage", callback);
  const mql = window.matchMedia("(prefers-color-scheme: light)");
  mql.addEventListener("change", callback);

  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
    mql.removeEventListener("change", callback);
  };
}

function getThemeSnapshot(): ThemeChoice {
  try {
    const val = localStorage.getItem("akshelf-theme");
    if (val === "dark" || val === "light" || val === "system") {
      return val;
    }
    return "system";
  } catch {
    return "system";
  }
}

function getThemeServerSnapshot(): ThemeChoice {
  return "system";
}

function getResolvedThemeSnapshot(): ResolvedTheme {
  try {
    const val = localStorage.getItem("akshelf-theme");
    if (val === "light") return "light";
    if (val === "dark") return "dark";
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function getResolvedThemeServerSnapshot(): ResolvedTheme {
  return "dark";
}

function getTransparencySnapshot(): boolean {
  try {
    return localStorage.getItem("akshelf-transparency") === "reduced";
  } catch {
    return false;
  }
}

function getTransparencyServerSnapshot(): boolean {
  return false;
}

function getMotionSnapshot(): boolean {
  try {
    return localStorage.getItem("akshelf-motion") === "reduced";
  } catch {
    return false;
  }
}

function getMotionServerSnapshot(): boolean {
  return false;
}

function getMountedSnapshot(): boolean {
  return true;
}

function getMountedServerSnapshot(): boolean {
  return false;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, getThemeServerSnapshot);
  const resolvedTheme = useSyncExternalStore(
    subscribe,
    getResolvedThemeSnapshot,
    getResolvedThemeServerSnapshot,
  );
  const reduceTransparency = useSyncExternalStore(
    subscribe,
    getTransparencySnapshot,
    getTransparencyServerSnapshot,
  );
  const reduceMotion = useSyncExternalStore(subscribe, getMotionSnapshot, getMotionServerSnapshot);
  const mounted = useSyncExternalStore(subscribe, getMountedSnapshot, getMountedServerSnapshot);

  const setTheme = (choice: ThemeChoice) => {
    try {
      localStorage.setItem("akshelf-theme", choice);
      const isLight =
        choice === "light" ||
        (choice === "system" && window.matchMedia("(prefers-color-scheme: light)").matches);
      const resolved: ResolvedTheme = isLight ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", resolved);
      notify();
    } catch {}
  };

  const setReduceTransparency = (enabled: boolean) => {
    try {
      if (enabled) {
        localStorage.setItem("akshelf-transparency", "reduced");
        document.documentElement.setAttribute("data-transparency", "reduced");
      } else {
        localStorage.removeItem("akshelf-transparency");
        document.documentElement.removeAttribute("data-transparency");
      }
      notify();
    } catch {}
  };

  const setReduceMotion = (enabled: boolean) => {
    try {
      if (enabled) {
        localStorage.setItem("akshelf-motion", "reduced");
        document.documentElement.setAttribute("data-motion", "reduced");
      } else {
        localStorage.removeItem("akshelf-motion");
        document.documentElement.removeAttribute("data-motion");
      }
      notify();
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
        mounted,
      }}
    >
      <ThemeScript />
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
