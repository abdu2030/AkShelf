"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Library,
  Bookmark,
  History,
  Settings,
  LogOut,
  Film,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useTheme } from "./theme-provider";
import { logoutAction } from "@/actions/auth";

interface NavItem {
  label: string;
  shortLabel: string;
  href: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
}

const navItems: NavItem[] = [
  { label: "Home", shortLabel: "Home", href: "/", icon: LayoutDashboard },
  { label: "Search", shortLabel: "Search", href: "/search", icon: Search },
  { label: "My Library", shortLabel: "Library", href: "/library", icon: Library },
  { label: "Watchlist", shortLabel: "Watchlist", href: "/watchlist", icon: Bookmark },
  { label: "History", shortLabel: "History", href: "/history", icon: History },
  { label: "Settings", shortLabel: "Settings", href: "/settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const isCurrent = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative">
      {/* 1. Desktop Sidebar (lg and up: >= 1024px) */}
      <aside className="hidden lg:flex fixed top-3 bottom-3 left-3 w-60 z-20 flex-col glass-2 rounded-[20px] p-4 select-none">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-3 mb-4">
          <div className="h-9 w-9 rounded-xl bg-accent-fill flex items-center justify-center text-white shadow-md">
            <Film className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <span className="font-display font-bold text-lg text-ink tracking-tight">AkShelf</span>
            <span className="block text-[11px] text-ink-muted -mt-1 font-medium">
              Watch Tracker
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav aria-label="Main" className="flex-1 space-y-1">
          {navItems.map((item) => {
            const active = isCurrent(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3.5 h-11 px-3.5 rounded-[12px] text-sm font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  active
                    ? "bg-white/10 dark:bg-white/10 text-accent border border-white/10"
                    : "text-ink-soft hover:text-ink hover:bg-white/6 dark:hover:bg-white/6",
                )}
              >
                <Icon
                  className={cn("h-5 w-5 shrink-0", active ? "text-accent" : "text-ink-soft")}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Bar: Theme toggle & Logout */}
        <div className="pt-3 border-t border-white/8 space-y-1">
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="flex items-center gap-3.5 w-full h-10 px-3.5 rounded-[12px] text-xs font-semibold text-ink-soft hover:text-ink hover:bg-white/6 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-400" aria-hidden="true" />
            )}
            <span>
              Theme: {theme === "system" ? "System" : resolvedTheme === "dark" ? "Dark" : "Light"}
            </span>
          </button>

          <form action={logoutAction} className="w-full">
            <button
              type="submit"
              className="flex items-center gap-3.5 w-full h-10 px-3.5 rounded-[12px] text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Log out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* 2. Tablet Rail (md: 768px - 1023px) */}
      <aside className="hidden md:flex lg:hidden fixed top-3 bottom-3 left-3 w-[72px] z-20 flex-col items-center glass-2 rounded-[20px] py-4 select-none">
        <div className="h-10 w-10 rounded-xl bg-accent-fill flex items-center justify-center text-white shadow-md mb-6">
          <Film className="h-5 w-5" aria-hidden="true" />
        </div>

        <nav aria-label="Main" className="flex-1 flex flex-col items-center gap-2">
          {navItems.map((item) => {
            const active = isCurrent(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={item.label}
                className={cn(
                  "relative flex items-center justify-center h-12 w-12 rounded-[14px] transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  active
                    ? "bg-white/10 text-accent"
                    : "text-ink-soft hover:text-ink hover:bg-white/6",
                )}
              >
                {active && (
                  <span
                    className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r bg-accent"
                    aria-hidden="true"
                  />
                )}
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-3 border-t border-white/8 flex flex-col items-center gap-2">
          <button
            type="button"
            title="Toggle theme"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="h-10 w-10 rounded-[12px] flex items-center justify-center text-ink-soft hover:text-ink hover:bg-white/6 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-400" aria-hidden="true" />
            )}
            <span className="sr-only">Toggle theme</span>
          </button>

          <form action={logoutAction}>
            <button
              type="submit"
              title="Log out"
              className="h-10 w-10 rounded-[12px] flex items-center justify-center text-red-400 hover:bg-red-500/10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Log out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* 3. Mobile Header (below md: < 768px) with Settings Gear icon */}
      <header className="md:hidden sticky top-0 z-20 w-full glass-2 border-b border-white/8 px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-accent-fill flex items-center justify-center text-white">
            <Film className="h-4 w-4" aria-hidden="true" />
          </div>
          <span className="font-display font-bold text-base text-ink">AkShelf</span>
        </Link>

        <Link
          href="/settings"
          title="Settings"
          aria-label="Settings"
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center text-ink-soft hover:text-ink transition-colors",
            pathname.startsWith("/settings") && "text-accent bg-white/10",
          )}
        >
          <Settings className="h-5 w-5" aria-hidden="true" />
        </Link>
      </header>

      {/* 4. Main Viewport Content Area */}
      <main
        id="main-content"
        className={cn(
          "flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-6",
          "md:pl-[96px] lg:pl-[272px]", // Offset for tablet rail (72px + gap) & desktop sidebar (240px + gap)
          "pb-24 md:pb-12", // Safe padding on mobile so bottom navigation never overlaps content
        )}
      >
        {children}
      </main>

      {/* 5. Mobile Bottom Bar (below md: < 768px) - 5 primary items */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-20 h-16 glass-2 rounded-t-[16px] border-t border-white/12 px-2 flex items-center justify-around select-none pb-[env(safe-area-inset-bottom)]"
      >
        {navItems.slice(0, 5).map((item) => {
          const active = isCurrent(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center min-w-[56px] py-1 text-center transition-all",
                active ? "text-accent font-semibold" : "text-ink-soft",
              )}
            >
              <div
                className={cn(
                  "relative flex items-center justify-center h-7 w-10 rounded-full transition-all",
                  active && "bg-white/14 dark:bg-white/14",
                )}
              >
                <Icon
                  className={cn("h-5 w-5", active ? "text-accent" : "text-ink-soft")}
                  aria-hidden="true"
                />
              </div>
              <span className="text-[11px] leading-tight mt-0.5">{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
