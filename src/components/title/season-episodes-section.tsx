"use client";

import React, { useState, useMemo } from "react";
import { Check, CheckCheck, RotateCcw, Sparkles, Tv } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SeasonSelector } from "./season-selector";
import { EpisodeRow } from "./episode-row";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { computeSeriesProgress } from "@/lib/progress";
import {
  batchSeasonProgressAction,
  batchSeriesProgressAction,
  fetchSeasonEpisodesAction,
  toggleEpisodeProgressAction,
} from "@/actions/tracking";

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
  onMarkSeriesWatched?: () => void;
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
  onMarkSeriesWatched,
  className,
}: SeasonEpisodesSectionProps) {
  // Local state holding dynamically fetched episodes per seasonNumber (allows lazy-loaded episodes to populate seamlessly)
  const [dynamicEpisodesBySeason, setDynamicEpisodesBySeason] = useState<
    Record<number, EpisodeItem[]>
  >({});
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState<boolean>(false);
  const [activeToast, setActiveToast] = useState<{
    type: "success" | "error" | "info" | "warning";
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);

  // Merge base seasons with dynamically loaded episodes
  const seasonsState = useMemo(() => {
    return seasons.map((season) => {
      const dynamicEpisodes = dynamicEpisodesBySeason[season.seasonNumber];
      if (dynamicEpisodes && (!season.episodes || season.episodes.length === 0)) {
        return {
          ...season,
          episodes: dynamicEpisodes,
        };
      }
      return season;
    });
  }, [seasons, dynamicEpisodesBySeason]);

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

  // Calculate comprehensive series progress, next-up episode, and per-season progress (Day 34)
  const seriesProgress = useMemo(() => {
    return computeSeriesProgress(seasonsState, watchedMap);
  }, [seasonsState, watchedMap]);

  // Determine default selected season:
  // "The current season opens by default; if the user is mid-series it opens on the season of the next unwatched episode."
  const defaultSeasonNumber = useMemo(() => {
    if (!seasonsState || seasonsState.length === 0) return 1;
    if (
      userCurrentSeason != null &&
      seasonsState.some((s) => s.seasonNumber === userCurrentSeason)
    ) {
      return userCurrentSeason;
    }
    if (seriesProgress.nextUp) {
      return seriesProgress.nextUp.seasonNumber;
    }
    return seasonsState[0].seasonNumber;
  }, [seasonsState, userCurrentSeason, seriesProgress.nextUp]);

  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(defaultSeasonNumber);

  // Current active season object
  const activeSeason = useMemo(() => {
    return seasonsState.find((s) => s.seasonNumber === selectedSeasonNumber) || seasonsState[0];
  }, [seasonsState, selectedSeasonNumber]);

  const activeEpisodes = activeSeason?.episodes || [];

  // Active season progress summary
  const activeSeasonProgress = useMemo(() => {
    return (
      seriesProgress.seasonProgress.find((sp) => sp.seasonNumber === selectedSeasonNumber) || {
        seasonNumber: selectedSeasonNumber,
        totalEpisodes: activeSeason?.episodeCount || activeSeason?.episodes?.length || 0,
        watchedEpisodes: 0,
        percentage: 0,
        isCompleted: false,
      }
    );
  }, [seriesProgress, selectedSeasonNumber, activeSeason]);

  const activeSeasonWatchedCount = activeSeasonProgress.watchedEpisodes;
  const activeSeasonTotalEpisodes =
    activeSeasonProgress.totalEpisodes ||
    activeSeason?.episodeCount ||
    activeSeason?.episodes?.length ||
    0;
  const activeSeasonPercentage = activeSeasonProgress.percentage;

  // Identify whether next-up episode resides in the currently selected season
  const isNextUpInActiveSeason = seriesProgress.nextUp?.seasonNumber === selectedSeasonNumber;
  const nextUpEpisodeNumber = isNextUpInActiveSeason ? seriesProgress.nextUp?.episodeNumber : null;

  // Compute watched counts per season for the SeasonSelector pills
  const seasonSelectorItems = useMemo(() => {
    return seriesProgress.seasonProgress.map((sp) => {
      const seasonObj = seasonsState.find((s) => s.seasonNumber === sp.seasonNumber);
      return {
        seasonNumber: sp.seasonNumber,
        name: seasonObj?.name,
        episodeCount: sp.totalEpisodes,
        watchedCount: sp.watchedEpisodes,
      };
    });
  }, [seriesProgress, seasonsState]);

  // Handle season selection with lazy episode loading (Day 32)
  const handleSelectSeason = async (seasonNum: number) => {
    setSelectedSeasonNumber(seasonNum);
    const targetSeason = seasonsState.find((s) => s.seasonNumber === seasonNum);

    // If target season has no episodes and external provider info is present, fetch dynamically
    if (
      (!targetSeason?.episodes || targetSeason.episodes.length === 0) &&
      titleExternalSource &&
      titleExternalId
    ) {
      setIsLoadingEpisodes(true);
      try {
        const res = await fetchSeasonEpisodesAction({
          titleExternalSource,
          titleExternalId,
          seasonNumber: seasonNum,
          titleName,
          mediaType,
        });

        if (res.success && res.episodes && res.episodes.length > 0) {
          const loadedEpisodes: EpisodeItem[] = res.episodes.map((ep) => ({
            episodeNumber: ep.episodeNumber,
            seasonNumber: seasonNum,
            name: ep.name ?? `Episode ${ep.episodeNumber}`,
            airDate: ep.airDate ?? null,
            runtime: ep.runtime ?? null,
          }));

          setDynamicEpisodesBySeason((prev) => ({
            ...prev,
            [seasonNum]: loadedEpisodes,
          }));
        }
      } catch (err) {
        console.warn("[SeasonEpisodesSection] Failed to dynamically load season episodes:", err);
      } finally {
        setIsLoadingEpisodes(false);
      }
    }
  };

  // Toggle single episode watched (Day 33 & Day 34)
  const handleToggle = (epNumber: number, targetSeasonNum?: number) => {
    const seasonNum = targetSeasonNum ?? activeSeason?.seasonNumber ?? 1;
    const targetSeasonObj = seasonsState.find((s) => s.seasonNumber === seasonNum) || activeSeason;
    const key = `${seasonNum}:${epNumber}`;
    const nextWatchedState = !watchedMap[key];
    const prevWatchedState = watchedMap[key] ?? false;

    // Optimistic UI state update
    setWatchedMap((prev) => ({
      ...prev,
      [key]: nextWatchedState,
    }));

    onEpisodeToggle?.(seasonNum, epNumber, nextWatchedState);

    // Call server action if external title props are available
    if (titleExternalSource && titleExternalId) {
      const epItem = targetSeasonObj?.episodes?.find((e) => e.episodeNumber === epNumber);
      toggleEpisodeProgressAction({
        titleExternalSource,
        titleExternalId,
        seasonNumber: seasonNum,
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
              [key]: prevWatchedState,
            }));
            setActiveToast({
              type: "error",
              message: res.error
                ? `Could not save: ${res.error}`
                : "Could not save. Your change was not recorded.",
              actionLabel: "Try again",
              onAction: () => handleToggle(epNumber),
            });
            return;
          }

          // Section 17.4 Toast Copy:
          // Episode marked: "Watched S2 E4. Undo"
          // First episode on Plan to Watch: "Moved to Watching. Watched S1 E1. Undo"
          // Unmarked: "Unmarked S2 E4. Undo"
          let toastMsg = "";
          if (nextWatchedState) {
            if (res.statusTransitioned && res.previousStatus === "PLAN_TO_WATCH") {
              toastMsg = `Moved to Watching. Watched S${seasonNum} E${epNumber}.`;
            } else {
              toastMsg = `Watched S${seasonNum} E${epNumber}.`;
            }
          } else {
            toastMsg = `Unmarked S${seasonNum} E${epNumber}.`;
          }

          setActiveToast({
            type: "success",
            message: toastMsg,
            actionLabel: "Undo",
            onAction: () => {
              // Revert locally
              setWatchedMap((prev) => ({
                ...prev,
                [key]: prevWatchedState,
              }));
              onEpisodeToggle?.(seasonNum, epNumber, prevWatchedState);

              // Server action rollback
              toggleEpisodeProgressAction({
                titleExternalSource,
                titleExternalId,
                seasonNumber: seasonNum,
                episodeNumber: epNumber,
                watched: prevWatchedState,
                titleName,
                mediaType,
                episodeName: epItem?.name,
                revertStatus:
                  res.statusTransitioned && res.previousStatus
                    ? (res.previousStatus as
                        "WATCHED" | "WATCHING" | "PLAN_TO_WATCH" | "ON_HOLD" | "DROPPED")
                    : undefined,
              }).catch((err) => {
                console.error("[SeasonEpisodesSection] Failed to undo episode progress:", err);
              });
            },
          });
        })
        .catch((err) => {
          // Revert optimistic state on network failure
          setWatchedMap((prev) => ({
            ...prev,
            [key]: prevWatchedState,
          }));
          setActiveToast({
            type: "error",
            message:
              err instanceof Error
                ? `Could not save: ${err.message}`
                : "Could not save. Your change was not recorded.",
            actionLabel: "Try again",
            onAction: () => handleToggle(epNumber),
          });
        });
    } else {
      // In demo/mock client mode
      const toastMsg = nextWatchedState
        ? `Watched S${seasonNum} E${epNumber}.`
        : `Unmarked S${seasonNum} E${epNumber}.`;

      setActiveToast({
        type: "success",
        message: toastMsg,
        actionLabel: "Undo",
        onAction: () => {
          setWatchedMap((prev) => ({
            ...prev,
            [key]: prevWatchedState,
          }));
          onEpisodeToggle?.(seasonNum, epNumber, prevWatchedState);
        },
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
            setActiveToast({
              type: "error",
              message: res.error
                ? `Could not save: ${res.error}`
                : "Could not save. Your change was not recorded.",
              actionLabel: "Try again",
              onAction: handleMarkSeasonWatched,
            });
            return;
          }

          setActiveToast({
            type: "success",
            message: `Marked Season ${activeSeason.seasonNumber} as watched.`,
            actionLabel: "Undo",
            onAction: () => {
              setWatchedMap(previousMap);
              batchSeasonProgressAction({
                titleExternalSource,
                titleExternalId,
                seasonNumber: activeSeason.seasonNumber,
                watched: false,
                episodeNumbers,
                titleName,
                mediaType,
              }).catch(console.error);
            },
          });
        })
        .catch((err) => {
          setWatchedMap(previousMap);
          setActiveToast({
            type: "error",
            message:
              err instanceof Error
                ? `Could not save: ${err.message}`
                : "Could not save. Your change was not recorded.",
            actionLabel: "Try again",
            onAction: handleMarkSeasonWatched,
          });
        });
    } else {
      setActiveToast({
        type: "success",
        message: `Marked Season ${activeSeason.seasonNumber} as watched.`,
        actionLabel: "Undo",
        onAction: () => setWatchedMap(previousMap),
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
            setActiveToast({
              type: "error",
              message: res.error
                ? `Could not save: ${res.error}`
                : "Could not save. Your change was not recorded.",
              actionLabel: "Try again",
              onAction: handleMarkSeasonUnwatched,
            });
            return;
          }

          setActiveToast({
            type: "success",
            message: `Marked Season ${activeSeason.seasonNumber} as unwatched.`,
            actionLabel: "Undo",
            onAction: () => {
              setWatchedMap(previousMap);
              batchSeasonProgressAction({
                titleExternalSource,
                titleExternalId,
                seasonNumber: activeSeason.seasonNumber,
                watched: true,
                episodeNumbers,
                titleName,
                mediaType,
              }).catch(console.error);
            },
          });
        })
        .catch((err) => {
          setWatchedMap(previousMap);
          setActiveToast({
            type: "error",
            message:
              err instanceof Error
                ? `Could not save: ${err.message}`
                : "Could not save. Your change was not recorded.",
            actionLabel: "Try again",
            onAction: handleMarkSeasonUnwatched,
          });
        });
    } else {
      setActiveToast({
        type: "success",
        message: `Marked Season ${activeSeason.seasonNumber} as unwatched.`,
        actionLabel: "Undo",
        onAction: () => setWatchedMap(previousMap),
      });
    }
  };

  // Batch mark episodes 1 to N as watched (Catch up action - Section 9.14)
  const handleMarkUpToWatched = (epNumber: number) => {
    if (!activeSeason?.episodes) return;
    const previousMap = { ...watchedMap };
    const episodesToMark = activeSeason.episodes.filter((e) => e.episodeNumber <= epNumber);

    setWatchedMap((prev) => {
      const next = { ...prev };
      for (const ep of episodesToMark) {
        next[`${activeSeason.seasonNumber}:${ep.episodeNumber}`] = true;
      }
      return next;
    });

    if (titleExternalSource && titleExternalId) {
      batchSeasonProgressAction({
        titleExternalSource,
        titleExternalId,
        seasonNumber: activeSeason.seasonNumber,
        watched: true,
        episodeNumbers: episodesToMark.map((e) => e.episodeNumber),
        titleName,
        mediaType,
      })
        .then((res) => {
          if (!res.success) {
            setWatchedMap(previousMap);
            setActiveToast({
              type: "error",
              message: res.error
                ? `Could not save: ${res.error}`
                : "Could not save. Your change was not recorded.",
              actionLabel: "Try again",
              onAction: () => handleMarkUpToWatched(epNumber),
            });
            return;
          }

          setActiveToast({
            type: "success",
            message: `Watched episodes 1 to ${epNumber}.`,
            actionLabel: "Undo",
            onAction: () => {
              setWatchedMap(previousMap);
              batchSeasonProgressAction({
                titleExternalSource,
                titleExternalId,
                seasonNumber: activeSeason.seasonNumber,
                watched: false,
                episodeNumbers: episodesToMark
                  .filter((e) => !previousMap[`${activeSeason.seasonNumber}:${e.episodeNumber}`])
                  .map((e) => e.episodeNumber),
                titleName,
                mediaType,
              }).catch(console.error);
            },
          });
        })
        .catch((err) => {
          setWatchedMap(previousMap);
          setActiveToast({
            type: "error",
            message:
              err instanceof Error
                ? `Could not save: ${err.message}`
                : "Could not save. Your change was not recorded.",
            actionLabel: "Try again",
            onAction: () => handleMarkUpToWatched(epNumber),
          });
        });
    } else {
      setActiveToast({
        type: "success",
        message: `Watched episodes 1 to ${epNumber}.`,
        actionLabel: "Undo",
        onAction: () => setWatchedMap(previousMap),
      });
    }
  };

  // Batch mark entire series as watched
  const handleMarkSeriesWatched = () => {
    const previousMap = { ...watchedMap };

    setWatchedMap((prev) => {
      const next = { ...prev };
      for (const season of seasonsState) {
        if (season.episodes && season.episodes.length > 0) {
          for (const ep of season.episodes) {
            next[`${season.seasonNumber}:${ep.episodeNumber}`] = true;
          }
        } else {
          const count = season.episodeCount || 1;
          for (let i = 1; i <= count; i++) {
            next[`${season.seasonNumber}:${i}`] = true;
          }
        }
      }
      return next;
    });

    onMarkSeriesWatched?.();

    if (titleExternalSource && titleExternalId) {
      batchSeriesProgressAction({
        titleExternalSource,
        titleExternalId,
        watched: true,
        titleName,
        mediaType,
        seasons: seasonsState.map((s) => ({
          seasonNumber: s.seasonNumber,
          episodeCount: s.episodeCount || s.episodes?.length || 1,
          episodes: s.episodes?.map((e) => ({
            episodeNumber: e.episodeNumber,
            name: e.name,
            airDate: e.airDate ?? null,
            runtime: e.runtime ?? null,
          })),
        })),
      })
        .then((res) => {
          if (!res.success) {
            setWatchedMap(previousMap);
            setActiveToast({
              type: "error",
              message: res.error
                ? `Could not save: ${res.error}`
                : "Could not save. Your change was not recorded.",
              actionLabel: "Try again",
              onAction: handleMarkSeriesWatched,
            });
            return;
          }

          setActiveToast({
            type: "success",
            message: "Marked entire series as watched.",
            actionLabel: "Undo",
            onAction: () => {
              setWatchedMap(previousMap);
              batchSeriesProgressAction({
                titleExternalSource,
                titleExternalId,
                watched: false,
                titleName,
                mediaType,
              }).catch(console.error);
            },
          });
        })
        .catch((err) => {
          setWatchedMap(previousMap);
          setActiveToast({
            type: "error",
            message:
              err instanceof Error
                ? `Could not save: ${err.message}`
                : "Could not save. Your change was not recorded.",
            actionLabel: "Try again",
            onAction: handleMarkSeriesWatched,
          });
        });
    } else {
      setActiveToast({
        type: "success",
        message: "Marked entire series as watched.",
        actionLabel: "Undo",
        onAction: () => setWatchedMap(previousMap),
      });
    }
  };

  // Batch mark entire series as unwatched
  const handleMarkSeriesUnwatched = () => {
    const previousMap = { ...watchedMap };

    setWatchedMap((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = false;
      }
      return next;
    });

    if (titleExternalSource && titleExternalId) {
      batchSeriesProgressAction({
        titleExternalSource,
        titleExternalId,
        watched: false,
        titleName,
        mediaType,
      })
        .then((res) => {
          if (!res.success) {
            setWatchedMap(previousMap);
            setActiveToast({
              type: "error",
              message: res.error
                ? `Could not save: ${res.error}`
                : "Could not save. Your change was not recorded.",
              actionLabel: "Try again",
              onAction: handleMarkSeriesUnwatched,
            });
            return;
          }

          setActiveToast({
            type: "success",
            message: "Marked series as unwatched.",
            actionLabel: "Undo",
            onAction: () => {
              setWatchedMap(previousMap);
              batchSeriesProgressAction({
                titleExternalSource,
                titleExternalId,
                watched: true,
                titleName,
                mediaType,
                seasons: seasonsState.map((s) => ({
                  seasonNumber: s.seasonNumber,
                  episodeCount: s.episodeCount || s.episodes?.length || 1,
                  episodes: s.episodes?.map((e) => ({
                    episodeNumber: e.episodeNumber,
                    name: e.name,
                    airDate: e.airDate ?? null,
                    runtime: e.runtime ?? null,
                  })),
                })),
              }).catch(console.error);
            },
          });
        })
        .catch((err) => {
          setWatchedMap(previousMap);
          setActiveToast({
            type: "error",
            message:
              err instanceof Error
                ? `Could not save: ${err.message}`
                : "Could not save. Your change was not recorded.",
            actionLabel: "Try again",
            onAction: handleMarkSeriesUnwatched,
          });
        });
    } else {
      setActiveToast({
        type: "success",
        message: "Marked series as unwatched.",
        actionLabel: "Undo",
        onAction: () => setWatchedMap(previousMap),
      });
    }
  };

  if (!seasonsState || seasonsState.length === 0) {
    return (
      <section
        aria-labelledby="episodes-section-heading"
        className={cn(
          "glass-2 rounded-[24px] p-5 sm:p-7 border border-white/10 shadow-sm space-y-6",
          className,
        )}
      >
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

        <div className="p-8 text-center glass-1 rounded-2xl border border-white/10 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full glass-2 flex items-center justify-center text-ink-muted">
            <Tv className="w-6 h-6 text-accent/80" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-display font-bold text-ink">No episode details yet</h3>
            <p className="text-xs text-ink-secondary max-w-sm mx-auto">
              You can still mark the whole series as watched.
            </p>
          </div>
          {onMarkSeriesWatched && (
            <Button variant="secondary" size="small" onClick={onMarkSeriesWatched} className="mt-2">
              Mark series watched
            </Button>
          )}
        </div>
      </section>
    );
  }

  const progressLabel = `${activeSeasonWatchedCount} / ${activeSeasonTotalEpisodes} episodes - ${activeSeasonPercentage}%`;

  return (
    <section
      aria-labelledby="episodes-section-heading"
      className={cn(
        "glass-2 rounded-[24px] p-5 sm:p-7 border border-white/10 shadow-sm space-y-6",
        className,
      )}
    >
      {/* 1. Header with title & Continue primary action (Day 34) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2
              id="episodes-section-heading"
              className="text-lg sm:text-xl font-display font-bold text-ink tracking-tight flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-accent" aria-hidden="true" />
              Episodes
            </h2>

            {/* Overall series completion badge (Day 34) */}
            {seriesProgress.totalEpisodes > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium glass-2 text-ink-muted border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                {seriesProgress.watchedEpisodes} / {seriesProgress.totalEpisodes} (
                {seriesProgress.percentage}%)
              </span>
            )}
          </div>
          <p className="text-xs text-ink-muted">
            Track individual episodes or mark entire seasons with one click.
          </p>
        </div>

        {/* Primary Continue Button / All Watched Indicator (Day 34) */}
        {seriesProgress.nextUp ? (
          <Button
            variant="primary"
            size="small"
            onClick={() => {
              const targetSeason = seriesProgress.nextUp!.seasonNumber;
              const targetEp = seriesProgress.nextUp!.episodeNumber;
              if (selectedSeasonNumber !== targetSeason) {
                handleSelectSeason(targetSeason);
              }
              handleToggle(targetEp, targetSeason);
            }}
            className="self-start sm:self-auto shadow-md"
          >
            Continue S{seriesProgress.nextUp.seasonNumber} E{seriesProgress.nextUp.episodeNumber}
          </Button>
        ) : seriesProgress.isCompleted ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-xs font-bold font-mono self-start sm:self-auto">
            <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" aria-hidden="true" />
            All Episodes Watched
          </span>
        ) : null}
      </div>

      {/* 2. Season Selector Pills (if > 1 season) */}
      {seasonsState.length > 1 && (
        <SeasonSelector
          seasons={seasonSelectorItems}
          selectedSeason={selectedSeasonNumber}
          onSelectSeason={handleSelectSeason}
        />
      )}

      {/* 3. Progress Bar & Batch Controls (UI Spec 9.13 & 9.14) */}
      <div className="glass-1 rounded-2xl p-4 border border-white/5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex-1 max-w-md">
            <ProgressBar
              value={activeSeasonWatchedCount}
              max={activeSeasonTotalEpisodes || 1}
              showPercent
              label={progressLabel}
            />
          </div>

          {/* Batch overflow buttons (section 9.15) */}
          <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
            {activeSeasonWatchedCount < (activeSeason?.episodeCount || 1) ? (
              <button
                type="button"
                onClick={handleMarkSeasonWatched}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium glass-2 text-ink-soft hover:text-ink border border-white/10 hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors cursor-pointer select-none"
              >
                <CheckCheck className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                Mark Season Watched
              </button>
            ) : (
              <button
                type="button"
                onClick={handleMarkSeasonUnwatched}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium glass-2 text-ink-soft hover:text-ink border border-white/10 hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors cursor-pointer select-none"
              >
                <RotateCcw className="w-3.5 h-3.5 text-ink-muted" aria-hidden="true" />
                Reset Season
              </button>
            )}

            {seriesProgress.isCompleted ? (
              <button
                type="button"
                onClick={handleMarkSeriesUnwatched}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium glass-2 text-ink-soft hover:text-ink border border-white/10 hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors cursor-pointer select-none"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                Reset Series
              </button>
            ) : (
              <button
                type="button"
                onClick={handleMarkSeriesWatched}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent/15 text-accent hover:bg-accent/25 border border-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors cursor-pointer select-none"
              >
                <CheckCheck className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                Mark Series Watched
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Episode List Breakdown (Loading, Episodes, or Spec Empty State) */}
      <div className="space-y-2">
        {isLoadingEpisodes ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-[64px] sm:h-[60px] rounded-xl glass-1 border border-white/5 animate-pulse flex items-center px-4 gap-3"
              >
                <div className="w-7 h-7 rounded-full bg-white/10" />
                <div className="w-6 h-4 rounded bg-white/10" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-1/3 h-3.5 rounded bg-white/10" />
                  <div className="w-1/4 h-2.5 rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : activeEpisodes.length > 0 ? (
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
                onMarkUpToWatched={handleMarkUpToWatched}
              />
            );
          })
        ) : (
          <div className="p-8 text-center glass-1 rounded-2xl border border-white/10 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full glass-2 flex items-center justify-center text-ink-muted">
              <Tv className="w-6 h-6 text-accent/80" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-display font-bold text-ink">No episode details yet</h3>
              <p className="text-xs text-ink-secondary max-w-sm mx-auto">
                You can still mark the whole series as watched.
              </p>
            </div>
            {onMarkSeriesWatched && (
              <Button
                variant="secondary"
                size="small"
                onClick={onMarkSeriesWatched}
                className="mt-2"
              >
                Mark series watched
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Undo Toast Notification (UI spec 9.17 & 17.4) */}
      {activeToast && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[calc(100vw-32px)] max-w-[420px] pointer-events-auto">
          <Toast
            type={activeToast.type}
            message={activeToast.message}
            actionLabel={activeToast.actionLabel}
            onAction={activeToast.onAction}
            onClose={() => setActiveToast(null)}
            duration={6000}
          />
        </div>
      )}
    </section>
  );
}
