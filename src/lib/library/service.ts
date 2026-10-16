import { prisma } from "@/lib/db";
import { demoLibraryItems } from "@/lib/data/demo-titles";
import { MediaCardProps } from "@/components/title/media-card";
import { WatchStatusType } from "@/components/ui/status-badge";
import { MediaType } from "@/lib/metadata/types";

export interface GetLibraryItemsOptions {
  userId?: string | null;
}

/**
 * Retrieves normalized library items for an authenticated user.
 * Falls back to demo titles for unauthenticated guests or if database query fails.
 */
export async function getLibraryItems(
  options: GetLibraryItemsOptions = {},
): Promise<MediaCardProps[]> {
  const { userId } = options;

  if (!userId) {
    return demoLibraryItems;
  }

  try {
    const userTitles = await prisma.userTitle.findMany({
      where: { userId },
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
      orderBy: { updatedAt: "desc" },
    });

    if (userTitles.length === 0) {
      return [];
    }

    const userEpisodes = await prisma.userEpisode.findMany({
      where: { userId },
      select: { episodeId: true },
    });
    const watchedEpisodeSet = new Set(userEpisodes.map((ue) => ue.episodeId));

    return userTitles.map((ut) => {
      const title = ut.title;
      let watchedCount = 0;
      let nextUpSeason: number | null = null;
      let nextUpEpisode: number | null = null;

      for (const season of title.seasons) {
        for (const ep of season.episodes) {
          if (watchedEpisodeSet.has(ep.id)) {
            watchedCount++;
          } else if (nextUpSeason === null) {
            nextUpSeason = season.seasonNumber;
            nextUpEpisode = ep.episodeNumber;
          }
        }
      }

      const totalEpisodes = title.seasons.reduce((acc, s) => acc + s.episodeCount, 0) || null;

      return {
        id: `db-${title.id}`,
        title: title.title,
        mediaType: title.type as MediaType,
        year: title.year,
        posterUrl: title.posterUrl,
        status: ut.status as WatchStatusType,
        rating: ut.rating,
        season: nextUpSeason,
        episode: nextUpEpisode,
        currentEpisode: watchedCount,
        totalEpisodes,
        addedAt: ut.createdAt.toISOString(),
        watchedAt: ut.watchedAt?.toISOString() ?? null,
        updatedAt: ut.updatedAt.toISOString(),
      };
    });
  } catch (error) {
    console.error("[LibraryService] Failed to fetch user library from DB:", error);
    return demoLibraryItems;
  }
}
