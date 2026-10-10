"use client";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { TextField } from "@/components/ui/text-field";
import { Chip } from "@/components/ui/chip";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { useTheme } from "@/components/layout/theme-provider";
import { Search, Sparkles, Bookmark, Heart, SlidersHorizontal, Flame } from "lucide-react";
import { useState } from "react";

export default function DevComponentsGalleryPage() {
  const {
    resolvedTheme,
    setTheme,
    reduceTransparency,
    setReduceTransparency,
    reduceMotion,
    setReduceMotion,
  } = useTheme();

  const [switchState, setSwitchState] = useState(true);
  const [chipSelected, setChipSelected] = useState(false);

  return (
    <AppShell>
      <PageHeader
        title="Component Gallery"
        subtitle="Dev-only review tool for design tokens, states, glass levels, and fallbacks (Spec 18.7)."
      />

      {/* Quick Controls Toolbar */}
      <section className="glass-2 p-4 rounded-[16px] mb-8 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ink">Theme:</span>
          <Button
            size="small"
            variant={resolvedTheme === "dark" ? "primary" : "secondary"}
            onClick={() => setTheme("dark")}
          >
            Dark
          </Button>
          <Button
            size="small"
            variant={resolvedTheme === "light" ? "primary" : "secondary"}
            onClick={() => setTheme("light")}
          >
            Light
          </Button>
        </div>

        <div className="h-5 w-[1px] bg-white/10 hidden sm:block" />

        <div className="flex items-center gap-4">
          <Switch
            checked={reduceTransparency}
            onCheckedChange={setReduceTransparency}
            label="Reduced Transparency"
          />
          <Switch checked={reduceMotion} onCheckedChange={setReduceMotion} label="Reduced Motion" />
        </div>
      </section>

      <div className="space-y-12">
        {/* 1. Glass Levels & Inset */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold font-display text-ink">
            1. Glass Levels & Inset Surfaces (Spec 4 & 18.2)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-1 p-6 rounded-[20px] space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                Level 1: Base (.glass-1)
              </span>
              <p className="text-sm text-ink-soft font-medium">
                Cards, stat tiles, list rows, filter bar. Blur 16px.
              </p>
              <div className="glass-inset p-3 rounded-[14px] mt-4">
                <span className="text-xs text-ink-muted font-medium">
                  .glass-inset nested panel (zero extra blur)
                </span>
              </div>
            </div>

            <div className="glass-2 p-6 rounded-[20px] space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                Level 2: Raised (.glass-2)
              </span>
              <p className="text-sm text-ink-soft font-medium">
                Navigation bar, sidebar, sticky headers. Blur 24px.
              </p>
            </div>

            <div className="glass-3 p-6 rounded-[28px] space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                Level 3: Overlay (.glass-3)
              </span>
              <p className="text-sm text-ink-soft font-medium">
                Dialogs, bottom sheets, toasts, login card. Blur 32px.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Buttons */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold font-display text-ink">2. Buttons (Spec 9.2)</h2>
          <div className="glass-1 p-6 rounded-[20px] space-y-6">
            <div>
              <p className="text-xs font-semibold text-ink-muted mb-3">Variants</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-ink-muted mb-3">Sizes</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="large">Large (48px)</Button>
                <Button size="medium">Medium (40px)</Button>
                <Button size="small">Small (32px)</Button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-ink-muted mb-3">States</p>
              <div className="flex flex-wrap gap-3">
                <Button isLoading>Saving...</Button>
                <Button disabled>Disabled</Button>
                <Button pill>Pill Shape</Button>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Icon Buttons */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold font-display text-ink">3. Icon Buttons (Spec 9.3)</h2>
          <div className="glass-1 p-6 rounded-[20px] flex items-center gap-4">
            <IconButton aria-label="Search" variant="ghost">
              <Search />
            </IconButton>
            <IconButton aria-label="Sparkles" variant="glass">
              <Sparkles />
            </IconButton>
            <IconButton aria-label="Bookmark" variant="subtle">
              <Bookmark />
            </IconButton>
            <IconButton aria-label="Favorite" disabled>
              <Heart />
            </IconButton>
          </div>
        </section>

        {/* 4. Text Fields */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold font-display text-ink">4. Text Fields (Spec 9.4)</h2>
          <div className="glass-1 p-6 rounded-[20px] max-w-md space-y-4">
            <TextField
              label="Standard Field"
              placeholder="Enter something..."
              helperText="Helper description appears below."
            />
            <TextField
              label="With Icon"
              placeholder="Search anime..."
              startIcon={<Search className="h-4 w-4" />}
            />
            <TextField
              label="Error State"
              defaultValue="invalid@format"
              errorMessage="That email or password is not right."
            />
          </div>
        </section>

        {/* 5. Chips, Switches & Status Badges */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold font-display text-ink">
            5. Chips, Switches & Status Badges (Spec 5.4, 9.5, 9.6, 9.9)
          </h2>
          <div className="glass-1 p-6 rounded-[20px] space-y-6">
            <div>
              <p className="text-xs font-semibold text-ink-muted mb-3">Filter Chips</p>
              <div className="flex flex-wrap gap-2">
                <Chip
                  selected={chipSelected}
                  onClick={() => setChipSelected(!chipSelected)}
                  icon={<SlidersHorizontal />}
                >
                  Interactive Chip
                </Chip>
                <Chip selected>All</Chip>
                <Chip icon={<Flame />}>Popular</Chip>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-ink-muted mb-3">Switches</p>
              <div className="max-w-xs space-y-2">
                <Switch
                  checked={switchState}
                  onCheckedChange={setSwitchState}
                  label="Sample Switch"
                  description="Toggle active preference"
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-ink-muted mb-3">
                Status Badges (Solid Tinted, Never Glass)
              </p>
              <div className="flex flex-wrap gap-3 mb-4">
                <StatusBadge status="WATCHED" detail="9/10" />
                <StatusBadge status="WATCHING" detail="S2 E4" />
                <StatusBadge status="PLAN_TO_WATCH" />
                <StatusBadge status="ON_HOLD" />
                <StatusBadge status="DROPPED" />
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status="WATCHED" variant="dot" />
                <StatusBadge status="WATCHING" variant="dot" />
                <StatusBadge status="PLAN_TO_WATCH" variant="dot" />
                <StatusBadge status="ON_HOLD" variant="dot" />
                <StatusBadge status="DROPPED" variant="dot" />
              </div>
            </div>
          </div>
        </section>

        {/* 6. Skeletons */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold font-display text-ink">6. Skeletons (Spec 9.19)</h2>
          <div className="glass-1 p-6 rounded-[20px]">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl">
              <div className="space-y-2">
                <Skeleton aspectRatio="poster" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <div className="space-y-2">
                <Skeleton aspectRatio="poster" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        </section>

        {/* 7. Empty State */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold font-display text-ink">
            7. Empty State Component (Spec 8.5)
          </h2>
          <div className="glass-1 p-6 rounded-[20px]">
            <EmptyState
              icon={<Search />}
              headline="No titles found"
              body="Try searching for another keyword or check the spelling."
              actionLabel="Reset Search"
              onAction={() => alert("Action clicked")}
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
