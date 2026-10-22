import { prisma } from "@/lib/db";
import { calculateProgressPercentage } from "@/lib/utils/format";

export interface NextUpEpisode {
  seasonNumber: number;
  episodeNumber: number;
  name?: string | null;
  airDate?: string | null;
  runtime?: number | null;
}

export interface SeasonProgressSummary {
  seasonNumber: number;
  name?: string | null;
  totalEpisodes: number;
  watchedEpisodes: number;
  percentage: number;
  isCompleted: boolean;
}

export interface SeriesProgressResult {
  totalEpisodes: number;
  watchedEpisodes: number;
  percentage: number;
  isCompleted: boolean;
  seasonProgress: SeasonProgressSummary[];
  nextUp: NextUpEpisode | null;
  defaultSeasonNumber: number;
  watchedMap: Record<string, boolean>;
}

export interface ProgressSeasonItem {
  seasonNumber: number;
  name?: string | null;
  episodeCount?: number;
  episodes?: Array<{
    episodeNumber: number;
    name?: string | null;
    airDate?: string | null;
    runtime?: number | null;
    isAired?: boolean;
  }>;
}

/**
 * Pure function to calculate series-level and season-level progress (Day 34):
 * - Formula: Progress = (Watched Episodes / Total Episodes) * 100%
 * - Identifies the exact next unwatched episode ("Continue from next episode")
 *   by scanning seasons and episodes in chronological order.
 * - Determines the default season to open (season of the next unwatched episode).
 */
export function computeSeriesProgress(
  seasons: ProgressSeasonItem[],
  watchedMap: Record<string, boolean>,
): SeriesProgressResult {
  // Sort seasons ascending by seasonNumber
  const sortedSeasons = [...seasons].sort((a, b) => a.seasonNumber - b.seasonNumber);

  let totalEpisodesAcrossSeries = 0;
  let totalWatchedEpisodesAcrossSeries = 0;
  let detectedNextUp: NextUpEpisode | null = null;
  const seasonProgress: SeasonProgressSummary[] = [];

  for (const season of sortedSeasons) {
    const seasonNum = season.seasonNumber;
    const episodes = season.episodes || [];
    const totalSeasonEpisodes = Math.max(season.episodeCount ?? 0, episodes.length);

    let seasonWatchedCount = 0;

    // Check each episode in season
    if (episodes.length > 0) {
      // Sort episodes ascending by episodeNumber
      const sortedEpisodes = [...episodes].sort((a, b) => a.episodeNumber - b.episodeNumber);

      for (const ep of sortedEpisodes) {
        const key = `${seasonNum}:${ep.episodeNumber}`;
        const isWatched = Boolean(watchedMap[key]);

        if (isWatched) {
          seasonWatchedCount++;
        } else if (!detectedNextUp && ep.isAired !== false) {
          // First unwatched aired episode across the series is our Next-Up episode!
          detectedNextUp = {
            seasonNumber: seasonNum,
            episodeNumber: ep.episodeNumber,
            name: ep.name ?? `Episode ${ep.episodeNumber}`,
            airDate: ep.airDate ?? null,
            runtime: ep.runtime ?? null,
          };
        }
      }
    } else {
      // If episodes array is not expanded yet, check by episodeCount
      for (let epNum = 1; epNum <= totalSeasonEpisodes; epNum++) {
        const key = `${seasonNum}:${epNum}`;
        const isWatched = Boolean(watchedMap[key]);

        if (isWatched) {
          seasonWatchedCount++;
        } else if (!detectedNextUp) {
          detectedNextUp = {
            seasonNumber: seasonNum,
            episodeNumber: epNum,
            name: `Episode ${epNum}`,
          };
        }
      }
    }

    const seasonPercent = calculateProgressPercentage(seasonWatchedCount, totalSeasonEpisodes);
    const isSeasonCompleted = totalSeasonEpisodes > 0 && seasonWatchedCount >= totalSeasonEpisodes;

    seasonProgress.push({
      seasonNumber: seasonNum,
      name: season.name ?? `Season ${seasonNum}`,
      totalEpisodes: totalSeasonEpisodes,
      watchedEpisodes: seasonWatchedCount,
      percentage: seasonPercent,
      isCompleted: isSeasonCompleted,
    });

    totalEpisodesAcrossSeries += totalSeasonEpisodes;
    totalWatchedEpisodesAcrossSeries += seasonWatchedCount;
  }

  const overallPercentage = calculateProgressPercentage(
    totalWatchedEpisodesAcrossSeries,
    totalEpisodesAcrossSeries,
  );
  const isSeriesCompleted =
    totalEpisodesAcrossSeries > 0 && totalWatchedEpisodesAcrossSeries >= totalEpisodesAcrossSeries;

  // If nextUp exists, default to its season; otherwise default to first season
  const defaultSeasonNumber = detectedNextUp
    ? detectedNextUp.seasonNumber
    : (sortedSeasons[0]?.seasonNumber ?? 1);

  return {
    totalEpisodes: totalEpisodesAcrossSeries,
    watchedEpisodes: totalWatchedEpisodesAcrossSeries,
    percentage: overallPercentage,
    isCompleted: isSeriesCompleted,
    seasonProgress,
    nextUp: detectedNextUp,
    defaultSeasonNumber,
    watchedMap,
  };
}

/**
 * Database query to compute real user progress for a given title (Day 34).
 * Returns null if title or user does not exist.
 */
export async function getTitleProgressFromDb(params: {
  userId: string;
  titleId?: string;
  externalSource: "tmdb" | "anilist";
  externalId: string;
}): Promise<SeriesProgressResult | null> {
  const { userId, titleId, externalSource, externalId } = params;

  try {
    const rawDbId = titleId ? titleId.replace(/^db-/, "") : null;
    let titleRecord = null;

    if (rawDbId) {
      try {
        titleRecord = await prisma.title.findUnique({
          where: { id: rawDbId },
          include: {
            seasons: {
              orderBy: { seasonNumber: "asc" },
              include: {
                episodes: {
                  orderBy: { episodeNumber: "asc" },
                },
              },
            },
          },
        });
      } catch {
        // Fallback to externalSource_externalId
      }
    }

    if (!titleRecord) {
      titleRecord = await prisma.title.findUnique({
        where: {
          externalSource_externalId: {
            externalSource,
            externalId,
          },
        },
        include: {
          seasons: {
            orderBy: { seasonNumber: "asc" },
            include: {
              episodes: {
                orderBy: { episodeNumber: "asc" },
              },
            },
          },
        },
      });
    }

    if (!titleRecord || titleRecord.seasons.length === 0) {
      return null;
    }

    // Collect all episode IDs for this title
    const allEpisodeIds = titleRecord.seasons.flatMap((s) => s.episodes.map((e) => e.id));

    // Query user episode progress records
    const userEpisodes = await prisma.userEpisode.findMany({
      where: {
        userId,
        episodeId: { in: allEpisodeIds },
      },
      select: {
        episodeId: true,
      },
    });

    const watchedEpisodeIdSet = new Set(userEpisodes.map((ue) => ue.episodeId));

    // Build watchedMap keyed by `${seasonNumber}:${episodeNumber}`
    const watchedMap: Record<string, boolean> = {};

    const progressSeasons: ProgressSeasonItem[] = titleRecord.seasons.map((season) => ({
      seasonNumber: season.seasonNumber,
      name: season.name,
      episodeCount: season.episodeCount,
      episodes: season.episodes.map((ep) => {
        const isWatched = watchedEpisodeIdSet.has(ep.id);
        watchedMap[`${season.seasonNumber}:${ep.episodeNumber}`] = isWatched;
        return {
          episodeNumber: ep.episodeNumber,
          name: ep.name,
          airDate: ep.airDate,
          runtime: ep.runtime,
        };
      }),
    }));

    return computeSeriesProgress(progressSeasons, watchedMap);
  } catch (error) {
    console.error("[ProgressService] Failed to calculate title progress from DB:", error);
    return null;
  }
}
