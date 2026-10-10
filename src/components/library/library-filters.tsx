"use client";

import React from "react";
import {
  Layers,
  Clapperboard,
  Tv,
  Sparkles,
  RotateCcw,
  CheckCircle,
  PlayCircle,
  Bookmark,
  PauseCircle,
  MinusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { MediaType } from "@/components/title/media-card";
import { WatchStatusType, statusConfig } from "@/components/ui/status-badge";

export type MediaTypeFilter = "ALL" | MediaType;
export type StatusFilter = "ALL" | WatchStatusType;

export interface LibraryFilterCounts {
  byType?: Partial<Record<MediaTypeFilter, number>>;
  byStatus?: Partial<Record<StatusFilter, number>>;
  total?: number;
}

export interface LibraryFiltersProps {
  selectedType: MediaTypeFilter;
  onTypeChange: (type: MediaTypeFilter) => void;
  selectedStatus: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  counts?: LibraryFilterCounts;
  onResetFilters?: () => void;
  className?: string;
}

const mediaTypeOptions: Array<{
  value: MediaTypeFilter;
  label: string;
}> = [
  { value: "ALL", label: "All" },
  { value: "MOVIE", label: "Movies" },
  { value: "TV", label: "TV Shows" },
  { value: "ANIME", label: "Anime" },
];

const statusFilterOptions: Array<{
  value: StatusFilter;
  label: string;
}> = [
  { value: "ALL", label: "All" },
  { value: "WATCHING", label: "Watching" },
  { value: "WATCHED", label: "Watched" },
  { value: "PLAN_TO_WATCH", label: "Plan to Watch" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "DROPPED", label: "Dropped" },
];

function MediaTypeFilterIcon({ type, className }: { type: MediaTypeFilter; className?: string }) {
  switch (type) {
    case "ALL":
      return <Layers className={className} aria-hidden="true" />;
    case "MOVIE":
      return <Clapperboard className={className} aria-hidden="true" />;
    case "TV":
      return <Tv className={className} aria-hidden="true" />;
    case "ANIME":
      return <Sparkles className={className} aria-hidden="true" />;
    default:
      return <Layers className={className} aria-hidden="true" />;
  }
}

function StatusFilterIcon({ status, className }: { status: StatusFilter; className?: string }) {
  switch (status) {
    case "ALL":
      return null;
    case "WATCHED":
      return <CheckCircle className={className} aria-hidden="true" />;
    case "WATCHING":
      return <PlayCircle className={className} aria-hidden="true" />;
    case "PLAN_TO_WATCH":
      return <Bookmark className={className} aria-hidden="true" />;
    case "ON_HOLD":
      return <PauseCircle className={className} aria-hidden="true" />;
    case "DROPPED":
      return <MinusCircle className={className} aria-hidden="true" />;
    default:
      return null;
  }
}

/**
 * Filter bar for library view adhering to UI/UX Spec 2, 3.1 & 4.2:
 * - Media type chips: All, Movies, TV, Anime with respective icons and counts.
 * - Watch status pills: All, Watching, Watched, Plan to Watch, On Hold, Dropped.
 * - Solid tinted badge colors for active status filters.
 * - Reset button when active filter is applied.
 */
export function LibraryFilters({
  selectedType,
  onTypeChange,
  selectedStatus,
  onStatusChange,
  counts,
  onResetFilters,
  className,
}: LibraryFiltersProps) {
  const isFiltered = selectedType !== "ALL" || selectedStatus !== "ALL";

  const handleReset = () => {
    if (onResetFilters) {
      onResetFilters();
    } else {
      onTypeChange("ALL");
      onStatusChange("ALL");
    }
  };

  return (
    <div
      data-testid="library-filters"
      className={cn(
        "glass-1 p-4 md:p-5 rounded-[20px] border border-white/10 dark:border-white/12 space-y-3.5 mb-6 shadow-sm",
        className,
      )}
    >
      {/* Top Row: Media Type Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Filter by media type"
          className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none"
        >
          {mediaTypeOptions.map((opt) => {
            const isSelected = selectedType === opt.value;
            const count = counts?.byType?.[opt.value];

            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={isSelected}
                data-testid={`filter-type-${opt.value.toLowerCase()}`}
                onClick={() => onTypeChange(opt.value)}
                className={cn(
                  "inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-xs font-semibold transition-all select-none cursor-pointer whitespace-nowrap",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
                  "active:scale-95",
                  isSelected
                    ? "bg-accent-fill text-white shadow-sm border border-white/20"
                    : "glass-1 text-ink-soft hover:text-ink hover:glass-2 border border-white/10 hover:border-white/16",
                )}
              >
                <MediaTypeFilterIcon type={opt.value} className="h-3.5 w-3.5 shrink-0" />
                <span>{opt.label}</span>
                {count !== undefined ? (
                  <span
                    className={cn(
                      "text-[11px] font-mono px-1.5 py-0.2 rounded-full",
                      isSelected ? "bg-white/20 text-white" : "bg-white/6 text-ink-muted",
                    )}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Reset Filter Button */}
        {isFiltered ? (
          <button
            type="button"
            onClick={handleReset}
            aria-label="Reset all filters"
            data-testid="filter-reset-button"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-ink transition-colors px-2.5 py-1.5 rounded-md hover:bg-white/6 active:scale-95"
          >
            <RotateCcw className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span>Reset filters</span>
          </button>
        ) : null}
      </div>

      {/* Bottom Row: Watch Status Pills */}
      <div
        role="group"
        aria-label="Filter by watch status"
        className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none pt-1 border-t border-white/6"
      >
        {statusFilterOptions.map((opt) => {
          const isSelected = selectedStatus === opt.value;
          const count = counts?.byStatus?.[opt.value];
          const isAll = opt.value === "ALL";
          const config = !isAll ? statusConfig[opt.value as WatchStatusType] : null;

          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={isSelected}
              data-testid={`filter-status-${opt.value.toLowerCase()}`}
              onClick={() => onStatusChange(opt.value)}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold transition-all select-none cursor-pointer whitespace-nowrap",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
                "active:scale-95",
                isAll
                  ? isSelected
                    ? "bg-accent-fill text-white shadow-sm border border-white/20"
                    : "bg-white/4 hover:bg-white/8 text-ink-muted hover:text-ink border border-white/8"
                  : isSelected && config
                    ? cn(config.badgeClass, "shadow-sm")
                    : "bg-white/4 hover:bg-white/8 text-ink-muted hover:text-ink border border-white/8",
              )}
            >
              {!isAll && (
                <StatusFilterIcon
                  status={opt.value}
                  className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "" : config?.dotClass)}
                />
              )}
              <span>{opt.label}</span>
              {count !== undefined ? (
                <span
                  className={cn(
                    "text-[10px] font-mono px-1 rounded-full",
                    isSelected ? "bg-black/20" : "bg-white/6 text-ink-muted",
                  )}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
