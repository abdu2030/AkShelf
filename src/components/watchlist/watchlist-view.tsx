"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { MediaGrid } from "@/components/title/media-grid";
import { MediaCardProps } from "@/components/title/media-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Bookmark, Clapperboard, Layers, Sparkles, Tv, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { SortField, SortDirection, sortMediaItems } from "@/lib/utils/sort";
import { LibrarySort } from "@/components/library/library-sort";

export type MediaTypeFilter = "ALL" | "MOVIE" | "TV" | "ANIME";

export interface WatchlistViewProps {
  initialItems?: MediaCardProps[];
}

const mediaTypeOptions: Array<{
  value: MediaTypeFilter;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: "ALL", label: "All", icon: Layers },
  { value: "MOVIE", label: "Movies", icon: Clapperboard },
  { value: "TV", label: "TV Shows", icon: Tv },
  { value: "ANIME", label: "Anime", icon: Sparkles },
];

export function WatchlistView({ initialItems = [] }: WatchlistViewProps) {
  const [selectedType, setSelectedType] = useState<MediaTypeFilter>("ALL");
  const [sortField, setSortField] = useState<SortField>("RECENTLY_UPDATED");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const counts: Record<MediaTypeFilter, number> = {
    ALL: initialItems.length,
    MOVIE: initialItems.filter((i) => i.mediaType === "MOVIE").length,
    TV: initialItems.filter((i) => i.mediaType === "TV").length,
    ANIME: initialItems.filter((i) => i.mediaType === "ANIME").length,
  };

  const filteredItems = initialItems.filter((item) => {
    return selectedType === "ALL" || item.mediaType === selectedType;
  });

  const sortedItems = sortMediaItems(filteredItems, sortField, sortDirection);

  const displayTotal = initialItems.length;

  return (
    <AppShell>
      {/* 1. Page Header */}
      <header
        className={cn(
          "w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 md:p-6 mb-6",
          "glass-1 rounded-[20px] border border-white/10 dark:border-white/12 shadow-sm transition-all",
        )}
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-ink drop-shadow-sm">
              Watchlist
            </h1>
            {displayTotal > 0 && (
              <span
                data-testid="watchlist-total-count"
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent-fill/15 text-accent border border-accent/20"
              >
                {displayTotal} {displayTotal === 1 ? "title" : "titles"}
              </span>
            )}
          </div>
          <p className="text-sm md:text-base text-ink-soft font-medium mt-1 leading-relaxed">
            Titles you plan to watch next.
          </p>
        </div>
      </header>

      {/* 2. Main Content: Empty State or Filtered Grid */}
      {initialItems.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="w-8 h-8 text-accent" />}
          headline="Your watchlist is empty"
          body="When you find something for later, add it from search."
          actionLabel="Search titles"
          actionHref="/search"
        />
      ) : (
        <div className="space-y-6">
          {/* Controls bar: Type filter chips & Sorting dropdown */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 md:p-4 glass-1 rounded-2xl border border-white/10">
            {/* Type Filter Chips */}
            <div
              className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none"
              role="group"
              aria-label="Filter watchlist by media type"
            >
              {mediaTypeOptions.map((opt) => {
                const isSelected = selectedType === opt.value;
                const count = counts[opt.value];
                const Icon = opt.icon;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedType(opt.value)}
                    aria-pressed={isSelected}
                    className={cn(
                      "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer shrink-0",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      isSelected
                        ? "bg-accent text-white shadow-sm font-semibold"
                        : "glass-2 text-ink-soft hover:text-ink hover:bg-white/10 border border-white/5",
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{opt.label}</span>
                    <span
                      className={cn(
                        "ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                        isSelected ? "bg-black/20 text-white" : "bg-white/10 text-ink-muted",
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sorting Control */}
            <div className="shrink-0 flex items-center justify-end">
              <LibrarySort
                sortField={sortField}
                onSortFieldChange={setSortField}
                sortDirection={sortDirection}
                onSortDirectionChange={setSortDirection}
              />
            </div>
          </div>

          {/* Grid or Filter Empty State */}
          {sortedItems.length > 0 ? (
            <MediaGrid items={sortedItems} />
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center glass-1 rounded-[20px] border border-white/10 space-y-3">
              <Bookmark className="w-8 h-8 text-ink-muted" aria-hidden="true" />
              <h3 className="text-base font-bold font-display text-ink">
                No titles in this category
              </h3>
              <p className="text-xs text-ink-muted max-w-sm">
                You don&apos;t have any{" "}
                {selectedType === "MOVIE" ? "movies" : selectedType === "TV" ? "TV shows" : "anime"}{" "}
                in your watchlist yet.
              </p>
              <button
                type="button"
                onClick={() => setSelectedType("ALL")}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-ink transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Show all watchlist titles</span>
              </button>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
