"use client";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { useTheme } from "@/components/layout/theme-provider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { User, Palette, Database, Info } from "lucide-react";

export default function SettingsPage() {
  const {
    theme,
    setTheme,
    reduceTransparency,
    setReduceTransparency,
    reduceMotion,
    setReduceMotion,
    mounted,
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

          <ChangePasswordForm />
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
                variant={mounted ? (theme === "system" ? "primary" : "secondary") : "primary"}
                size="medium"
                onClick={() => setTheme("system")}
              >
                System
              </Button>
              <Button
                variant={mounted && theme === "dark" ? "primary" : "secondary"}
                size="medium"
                onClick={() => setTheme("dark")}
              >
                Dark
              </Button>
              <Button
                variant={mounted && theme === "light" ? "primary" : "secondary"}
                size="medium"
                onClick={() => setTheme("light")}
              >
                Light
              </Button>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 dark:border-white/12 space-y-4">
            <Switch
              checked={mounted ? reduceTransparency : false}
              onCheckedChange={setReduceTransparency}
              label="Reduce transparency"
              description="Replace frosted glass with solid opaque surfaces"
            />

            <Switch
              checked={mounted ? reduceMotion : false}
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
            <h2 className="text-lg font-bold font-display text-ink">Your Data & Backups</h2>
          </div>
          <p className="text-sm text-ink-soft font-medium leading-relaxed">
            Your personal watch records, ratings, and episode progress are stored in your database.
            Keep an offline copy outside AkShelf anytime for full data ownership.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href="/api/export/json"
              download
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold glass-1 hover:glass-2 border border-white/12 text-ink-base transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Database className="w-4 h-4 text-accent" aria-hidden="true" />
              <span>Export JSON (Full Backup)</span>
            </a>

            <a
              href="/api/export/csv"
              download
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold glass-1 hover:glass-2 border border-white/12 text-ink-base transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Info className="w-4 h-4 text-accent" aria-hidden="true" />
              <span>Export CSV (Spreadsheet)</span>
            </a>
          </div>

          <p className="text-[11px] text-ink-muted">
            <strong>JSON</strong> includes full title metadata, episode progress, and audit history.{" "}
            <strong>CSV</strong> contains your shelf titles, status, ratings, and dates for Excel or
            Google Sheets.
          </p>
        </section>

        {/* Panel 4: About & Attributions */}
        <section className="glass-1 p-6 rounded-[20px] space-y-4">
          <div className="flex items-center gap-2.5 text-accent">
            <Info className="h-5 w-5" aria-hidden="true" />
            <h2 className="text-lg font-bold font-display text-ink">About & Data Sources</h2>
          </div>
          <div className="text-xs text-ink-muted font-medium space-y-2 leading-relaxed">
            <p>AkShelf Version 1.0.0 (Production Release)</p>
            <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
            <p>Anime data provided by the AniList GraphQL API.</p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
