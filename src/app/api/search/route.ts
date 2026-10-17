import { NextRequest, NextResponse } from "next/server";
import { metadataService } from "@/lib/metadata";
import { demoTitles } from "@/lib/data/demo-titles";
import { MediaType } from "@/lib/metadata/types";
import { WatchStatusType } from "@/components/ui/status-badge";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export interface SearchResultItem {
  id: string;
  externalSource: "tmdb" | "anilist";
  externalId: string;
  type: MediaType;
  title: string;
  originalTitle?: string | null;
  overview?: string | null;
  year?: number | null;
  releaseDate?: string | null;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  genres: string[];
  voteAverage?: number | null;
  totalEpisodes?: number | null;
  totalSeasons?: number | null;
  isOnShelf: boolean;
  status?: WatchStatusType | null;
  rating?: number | null;
  season?: number | null;
  episode?: number | null;
  currentEpisode?: number | null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";
  const rawType = searchParams.get("type")?.toUpperCase();
  const type: MediaType | "ALL" =
    rawType === "MOVIE" || rawType === "TV" || rawType === "ANIME" ? rawType : "ALL";

  if (q.length < 2) {
    return NextResponse.json({ onShelf: [], results: [] });
  }

  const queryLower = q.toLowerCase();

  let session = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }
  const userId = session?.user?.id;

  const shelfMatches: SearchResultItem[] = [];
  const shelfLookup = new Map<
    string,
    {
      status: WatchStatusType | null;
      rating: number | null;
      season: number | null;
      episode: number | null;
      currentEpisode: number | null;
    }
  >();

  // 1. If user is authenticated, query real library in PostgreSQL
  if (userId) {
    try {
      const [userTitles, userEpisodes] = await Promise.all([
        prisma.userTitle.findMany({
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
        }),
        prisma.userEpisode.findMany({
          where: { userId },
          select: { episodeId: true },
        }),
      ]);

      const watchedEpisodeSet = new Set(userEpisodes.map((ue) => ue.episodeId));

      for (const ut of userTitles) {
        const title = ut.title;
        const key = `${title.externalSource}:${title.externalId}`;
        const isMovie = title.type === "MOVIE";

        let watchedCount = 0;
        let nextUpSeason: number | null = null;
        let nextUpEpisode: number | null = null;

        if (!isMovie) {
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
        }

        shelfLookup.set(key, {
          status: ut.status as WatchStatusType,
          rating: ut.rating,
          season: isMovie ? null : nextUpSeason,
          episode: isMovie ? null : nextUpEpisode,
          currentEpisode: isMovie ? null : watchedCount,
        });

        // Check if title matches query and media type
        if (type !== "ALL" && title.type !== type) continue;

        const matchesTitle = title.title.toLowerCase().includes(queryLower);
        const matchesOverview = title.overview?.toLowerCase().includes(queryLower);
        const matchesGenre = title.genres.some((g) => g.toLowerCase().includes(queryLower));

        if (matchesTitle || matchesOverview || matchesGenre) {
          shelfMatches.push({
            id: `db-${title.id}`,
            externalSource: title.externalSource as "tmdb" | "anilist",
            externalId: title.externalId,
            type: title.type as MediaType,
            title: title.title,
            overview: title.overview,
            year: title.year,
            posterUrl: title.posterUrl,
            backdropUrl: title.backdropUrl,
            genres: title.genres,
            voteAverage: null,
            totalEpisodes: isMovie
              ? null
              : title.seasons.reduce((acc, s) => acc + s.episodeCount, 0) || null,
            totalSeasons: isMovie ? null : title.seasons.length || null,
            isOnShelf: true,
            status: ut.status as WatchStatusType,
            rating: ut.rating,
            season: isMovie ? null : nextUpSeason,
            episode: isMovie ? null : nextUpEpisode,
            currentEpisode: isMovie ? null : watchedCount,
          });
        }
      }
    } catch (dbError) {
      console.error("[API Search Route] Database query failed, falling back to demo:", dbError);
    }
  }

  // Fallback to demoTitles if unauthenticated or if user has no shelf matches
  if (!userId || (shelfMatches.length === 0 && shelfLookup.size === 0)) {
    for (const title of demoTitles) {
      const key = `${title.externalSource}:${title.externalId}`;
      shelfLookup.set(key, {
        status: title.status,
        rating: title.rating ?? null,
        season: title.season || null,
        episode: title.episode || null,
        currentEpisode: title.currentEpisode || null,
      });

      if (type !== "ALL" && title.type !== type) continue;

      const matchesTitle = title.title.toLowerCase().includes(queryLower);
      const matchesOverview = title.overview?.toLowerCase().includes(queryLower);
      const matchesGenre = title.genres.some((g) => g.toLowerCase().includes(queryLower));

      if (matchesTitle || matchesOverview || matchesGenre) {
        shelfMatches.push({
          id: `demo-${title.externalSource}-${title.externalId}`,
          externalSource: title.externalSource,
          externalId: title.externalId,
          type: title.type,
          title: title.title,
          overview: title.overview,
          year: title.year,
          posterUrl: title.posterUrl,
          backdropUrl: title.backdropUrl,
          genres: title.genres,
          voteAverage: null,
          totalEpisodes: title.totalEpisodes,
          totalSeasons: title.seasons?.length || null,
          isOnShelf: true,
          status: title.status,
          rating: title.rating,
          season: title.season,
          episode: title.episode,
          currentEpisode: title.currentEpisode,
        });
      }
    }
  }

  // 2. Fetch external provider results via unified MetadataService
  let externalResults: SearchResultItem[] = [];
  try {
    const rawExternal = await metadataService.search(q, {
      type,
      limit: 20,
    });

    externalResults = rawExternal
      // Deduplicate items that already appear in "ON YOUR SHELF"
      .filter(
        (item) =>
          !shelfMatches.some(
            (shelf) =>
              shelf.externalSource === item.externalSource && shelf.externalId === item.externalId,
          ),
      )
      .map((item) => {
        const key = `${item.externalSource}:${item.externalId}`;
        const shelfMatch = shelfLookup.get(key);
        const isOnShelf = Boolean(shelfMatch);

        return {
          id: item.id,
          externalSource: item.externalSource,
          externalId: item.externalId,
          type: item.type,
          title: item.title,
          originalTitle: item.originalTitle,
          overview: item.overview,
          year: item.year,
          releaseDate: item.releaseDate,
          posterUrl: item.posterUrl,
          backdropUrl: item.backdropUrl,
          genres: item.genres,
          voteAverage: item.voteAverage,
          totalEpisodes: item.totalEpisodes,
          totalSeasons: item.totalSeasons,
          isOnShelf,
          status: shelfMatch?.status || null,
          rating: shelfMatch?.rating || null,
          season: shelfMatch?.season || null,
          episode: shelfMatch?.episode || null,
          currentEpisode: shelfMatch?.currentEpisode || null,
        };
      });
  } catch (error) {
    console.error("[API Search Route] Provider search failed:", error);
  }

  return NextResponse.json({
    onShelf: shelfMatches,
    results: externalResults,
  });
}
