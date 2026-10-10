"use client";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { useTheme } from "@/components/layout/theme-provider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth";
import { User, Palette, Database, Info } from "lucide-react";

export default function SettingsPage() {
  const {
    theme,
    setTheme,
    reduceTransparency,
    setReduceTransparency,
    reduceMotion,
    setReduceMotion,
  } = useTheme();

  return (
    <AppShell>
      <PageHeader
        title="Settings"
        subtitle="Manage your personal preferences, appearance, and data."
      />

      <div className="space-y-6 max-w-3xl">
        {/* Panel 1: Account */}
        <section className="glass-1 p-6 rounded-[20px] space-y-4">
          <div className="flex items-center gap-2.5 text-accent">
            <User className="h-5 w-5" aria-hidden="true" />
            <h2 className="text-lg font-bold font-display text-ink">Account</h2>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div>
              <p className="text-sm font-semibold text-ink">Owner Account</p>
              <p className="text-xs text-ink-muted">Single-owner private mode</p>
            </div>
            <form action={logoutAction}>
              <Button type="submit" variant="secondary" size="medium">
                Log out
              </Button>
            </form>
          </div>
        </section>

        {/* Panel 2: Appearance */}
        <section className="glass-1 p-6 rounded-[20px] space-y-6">
          <div className="flex items-center gap-2.5 text-accent">
            <Palette className="h-5 w-5" aria-hidden="true" />
            <h2 className="text-lg font-bold font-display text-ink">Appearance</h2>
          </div>

          {/* Theme selector */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-ink block">Theme</label>
            <div className="flex items-center gap-2">
              <Button
                variant={theme === "system" ? "primary" : "secondary"}
                size="medium"
                onClick={() => setTheme("system")}
              >
                System
              </Button>
              <Button
                variant={theme === "dark" ? "primary" : "secondary"}
                size="medium"
                onClick={() => setTheme("dark")}
              >
                Dark
              </Button>
              <Button
                variant={theme === "light" ? "primary" : "secondary"}
                size="medium"
                onClick={() => setTheme("light")}
              >
                Light
              </Button>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 dark:border-white/12 space-y-4">
            <Switch
              checked={reduceTransparency}
              onCheckedChange={setReduceTransparency}
              label="Reduce transparency"
              description="Replace frosted glass with solid opaque surfaces"
            />

            <Switch
              checked={reduceMotion}
              onCheckedChange={setReduceMotion}
              label="Reduce motion"
              description="Disable animated transforms, shimmers, and slide transitions"
            />
          </div>
        </section>

        {/* Panel 3: Data Safety */}
        <section className="glass-1 p-6 rounded-[20px] space-y-4">
          <div className="flex items-center gap-2.5 text-accent">
            <Database className="h-5 w-5" aria-hidden="true" />
            <h2 className="text-lg font-bold font-display text-ink">Your Data</h2>
          </div>
          <p className="text-sm text-ink-soft font-medium leading-relaxed">
            Your personal watch records, ratings, and episode progress are stored in PostgreSQL.
            Keep a copy outside AkShelf now and then.
          </p>
          <div>
            <Button variant="secondary" size="medium" disabled>
              Export data (Coming in Week 7)
            </Button>
          </div>
        </section>

        {/* Panel 4: About & Attributions */}
        <section className="glass-1 p-6 rounded-[20px] space-y-4">
          <div className="flex items-center gap-2.5 text-accent">
            <Info className="h-5 w-5" aria-hidden="true" />
            <h2 className="text-lg font-bold font-display text-ink">About & Data Sources</h2>
          </div>
          <div className="text-xs text-ink-muted font-medium space-y-2 leading-relaxed">
            <p>AkShelf Version 0.1.0 (Week 1)</p>
            <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
            <p>Anime data provided by the AniList GraphQL API.</p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
