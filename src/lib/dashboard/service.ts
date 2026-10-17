import { prisma } from "@/lib/db";
import { withDbRetry } from "@/lib/db/retry";
import { demoTitles } from "@/lib/data/demo-titles";
import { computeSeriesProgress, ProgressSeasonItem } from "@/lib/progress/service";

export interface DashboardStats {
  totalTracked: number;
  watched: number;
  watching: number;
  planToWatch: number;
  onHold: number;
  dropped: number;
}

export interface ContinueWatchingItem {
  id: string;
  externalSource: string;
  externalId: string;
  title: string;
  type: "TV" | "ANIME";
  posterUrl?: string | null;
  backdropUrl?: string | null;
  year?: number | null;
  userRating?: number | null;
  totalEpisodes: number;
  watchedEpisodes: number;
  percentage: number;
  nextUp: {
    seasonNumber: number;
    episodeNumber: number;
    name?: string | null;
  } | null;
  isCompleted: boolean;
  updatedAt?: string | null;
}

export interface RecentlyWatchedItem {
  id: string;
  externalSource: string;
  externalId: string;
  title: string;
  type: "MOVIE" | "TV" | "ANIME";
  posterUrl?: string | null;
  backdropUrl?: string | null;
  year?: number | null;
  rating?: number | null;
  status: "WATCHED";
  watchedAt?: string | null;
}

export interface DashboardAnalytics {
  countsByType: {
    movies: number;
    tv: number;
    anime: number;
  };
  averageRating: number | null;
  ratedCount: number;
  totalWatchedEpisodes: number;
}

/**
 * Pure function to aggregate status counts from an array of title status items.
 */
export function computeDashboardStats(
  items: Array<{ status: string | null | undefined }>,
): DashboardStats {
  let totalTracked = 0;
  let watched = 0;
  let watching = 0;
  let planToWatch = 0;
  let onHold = 0;
  let dropped = 0;

  for (const item of items) {
    if (!item.status) continue;
    totalTracked++;

    switch (item.status) {
      case "WATCHED":
        watched++;
        break;
      case "WATCHING":
        watching++;
        break;
      case "PLAN_TO_WATCH":
        planToWatch++;
        break;
      case "ON_HOLD":
        onHold++;
        break;
      case "DROPPED":
        dropped++;
        break;
    }
  }

  return {
    totalTracked,
    watched,
    watching,
    planToWatch,
    onHold,
    dropped,
  };
}

/**
 * Retrieve live dashboard statistics for the given user from PostgreSQL.
 * If no userId is supplied (guest/demo mode), falls back to demo title counts.
 */
export async function getDashboardStats(params: {
  userId?: string | null;
}): Promise<DashboardStats> {
  const { userId } = params;

  if (!userId) {
    // Guest or demo mode: aggregate counts from demo titles
    return computeDashboardStats(demoTitles);
  }

  try {
    const statusGroups = await withDbRetry(
      () =>
        prisma.userTitle.groupBy({
          by: ["status"],
          where: { userId },
          _count: { status: true },
        }),
      { label: "getDashboardStats" },
    );

    let totalTracked = 0;
    let watched = 0;
    let watching = 0;
    let planToWatch = 0;
    let onHold = 0;
    let dropped = 0;

    for (const group of statusGroups) {
      const count = group._count.status;
      totalTracked += count;

      switch (group.status) {
        case "WATCHED":
          watched += count;
          break;
        case "WATCHING":
          watching += count;
          break;
        case "PLAN_TO_WATCH":
          planToWatch += count;
          break;
        case "ON_HOLD":
          onHold += count;
          break;
        case "DROPPED":
          dropped += count;
          break;
      }
    }

    return {
      totalTracked,
      watched,
      watching,
      planToWatch,
      onHold,
      dropped,
    };
  } catch (error) {
    console.warn(
      "[DashboardService] Failed to fetch live dashboard stats from DB, falling back to 0s:",
      error instanceof Error ? error.message : error,
    );
    return {
      totalTracked: 0,
      watched: 0,
      watching: 0,
      planToWatch: 0,
      onHold: 0,
      dropped: 0,
    };
  }
}

/**
 * Returns synthetic demo items for the continue watching shelf.
 */
export function getDemoContinueWatchingItems(): ContinueWatchingItem[] {
  const watchingDemoTitles = demoTitles.filter(
    (t) => t.status === "WATCHING" && (t.type === "TV" || t.type === "ANIME"),
  );

  return watchingDemoTitles.map((t) => {
    let nextUp: ContinueWatchingItem["nextUp"] = null;
    let totalEpisodes = t.totalEpisodes || 12;
    let watchedEpisodes = t.currentEpisode || 1;
    let percentage = Math.round((watchedEpisodes / totalEpisodes) * 100);

    if (t.externalId === "1399") {
      // Breaking Bad demo
      totalEpisodes = 62;
      watchedEpisodes = 6;
      percentage = 10;
      nextUp = {
        seasonNumber: 1,
        episodeNumber: 7,
        name: "A No-Rough-Stuff-Type Deal",
      };
    } else if (t.externalId === "16498") {
      // Attack on Titan demo
      totalEpisodes = 87;
      watchedEpisodes = 4;
      percentage = 5;
      nextUp = {
        seasonNumber: 1,
        episodeNumber: 5,
        name: "First Battle: The Struggle for Trost, Part 1",
      };
    } else if (t.externalId === "94605") {
      // Arcane demo
      totalEpisodes = 9;
      watchedEpisodes = 3;
      percentage = 33;
      nextUp = {
        seasonNumber: 1,
        episodeNumber: 4,
        name: "Happy Progress Day!",
      };
    } else {
      nextUp = {
        seasonNumber: t.season || 1,
        episodeNumber: (t.episode || 1) + 1,
        name: `Episode ${(t.episode || 1) + 1}`,
      };
    }

    return {
      id: `demo-${t.externalSource}-${t.externalId}`,
      externalSource: t.externalSource,
      externalId: t.externalId,
      title: t.title,
      type: t.type as "TV" | "ANIME",
      posterUrl: t.posterUrl,
      backdropUrl: t.backdropUrl,
      year: t.year,
      userRating: t.rating,
      totalEpisodes,
      watchedEpisodes,
      percentage,
      nextUp,
      isCompleted: false,
      updatedAt: t.addedAt,
    };
  });
}

/**
 * Retrieve active television and anime titles for the continue watching shelf.
 * Calculates next up episode and percentage progress for each series.
 */
export async function getContinueWatching(params: {
  userId?: string | null;
  limit?: number;
}): Promise<ContinueWatchingItem[]> {
  const { userId, limit = 6 } = params;

  if (!userId) {
    return getDemoContinueWatchingItems().slice(0, limit);
  }

  try {
    const userTitles = await withDbRetry(
      () =>
        prisma.userTitle.findMany({
          where: {
            userId,
            status: "WATCHING",
            title: {
              type: { in: ["TV", "ANIME"] },
            },
          },
          orderBy: { updatedAt: "desc" },
          take: limit,
          include: {
            title: {
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
            },
          },
        }),
      { label: "getContinueWatching:titles" },
    );

    if (userTitles.length === 0) {
      return [];
    }

    // Collect all episode IDs across all fetched titles
    const allEpisodeIds = userTitles.flatMap((ut) =>
      ut.title.seasons.flatMap((s) => s.episodes.map((e) => e.id)),
    );

    let watchedEpisodeIdSet = new Set<string>();
    if (allEpisodeIds.length > 0) {
      const userEpisodes = await withDbRetry(
        () =>
          prisma.userEpisode.findMany({
            where: {
              userId,
              episodeId: { in: allEpisodeIds },
            },
            select: { episodeId: true },
          }),
        { label: "getContinueWatching:episodes" },
      );
      watchedEpisodeIdSet = new Set(userEpisodes.map((ue) => ue.episodeId));
    }

    return userTitles.map((ut) => {
      const title = ut.title;
      const watchedMap: Record<string, boolean> = {};

      if (title.seasons && title.seasons.length > 0) {
        const progressSeasons: ProgressSeasonItem[] = title.seasons.map((season) => ({
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

        const progress = computeSeriesProgress(progressSeasons, watchedMap);

        return {
          id: title.id,
          externalSource: title.externalSource,
          externalId: title.externalId,
          title: title.title,
          type: title.type as "TV" | "ANIME",
          posterUrl: title.posterUrl,
          backdropUrl: title.backdropUrl,
          year: title.year,
          userRating: ut.rating,
          totalEpisodes: progress.totalEpisodes,
          watchedEpisodes: progress.watchedEpisodes,
          percentage: progress.percentage,
          nextUp: progress.nextUp,
          isCompleted: progress.isCompleted,
          updatedAt: ut.updatedAt.toISOString(),
        };
      }

      // Fallback if seasons are not ingested yet
      return {
        id: title.id,
        externalSource: title.externalSource,
        externalId: title.externalId,
        title: title.title,
        type: title.type as "TV" | "ANIME",
        posterUrl: title.posterUrl,
        backdropUrl: title.backdropUrl,
        year: title.year,
        userRating: ut.rating,
        totalEpisodes: 0,
        watchedEpisodes: 0,
        percentage: 0,
        nextUp: {
          seasonNumber: 1,
          episodeNumber: 1,
          name: "Episode 1",
        },
        isCompleted: false,
        updatedAt: ut.updatedAt.toISOString(),
      };
    });
  } catch (error) {
    console.warn(
      "[DashboardService] Failed to fetch continue watching titles from DB, falling back to empty:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

/**
 * Returns synthetic demo items for the recently watched section.
 */
export function getDemoRecentlyWatchedItems(): RecentlyWatchedItem[] {
  const watchedDemoTitles = demoTitles.filter((t) => t.status === "WATCHED");

  return watchedDemoTitles.map((t) => ({
    id: `demo-${t.externalSource}-${t.externalId}`,
    externalSource: t.externalSource,
    externalId: t.externalId,
    title: t.title,
    type: t.type as "MOVIE" | "TV" | "ANIME",
    posterUrl: t.posterUrl,
    backdropUrl: t.backdropUrl,
    year: t.year,
    rating: t.rating,
    status: "WATCHED" as const,
    watchedAt: t.watchedAt || t.addedAt,
  }));
}

/**
 * Retrieve recently completed/watched titles for the dashboard.
 */
export async function getRecentlyWatched(params: {
  userId?: string | null;
  limit?: number;
}): Promise<RecentlyWatchedItem[]> {
  const { userId, limit = 8 } = params;

  if (!userId) {
    return getDemoRecentlyWatchedItems().slice(0, limit);
  }

  try {
    const userTitles = await withDbRetry(
      () =>
        prisma.userTitle.findMany({
          where: {
            userId,
            status: "WATCHED",
          },
          orderBy: [{ watchedAt: "desc" }, { updatedAt: "desc" }],
          take: limit,
          include: {
            title: true,
          },
        }),
      { label: "getRecentlyWatched" },
    );

    return userTitles.map((ut) => ({
      id: ut.title.id,
      externalSource: ut.title.externalSource,
      externalId: ut.title.externalId,
      title: ut.title.title,
      type: ut.title.type as "MOVIE" | "TV" | "ANIME",
      posterUrl: ut.title.posterUrl,
      backdropUrl: ut.title.backdropUrl,
      year: ut.title.year,
      rating: ut.rating,
      status: "WATCHED" as const,
      watchedAt: ut.watchedAt?.toISOString() || ut.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.warn(
      "[DashboardService] Failed to fetch recently watched titles from DB, falling back to empty:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

/**
 * Pure function to calculate dashboard analytics from an array of titles and episode count.
 */
export function computeDashboardAnalytics(
  items: Array<{
    type?: string | null;
    rating?: number | null;
  }>,
  episodeCount = 0,
): DashboardAnalytics {
  let movies = 0;
  let tv = 0;
  let anime = 0;
  let ratingSum = 0;
  let ratedCount = 0;

  for (const item of items) {
    if (item.type === "MOVIE") movies++;
    else if (item.type === "TV") tv++;
    else if (item.type === "ANIME") anime++;

    if (typeof item.rating === "number" && !isNaN(item.rating)) {
      ratingSum += item.rating;
      ratedCount++;
    }
  }

  const averageRating = ratedCount > 0 ? Math.round((ratingSum / ratedCount) * 10) / 10 : null;

  return {
    countsByType: { movies, tv, anime },
    averageRating,
    ratedCount,
    totalWatchedEpisodes: episodeCount,
  };
}

/**
 * Returns synthetic demo dashboard analytics.
 */
export function getDemoDashboardAnalytics(): DashboardAnalytics {
  const demoEpisodesWatched = demoTitles
    .filter((t) => t.status === "WATCHING" && t.currentEpisode)
    .reduce((acc, t) => acc + (t.currentEpisode || 0), 0);

  return computeDashboardAnalytics(demoTitles, demoEpisodesWatched || 13);
}

/**
 * Retrieves simple analytics for the dashboard (Day 38):
 * - Title counts by type (Movies, TV, Anime)
 * - Average personal rating and count of rated titles
 * - Total watched episodes across TV and anime
 */
export async function getDashboardAnalytics(params: {
  userId?: string | null;
}): Promise<DashboardAnalytics> {
  const { userId } = params;

  if (!userId) {
    return getDemoDashboardAnalytics();
  }

  try {
    const [movieCount, tvCount, animeCount, ratingAgg, episodeCount] = await withDbRetry(
      () =>
        Promise.all([
          prisma.userTitle.count({
            where: { userId, title: { type: "MOVIE" } },
          }),
          prisma.userTitle.count({
            where: { userId, title: { type: "TV" } },
          }),
          prisma.userTitle.count({
            where: { userId, title: { type: "ANIME" } },
          }),
          prisma.userTitle.aggregate({
            where: { userId, rating: { not: null } },
            _avg: { rating: true },
            _count: { rating: true },
          }),
          prisma.userEpisode.count({
            where: { userId },
          }),
        ]),
      { label: "getDashboardAnalytics" },
    );

    const rawAvg = ratingAgg._avg.rating;
    const averageRating =
      typeof rawAvg === "number" && !isNaN(rawAvg) ? Math.round(rawAvg * 10) / 10 : null;

    return {
      countsByType: {
        movies: movieCount,
        tv: tvCount,
        anime: animeCount,
      },
      averageRating,
      ratedCount: ratingAgg._count.rating,
      totalWatchedEpisodes: episodeCount,
    };
  } catch (error) {
    console.warn(
      "[DashboardService] Failed to fetch dashboard analytics from DB, falling back to 0s:",
      error instanceof Error ? error.message : error,
    );
    return {
      countsByType: { movies: 0, tv: 0, anime: 0 },
      averageRating: null,
      ratedCount: 0,
      totalWatchedEpisodes: 0,
    };
  }
}
