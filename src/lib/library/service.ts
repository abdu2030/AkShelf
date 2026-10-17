import { prisma } from "@/lib/db";
import { demoLibraryItems } from "@/lib/data/demo-titles";
import { MediaCardProps } from "@/components/title/media-card";
import { WatchStatusType } from "@/components/ui/status-badge";
import { MediaType } from "@/lib/metadata/types";
import { metadataService } from "@/lib/metadata";

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

    // Auto-heal missing posters and basic metadata for library titles
    await Promise.all(
      userTitles.map(async (ut) => {
        const title = ut.title;
        if (!title.posterUrl && title.externalSource && title.externalId) {
          try {
            const meta = await metadataService.getTitleDetails(
              title.externalSource as "tmdb" | "anilist",
              title.externalId,
            );
            if (meta?.posterUrl) {
              title.posterUrl = meta.posterUrl;
              if (!title.year && meta.year) title.year = meta.year;
              if (!title.overview && meta.overview) title.overview = meta.overview;
              if (!title.backdropUrl && meta.backdropUrl) title.backdropUrl = meta.backdropUrl;
              if ((!title.genres || title.genres.length === 0) && meta.genres?.length) {
                title.genres = meta.genres;
              }

              if (prisma.title?.update) {
                await prisma.title.update({
                  where: { id: title.id },
                  data: {
                    posterUrl: meta.posterUrl,
                    backdropUrl: meta.backdropUrl || null,
                    year: meta.year || title.year,
                    overview: meta.overview || title.overview,
                    genres: meta.genres || title.genres,
                  },
                });
              }
            }
          } catch {
            // Graceful fallback
          }
        }
      }),
    );

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
