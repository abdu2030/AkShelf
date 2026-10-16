"use client";

import React, { useRef } from "react";
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
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  if (!seasons || seasons.length <= 1) {
    return null;
  }

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      nextIndex = (index + 1) % seasons.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      nextIndex = (index - 1 + seasons.length) % seasons.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      nextIndex = seasons.length - 1;
    }

    if (nextIndex !== null) {
      const nextSeason = seasons[nextIndex];
      onSelectSeason(nextSeason.seasonNumber);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Season selection"
      className={cn(
        "flex items-center gap-2 overflow-x-auto pb-2 pt-1 -mx-1 px-1 snap-x scrollbar-none",
        className,
      )}
    >
      {seasons.map((season, index) => {
        const isSelected = season.seasonNumber === selectedSeason;
        const seasonLabel = season.seasonNumber === 0 ? "Specials" : `S${season.seasonNumber}`;
        const hasCount = season.watchedCount != null;

        return (
          <button
            key={season.seasonNumber}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelectSeason(season.seasonNumber)}
            onKeyDown={(e) => handleKeyDown(e, index)}
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
