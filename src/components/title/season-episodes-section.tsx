"use client";

import React, { useState, useMemo } from "react";
import { CheckCheck, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SeasonSelector } from "./season-selector";
import { EpisodeRow } from "./episode-row";
import { Button } from "@/components/ui/button";
import { batchSeasonProgressAction, toggleEpisodeProgressAction } from "@/actions/tracking";

export interface EpisodeItem {
  episodeNumber: number;
  seasonNumber?: number;
  name: string;
  airDate?: string | null;
  runtime?: number | null;
  overview?: string | null;
  isAired?: boolean;
}

export interface SeasonItem {
  seasonNumber: number;
  name?: string;
  episodeCount: number;
  episodes?: EpisodeItem[];
}

export interface SeasonEpisodesSectionProps {
  seasons: SeasonItem[];
  userCurrentSeason?: number | null;
  userCurrentEpisode?: number | null;
  titleExternalSource?: "tmdb" | "anilist";
  titleExternalId?: string;
  titleName?: string;
  mediaType?: "MOVIE" | "TV" | "ANIME";
  onEpisodeToggle?: (seasonNumber: number, episodeNumber: number, watched: boolean) => void;
  className?: string;
}

/**
 * SeasonEpisodesSection implements UI spec section 9.14 & page 38:
 * - Season selector pill tabs with watched indicators
 * - Season progress bar with watched counts and percentage
 * - Primary 'Continue S{x} E{y}' action button
 * - Batch 'Mark Season Watched' / 'Mark Season Unwatched' actions
 * - Interactive list of EpisodeRows with next-up indicator
 */
export function SeasonEpisodesSection({
  seasons,
  userCurrentSeason,
  userCurrentEpisode,
  titleExternalSource,
  titleExternalId,
  titleName,
  mediaType,
  onEpisodeToggle,
  className,
}: SeasonEpisodesSectionProps) {
  // Determine default selected season:
  // "The current season opens by default; if the user is mid-series it opens on the season of the next unwatched episode."
  const defaultSeasonNumber = useMemo(() => {
    if (!seasons || seasons.length === 0) return 1;
    if (userCurrentSeason != null && seasons.some((s) => s.seasonNumber === userCurrentSeason)) {
      return userCurrentSeason;
    }
    // Default to the first season in list
    return seasons[0].seasonNumber;
  }, [seasons, userCurrentSeason]);

  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(defaultSeasonNumber);

  // Local state for tracking watched episodes (optimistic UI)
  // Maps `${seasonNumber}:${episodeNumber}` -> boolean
  const [watchedMap, setWatchedMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    const currSeason = userCurrentSeason ?? 1;
    const currEp = userCurrentEpisode ?? 0;

    for (const season of seasons) {
      if (!season.episodes) continue;
      for (const ep of season.episodes) {
        const key = `${season.seasonNumber}:${ep.episodeNumber}`;
        // If prior season or prior episode in current season, marked watched
        if (
          season.seasonNumber < currSeason ||
          (season.seasonNumber === currSeason && ep.episodeNumber <= currEp)
        ) {
          initial[key] = true;
        } else {
          initial[key] = false;
        }
      }
    }
    return initial;
  });

  // Current active season object
  const activeSeason = useMemo(() => {
    return seasons.find((s) => s.seasonNumber === selectedSeasonNumber) || seasons[0];
  }, [seasons, selectedSeasonNumber]);

  // Compute watched counts per season for the SeasonSelector pills
  const seasonSelectorItems = useMemo(() => {
    return seasons.map((season) => {
      let watchedCount = 0;
      if (season.episodes) {
        for (const ep of season.episodes) {
          if (watchedMap[`${season.seasonNumber}:${ep.episodeNumber}`]) {
            watchedCount++;
          }
        }
      }
      return {
        seasonNumber: season.seasonNumber,
        name: season.name,
        episodeCount: season.episodeCount,
        watchedCount,
      };
    });
  }, [seasons, watchedMap]);

  // Compute active season episodes
  const activeEpisodes = activeSeason?.episodes || [];

  // Count watched in active season
  const activeSeasonWatchedCount = useMemo(() => {
    if (!activeSeason?.episodes) return 0;
    return activeSeason.episodes.filter(
      (ep) => watchedMap[`${activeSeason.seasonNumber}:${ep.episodeNumber}`],
    ).length;
  }, [activeSeason, watchedMap]);

  // Identify next unwatched episode across the active season
  const nextUpEpisodeNumber = useMemo(() => {
    if (!activeSeason?.episodes) return null;
    const nextEp = activeSeason.episodes.find(
      (ep) => !watchedMap[`${activeSeason.seasonNumber}:${ep.episodeNumber}`],
    );
    return nextEp ? nextEp.episodeNumber : null;
  }, [activeSeason, watchedMap]);

  // Toggle single episode watched
  const handleToggle = (epNumber: number) => {
    if (!activeSeason) return;
    const key = `${activeSeason.seasonNumber}:${epNumber}`;
    const nextWatchedState = !watchedMap[key];

    // Optimistic UI state update
    setWatchedMap((prev) => ({
      ...prev,
      [key]: nextWatchedState,
    }));

    onEpisodeToggle?.(activeSeason.seasonNumber, epNumber, nextWatchedState);

    // Call server action if external title props are available
    if (titleExternalSource && titleExternalId) {
      const epItem = activeSeason.episodes?.find((e) => e.episodeNumber === epNumber);
      toggleEpisodeProgressAction({
        titleExternalSource,
        titleExternalId,
        seasonNumber: activeSeason.seasonNumber,
        episodeNumber: epNumber,
        watched: nextWatchedState,
        titleName,
        mediaType,
        episodeName: epItem?.name,
      })
        .then((res) => {
          if (!res.success) {
            // Revert optimistic state on failure
            setWatchedMap((prev) => ({
              ...prev,
              [key]: !nextWatchedState,
            }));
          }
        })
        .catch(() => {
          // Revert optimistic state on network failure
          setWatchedMap((prev) => ({
            ...prev,
            [key]: !nextWatchedState,
          }));
        });
    }
  };

  // Batch mark active season as watched
  const handleMarkSeasonWatched = () => {
    if (!activeSeason?.episodes) return;
    const previousMap = { ...watchedMap };

    setWatchedMap((prev) => {
      const next = { ...prev };
      for (const ep of activeSeason.episodes!) {
        next[`${activeSeason.seasonNumber}:${ep.episodeNumber}`] = true;
      }
      return next;
    });

    if (titleExternalSource && titleExternalId) {
      const episodeNumbers = activeSeason.episodes.map((ep) => ep.episodeNumber);
      batchSeasonProgressAction({
        titleExternalSource,
        titleExternalId,
        seasonNumber: activeSeason.seasonNumber,
        watched: true,
        episodeNumbers,
        titleName,
        mediaType,
      })
        .then((res) => {
          if (!res.success) {
            setWatchedMap(previousMap);
          }
        })
        .catch(() => {
          setWatchedMap(previousMap);
        });
    }
  };

  // Batch mark active season as unwatched
  const handleMarkSeasonUnwatched = () => {
    if (!activeSeason?.episodes) return;
    const previousMap = { ...watchedMap };

    setWatchedMap((prev) => {
      const next = { ...prev };
      for (const ep of activeSeason.episodes!) {
        next[`${activeSeason.seasonNumber}:${ep.episodeNumber}`] = false;
      }
      return next;
    });

    if (titleExternalSource && titleExternalId) {
      const episodeNumbers = activeSeason.episodes.map((ep) => ep.episodeNumber);
      batchSeasonProgressAction({
        titleExternalSource,
        titleExternalId,
        seasonNumber: activeSeason.seasonNumber,
        watched: false,
        episodeNumbers,
        titleName,
        mediaType,
      })
        .then((res) => {
          if (!res.success) {
            setWatchedMap(previousMap);
          }
        })
        .catch(() => {
          setWatchedMap(previousMap);
        });
    }
  };

  if (!seasons || seasons.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="episodes-section-heading"
      className={cn(
        "glass-2 rounded-[24px] p-5 sm:p-7 border border-white/10 shadow-sm space-y-6",
        className,
      )}
    >
      {/* 1. Header with title & Continue primary action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h2
            id="episodes-section-heading"
            className="text-lg sm:text-xl font-display font-bold text-ink tracking-tight flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-accent" aria-hidden="true" />
            Episodes
          </h2>
          <p className="text-xs text-ink-muted">
            Track individual episodes or mark entire seasons with one click.
          </p>
        </div>

        {/* Primary Continue Button */}
        {nextUpEpisodeNumber != null && (
          <Button
            variant="primary"
            size="small"
            onClick={() => handleToggle(nextUpEpisodeNumber)}
            className="self-start sm:self-auto shadow-md"
          >
            Continue S{activeSeason?.seasonNumber} E{nextUpEpisodeNumber}
          </Button>
        )}
      </div>

      {/* 2. Season Selector Pills (if > 1 season) */}
      {seasons.length > 1 && (
        <SeasonSelector
          seasons={seasonSelectorItems}
          selectedSeason={selectedSeasonNumber}
          onSelectSeason={setSelectedSeasonNumber}
        />
      )}

      {/* 3. Progress Bar & Batch Controls */}
      <div className="glass-1 rounded-2xl p-4 border border-white/5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex-1 max-w-md">
            <ProgressBar
              value={activeSeasonWatchedCount}
              max={activeSeason?.episodeCount || 1}
              showPercent
              label={`Season ${activeSeason?.seasonNumber}: ${activeSeasonWatchedCount} / ${activeSeason?.episodeCount} episodes`}
            />
          </div>

          {/* Batch overflow buttons (section 9.15) */}
          <div className="flex items-center gap-2 pt-1 sm:pt-0">
            {activeSeasonWatchedCount < (activeSeason?.episodeCount || 1) ? (
              <button
                type="button"
                onClick={handleMarkSeasonWatched}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium glass-2 text-ink-soft hover:text-ink border border-white/10 hover:border-white/20 transition-colors cursor-pointer select-none"
              >
                <CheckCheck className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                Mark Season Watched
              </button>
            ) : (
              <button
                type="button"
                onClick={handleMarkSeasonUnwatched}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium glass-2 text-ink-soft hover:text-ink border border-white/10 hover:border-white/20 transition-colors cursor-pointer select-none"
              >
                <RotateCcw className="w-3.5 h-3.5 text-ink-muted" aria-hidden="true" />
                Reset Season
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Episode List Breakdown */}
      <div className="space-y-2">
        {activeEpisodes.length > 0 ? (
          activeEpisodes.map((ep) => {
            const isWatched = !!watchedMap[`${activeSeason?.seasonNumber}:${ep.episodeNumber}`];
            const isNextUp = ep.episodeNumber === nextUpEpisodeNumber;

            return (
              <EpisodeRow
                key={`${activeSeason?.seasonNumber}-${ep.episodeNumber}`}
                episodeNumber={ep.episodeNumber}
                seasonNumber={activeSeason?.seasonNumber}
                name={ep.name}
                airDate={ep.airDate}
                runtime={ep.runtime}
                overview={ep.overview}
                isWatched={isWatched}
                isNextUp={isNextUp}
                isAired={ep.isAired ?? true}
                onToggleWatched={handleToggle}
              />
            );
          })
        ) : (
          <div className="p-6 text-center text-sm text-ink-muted glass-1 rounded-xl border border-white/5">
            No episode details found for this season.
          </div>
        )}
      </div>
    </section>
  );
}
