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
import { MediaCard, MediaCardSkeleton } from "@/components/title/media-card";
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
    mounted,
  } = useTheme();

  const [switchState, setSwitchState] = useState(true);
  const [chipSelected, setChipSelected] = useState(false);
  const [quickActionMessage, setQuickActionMessage] = useState<string | null>(null);

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
            variant={mounted && resolvedTheme === "light" ? "secondary" : "primary"}
            onClick={() => setTheme("dark")}
          >
            Dark
          </Button>
          <Button
            size="small"
            variant={mounted && resolvedTheme === "light" ? "primary" : "secondary"}
            onClick={() => setTheme("light")}
          >
            Light
          </Button>
        </div>

        <div className="h-5 w-[1px] bg-white/10 hidden sm:block" />

        <div className="flex items-center gap-4">
          <Switch
            checked={mounted ? reduceTransparency : false}
            onCheckedChange={setReduceTransparency}
            label="Reduced Transparency"
          />
          <Switch
            checked={mounted ? reduceMotion : false}
            onCheckedChange={setReduceMotion}
            label="Reduced Motion"
          />
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

        {/* 8. Media Card Component */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-display text-ink">
              8. Media Card Component (Spec 9.10, 8.2, 8.4)
            </h2>
            {quickActionMessage && (
              <span className="text-xs font-semibold text-accent">{quickActionMessage}</span>
            )}
          </div>
          <p className="text-xs text-ink-muted">
            2:3 aspect ratio, radius-lg (16px), 1px border. Never glass container. Features status
            dot badge, 44px hit-target quick action button, rating chip, 4px progress bar, and
            missing poster fallback.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {/* Movie: Watched + Rated */}
            <MediaCard
              id="m1"
              title="Inception"
              mediaType="MOVIE"
              year={2010}
              posterUrl="https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg"
              status="WATCHED"
              rating={9.0}
              onQuickAction={() => setQuickActionMessage("Quick action triggered for Inception")}
            />

            {/* TV Show: Watching + Progress Bar */}
            <MediaCard
              id="t1"
              title="Severance"
              mediaType="TV"
              year={2022}
              posterUrl="https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wGeW.jpg"
              status="WATCHING"
              season={1}
              episode={7}
              currentEpisode={7}
              totalEpisodes={9}
              onQuickAction={() => setQuickActionMessage("Quick action triggered for Severance")}
            />

            {/* Anime: Plan to Watch */}
            <MediaCard
              id="a1"
              title="Frieren: Beyond Journey's End"
              mediaType="ANIME"
              year={2023}
              posterUrl="https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-n2b4b4b4.jpg"
              status="PLAN_TO_WATCH"
              onQuickAction={() => setQuickActionMessage("Quick action triggered for Frieren")}
            />

            {/* Missing Poster Fallback (Spec 8.4) */}
            <MediaCard
              id="f1"
              title="Princess Mononoke (Missing Poster Demo)"
              mediaType="ANIME"
              year={1997}
              posterUrl={null}
              status="ON_HOLD"
              rating={8.8}
              onQuickAction={() => setQuickActionMessage("Quick action triggered for Mononoke")}
            />

            {/* Skeleton state */}
            <div className="flex flex-col">
              <MediaCardSkeleton />
              <span className="text-[11px] text-ink-muted text-center mt-2">Loading Skeleton</span>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
