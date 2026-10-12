import React from "react";
import { cn } from "@/lib/utils/cn";

export interface SeasonSelectorItem {
  seasonNumber: number;
  name?: string;
  episodeCount: number;
  watchedCount?: number;
}

export interface SeasonSelectorProps {
  seasons: SeasonSelectorItem[];
  selectedSeason: number;
  onSelectSeason: (seasonNumber: number) => void;
  className?: string;
}

/**
 * SeasonSelector implements UI spec section 9.14:
 * Horizontally scrolling row of pills labelled 'S1', 'S2', etc.,
 * each with a tiny watched count indicator (e.g. "12/24").
 */
export function SeasonSelector({
  seasons,
  selectedSeason,
  onSelectSeason,
  className,
}: SeasonSelectorProps) {
  if (!seasons || seasons.length <= 1) {
    return null;
  }

  return (
    <div
      role="tablist"
      aria-label="Season selection"
      className={cn(
        "flex items-center gap-2 overflow-x-auto pb-2 pt-1 -mx-1 px-1 snap-x scrollbar-none",
        className,
      )}
    >
      {seasons.map((season) => {
        const isSelected = season.seasonNumber === selectedSeason;
        const seasonLabel = season.seasonNumber === 0 ? "Specials" : `S${season.seasonNumber}`;
        const hasCount = season.watchedCount != null;

        return (
          <button
            key={season.seasonNumber}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelectSeason(season.seasonNumber)}
            className={cn(
              "snap-start shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
              isSelected
                ? "bg-accent text-white shadow-[0_2px_12px_rgba(99,102,241,0.35)] border border-accent/40 font-bold"
                : "glass-2 text-ink-muted hover:text-ink hover:bg-white/10 border border-white/10",
            )}
          >
            <span>{seasonLabel}</span>
            {hasCount ? (
              <span
                className={cn(
                  "font-mono text-[10px] px-1.5 py-0.5 rounded-full transition-colors",
                  isSelected ? "bg-white/20 text-white" : "bg-surface-elevated text-ink-muted",
                )}
              >
                {season.watchedCount}/{season.episodeCount}
              </span>
            ) : (
              <span
                className={cn(
                  "font-mono text-[10px] px-1.5 py-0.5 rounded-full",
                  isSelected ? "bg-white/20 text-white" : "bg-surface-elevated text-ink-muted",
                )}
              >
                {season.episodeCount} eps
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
