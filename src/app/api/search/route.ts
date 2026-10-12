import { NextRequest, NextResponse } from "next/server";
import { metadataService } from "@/lib/metadata";
import { demoTitles } from "@/lib/data/demo-titles";
import { MediaType } from "@/lib/metadata/types";
import { WatchStatusType } from "@/components/ui/status-badge";

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

  // 1. Search locally on user's shelf (demoTitles + seeded library)
  const shelfMatches: SearchResultItem[] = demoTitles
    .filter((title) => {
      if (type !== "ALL" && title.type !== type) return false;
      const matchesTitle = title.title.toLowerCase().includes(queryLower);
      const matchesOverview = title.overview?.toLowerCase().includes(queryLower);
      const matchesGenre = title.genres.some((g) => g.toLowerCase().includes(queryLower));
      return matchesTitle || matchesOverview || matchesGenre;
    })
    .map((title) => ({
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
    }));

  // Create a quick lookup map of tracked items to badge external results
  const shelfKeySet = new Set(demoTitles.map((t) => `${t.externalSource}:${t.externalId}`));
  const shelfLookup = new Map(demoTitles.map((t) => [`${t.externalSource}:${t.externalId}`, t]));

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
        const isOnShelf = shelfKeySet.has(key);

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
    // Even if external provider fails, onShelf results are still safely returned
  }

  return NextResponse.json({
    onShelf: shelfMatches,
    results: externalResults,
  });
}
