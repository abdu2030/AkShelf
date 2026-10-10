"use client";

import React from "react";
import Link from "next/link";
import {
  Library,
  FilterX,
  RotateCcw,
  Clapperboard,
  Tv,
  Sparkles,
  Bookmark,
  PlayCircle,
  CheckCircle,
  PauseCircle,
  MinusCircle,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { MediaTypeFilter, StatusFilter } from "./library-filters";

export interface LibraryEmptyStateProps {
  hasAnyItems: boolean;
  selectedType: MediaTypeFilter;
  selectedStatus: StatusFilter;
  onResetFilters?: () => void;
  onClearTypeFilter?: () => void;
  onClearStatusFilter?: () => void;
  className?: string;
}

const typePluralLabels: Record<MediaTypeFilter, string> = {
  ALL: "titles",
  MOVIE: "movies",
  TV: "TV shows",
  ANIME: "anime",
};

const typeSingularLabels: Record<MediaTypeFilter, string> = {
  ALL: "title",
  MOVIE: "movie",
  TV: "TV show",
  ANIME: "anime",
};

const statusDisplayLabels: Record<StatusFilter, string> = {
  ALL: "",
  WATCHING: "Watching",
  WATCHED: "Watched",
  PLAN_TO_WATCH: "Plan to Watch",
  ON_HOLD: "On Hold",
  DROPPED: "Dropped",
};

const statusAdjectiveLabels: Record<StatusFilter, string> = {
  ALL: "",
  WATCHING: "currently watching",
  WATCHED: "watched",
  PLAN_TO_WATCH: "plan to watch",
  ON_HOLD: "on hold",
  DROPPED: "dropped",
};

export function getFilterEmptyStateText(
  selectedType: MediaTypeFilter,
  selectedStatus: StatusFilter,
): { headline: string; body: string } {
  const isTypeFiltered = selectedType !== "ALL";
  const isStatusFiltered = selectedStatus !== "ALL";

  if (isTypeFiltered && isStatusFiltered) {
    const statusAdj = statusAdjectiveLabels[selectedStatus];
    const typePlural = typePluralLabels[selectedType];
    const typeSingular = typeSingularLabels[selectedType];
    const statusName = statusDisplayLabels[selectedStatus];

    return {
      headline: `No ${statusAdj} ${typePlural}`,
      body: `You don't have any ${typeSingular} titles marked as "${statusName}" on your shelf.`,
    };
  }

  if (isTypeFiltered && !isStatusFiltered) {
    const typePlural = typePluralLabels[selectedType];
    return {
      headline: `No ${typePlural} on your shelf`,
      body: `You haven't tracked any ${typePlural} yet. Search to add some to your library.`,
    };
  }

  if (!isTypeFiltered && isStatusFiltered) {
    const statusAdj = statusAdjectiveLabels[selectedStatus];
    const statusName = statusDisplayLabels[selectedStatus];
    return {
      headline: `No titles ${statusAdj}`,
      body: `You don't have any titles marked as "${statusName}" in your library.`,
    };
  }

  return {
    headline: "No matching titles found",
    body: "There are no titles on your shelf matching the active filters.",
  };
}

function EmptyStateContextIcon({
  selectedType,
  selectedStatus,
}: {
  selectedType: MediaTypeFilter;
  selectedStatus: StatusFilter;
}) {
  if (selectedType === "MOVIE") {
    return <Clapperboard className="h-10 w-10 text-accent" aria-hidden="true" />;
  }
  if (selectedType === "TV") {
    return <Tv className="h-10 w-10 text-accent" aria-hidden="true" />;
  }
  if (selectedType === "ANIME") {
    return <Sparkles className="h-10 w-10 text-accent" aria-hidden="true" />;
  }
  if (selectedStatus === "WATCHING") {
    return <PlayCircle className="h-10 w-10 text-accent" aria-hidden="true" />;
  }
  if (selectedStatus === "WATCHED") {
    return <CheckCircle className="h-10 w-10 text-accent" aria-hidden="true" />;
  }
  if (selectedStatus === "PLAN_TO_WATCH") {
    return <Bookmark className="h-10 w-10 text-accent" aria-hidden="true" />;
  }
  if (selectedStatus === "ON_HOLD") {
    return <PauseCircle className="h-10 w-10 text-accent" aria-hidden="true" />;
  }
  if (selectedStatus === "DROPPED") {
    return <MinusCircle className="h-10 w-10 text-accent" aria-hidden="true" />;
  }
  return <FilterX className="h-10 w-10 text-accent" aria-hidden="true" />;
}

/**
 * Empty state component with dynamic messaging and quick-action flows (Day 12).
 * Adheres to UI/UX Spec 8.5 & 3.1:
 * - 96px glass-2 circle with faint indigo glow
 * - High-contrast text-ink and text-ink-soft typography
 * - Responsive quick-action flows (Reset all filters, clear granular filters, search catalog)
 */
export function LibraryEmptyState({
  hasAnyItems,
  selectedType,
  selectedStatus,
  onResetFilters,
  onClearTypeFilter,
  onClearStatusFilter,
  className,
}: LibraryEmptyStateProps) {
  // Scenario 1: Library is completely empty
  if (!hasAnyItems) {
    return (
      <div
        data-testid="library-empty-state"
        data-empty-type="empty-library"
        className={cn(
          "flex flex-col items-center justify-center text-center py-12 md:py-16 px-6 max-w-lg mx-auto select-none",
          "glass-1 rounded-[24px] border border-white/10 dark:border-white/12 shadow-sm my-4 md:my-8 transition-all",
          className,
        )}
      >
        <div className="relative mb-6 flex items-center justify-center">
          <div className="h-24 w-24 rounded-full glass-2 flex items-center justify-center shadow-[0_0_24px_rgba(99,102,241,0.22)] border border-white/16 text-accent">
            <Library className="h-10 w-10 text-accent" aria-hidden="true" />
          </div>
        </div>

        <h3 className="text-lg md:text-xl font-bold font-display text-ink tracking-tight mb-2 drop-shadow-sm">
          Nothing on your shelf yet
        </h3>

        <p className="text-sm md:text-base text-ink-soft font-medium leading-relaxed mb-6 max-w-sm">
          Titles you track will show up here. Search movies, TV shows, and anime to start building
          your personal library.
        </p>

        <Link href="/search" className="inline-block">
          <Button
            variant="primary"
            size="large"
            data-testid="empty-search-button"
            className="gap-2"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span>Search titles</span>
          </Button>
        </Link>
      </div>
    );
  }

  // Scenario 2: Active filters resulted in 0 matches
  const { headline, body } = getFilterEmptyStateText(selectedType, selectedStatus);
  const isTypeFiltered = selectedType !== "ALL";
  const isStatusFiltered = selectedStatus !== "ALL";
  const searchUrl =
    selectedType !== "ALL" ? `/search?type=${selectedType.toLowerCase()}` : "/search";

  return (
    <div
      data-testid="library-empty-state"
      data-empty-type="empty-filter"
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 md:py-16 px-6 max-w-lg mx-auto select-none",
        "glass-1 rounded-[24px] border border-white/10 dark:border-white/12 shadow-sm my-4 md:my-8 transition-all",
        className,
      )}
    >
      <div className="relative mb-6 flex items-center justify-center">
        <div className="h-24 w-24 rounded-full glass-2 flex items-center justify-center shadow-[0_0_24px_rgba(99,102,241,0.22)] border border-white/16 text-accent">
          <EmptyStateContextIcon selectedType={selectedType} selectedStatus={selectedStatus} />
        </div>
      </div>

      <h3
        data-testid="empty-headline"
        className="text-lg md:text-xl font-bold font-display text-ink tracking-tight mb-2 drop-shadow-sm capitalize"
      >
        {headline}
      </h3>

      <p
        data-testid="empty-body"
        className="text-sm md:text-base text-ink-soft font-medium leading-relaxed mb-6 max-w-md"
      >
        {body}
      </p>

      {/* Quick-Action Flows */}
      <div className="flex flex-col items-center gap-3 w-full max-w-xs sm:max-w-sm">
        {/* Primary Action: Reset All Filters */}
        {onResetFilters && (
          <Button
            variant="primary"
            size="medium"
            onClick={onResetFilters}
            data-testid="empty-reset-all-button"
            className="w-full gap-2"
          >
            <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Reset all filters</span>
          </Button>
        )}

        {/* Granular Quick-Action Buttons (when both type and status filters are set) */}
        {isTypeFiltered && isStatusFiltered && (
          <div className="flex flex-wrap items-center justify-center gap-2 w-full pt-1">
            {onClearStatusFilter && (
              <Button
                variant="secondary"
                size="small"
                onClick={onClearStatusFilter}
                data-testid="empty-clear-status-button"
                className="text-xs"
              >
                Show all {typePluralLabels[selectedType]}
              </Button>
            )}

            {onClearTypeFilter && (
              <Button
                variant="secondary"
                size="small"
                onClick={onClearTypeFilter}
                data-testid="empty-clear-type-button"
                className="text-xs"
              >
                Show all {statusAdjectiveLabels[selectedStatus]}
              </Button>
            )}
          </div>
        )}

        {/* Discovery Action: Search Catalog */}
        <Link href={searchUrl} className="mt-1">
          <Button
            variant="ghost"
            size="small"
            data-testid="empty-search-link-button"
            className="gap-1.5 text-accent hover:text-ink text-xs"
          >
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Search {isTypeFiltered ? typePluralLabels[selectedType] : "titles"} to add</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
