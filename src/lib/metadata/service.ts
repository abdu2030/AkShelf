import { AniListClient } from "@/lib/anilist";
import { TmdbClient } from "@/lib/tmdb";
import { MetadataCache, metadataCache } from "./cache";
import { aniListMediaToMediaResult } from "./translators/anilist";
import {
  tmdbMovieToMediaResult,
  tmdbSeasonToNormalizedSeason,
  tmdbTvToMediaResult,
} from "./translators/tmdb";
import {
  ExternalSource,
  MediaResult,
  MediaType,
  MetadataSearchOptions,
  NormalizedSeason,
} from "./types";

export interface MetadataServiceConfig {
  tmdbClient?: TmdbClient;
  aniListClient?: AniListClient;
  cache?: MetadataCache;
}

const SEARCH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const DETAILS_CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Unified metadata orchestrator combining TMDB, AniList, normalizers,
 * and intelligent multi-tier caching.
 */
export class MetadataService {
  private tmdb: TmdbClient;
  private anilist: AniListClient;
  private cache: MetadataCache;

  constructor(config: MetadataServiceConfig = {}) {
    this.tmdb = config.tmdbClient ?? new TmdbClient();
    this.anilist = config.aniListClient ?? new AniListClient();
    this.cache = config.cache ?? metadataCache;
  }

  /**
   * Searches TMDB for movies, translating results into MediaResult.
   */
  async searchMovies(
    query: string,
    options: { page?: number; cacheTtlMs?: number } = {},
  ): Promise<MediaResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const page = options.page ?? 1;
    const cacheKey = `search:movie:${trimmed.toLowerCase()}:${page}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        try {
          const res = await this.tmdb.searchMovies(trimmed, page);
          return res.results.map((m) => tmdbMovieToMediaResult(m));
        } catch (error) {
          console.error("[MetadataService] searchMovies failed:", error);
          return [];
        }
      },
      options.cacheTtlMs ?? SEARCH_CACHE_TTL,
    );
  }

  /**
   * Searches TMDB for TV series, translating results into MediaResult.
   */
  async searchTv(
    query: string,
    options: { page?: number; cacheTtlMs?: number } = {},
  ): Promise<MediaResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const page = options.page ?? 1;
    const cacheKey = `search:tv:${trimmed.toLowerCase()}:${page}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        try {
          const res = await this.tmdb.searchTv(trimmed, page);
          return res.results.map((t) => tmdbTvToMediaResult(t));
        } catch (error) {
          console.error("[MetadataService] searchTv failed:", error);
          return [];
        }
      },
      options.cacheTtlMs ?? SEARCH_CACHE_TTL,
    );
  }

  /**
   * Searches AniList for anime, translating results into MediaResult.
   */
  async searchAnime(
    query: string,
    options: { page?: number; perPage?: number; cacheTtlMs?: number } = {},
  ): Promise<MediaResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const page = options.page ?? 1;
    const perPage = options.perPage ?? 10;
    const cacheKey = `search:anime:${trimmed.toLowerCase()}:${page}:${perPage}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        try {
          const res = await this.anilist.searchAnime(trimmed, page, perPage);
          return (res.media || []).map((a) => aniListMediaToMediaResult(a));
        } catch (error) {
          console.error("[MetadataService] searchAnime failed:", error);
          return [];
        }
      },
      options.cacheTtlMs ?? SEARCH_CACHE_TTL,
    );
  }

  /**
   * Cross-provider unified search across Movies, TV Shows, and Anime.
   */
  async search(query: string, options: MetadataSearchOptions = {}): Promise<MediaResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const type = options.type || "ALL";
    const limit = options.limit ?? 20;

    if (type === "MOVIE") {
      return (await this.searchMovies(trimmed, { page: options.page })).slice(0, limit);
    }
    if (type === "TV") {
      return (await this.searchTv(trimmed, { page: options.page })).slice(0, limit);
    }
    if (type === "ANIME") {
      return (await this.searchAnime(trimmed, { page: options.page })).slice(0, limit);
    }

    // "ALL" - query all three providers concurrently
    const [movieRes, tvRes, animeRes] = await Promise.allSettled([
      this.searchMovies(trimmed),
      this.searchTv(trimmed),
      this.searchAnime(trimmed),
    ]);

    const movies = movieRes.status === "fulfilled" ? movieRes.value : [];
    const tv = tvRes.status === "fulfilled" ? tvRes.value : [];
    const anime = animeRes.status === "fulfilled" ? animeRes.value : [];

    // Interleave or combine results ranked by popularity
    const combined = [...movies, ...tv, ...anime].sort((a, b) => {
      const popA = a.popularity ?? 0;
      const popB = b.popularity ?? 0;
      return popB - popA;
    });

    return combined.slice(0, limit);
  }

  /**
   * Fetches full movie details with credits and trailers from TMDB.
   */
  async getMovieDetails(id: number | string): Promise<MediaResult> {
    const numericId = typeof id === "string" ? parseInt(id, 10) : id;
    const cacheKey = `details:tmdb:movie:${numericId}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const raw = await this.tmdb.getMovieDetails(numericId);
        return tmdbMovieToMediaResult(raw);
      },
      DETAILS_CACHE_TTL,
    );
  }

  /**
   * Fetches full TV show details with credits, seasons, and trailers from TMDB.
   */
  async getTvDetails(id: number | string): Promise<MediaResult> {
    const numericId = typeof id === "string" ? parseInt(id, 10) : id;
    const cacheKey = `details:tmdb:tv:${numericId}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const raw = await this.tmdb.getTvDetails(numericId);
        return tmdbTvToMediaResult(raw);
      },
      DETAILS_CACHE_TTL,
    );
  }

  /**
   * Fetches full anime details from AniList.
   */
  async getAnimeDetails(id: number | string): Promise<MediaResult> {
    const numericId = typeof id === "string" ? parseInt(id, 10) : id;
    const cacheKey = `details:anilist:${numericId}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const raw = await this.anilist.getAnimeDetails(numericId);
        return aniListMediaToMediaResult(raw);
      },
      DETAILS_CACHE_TTL,
    );
  }

  /**
   * Fetches detailed metadata for any title by source, ID, and optional media type.
   */
  async getTitleDetails(
    source: ExternalSource,
    id: number | string,
    type?: MediaType,
  ): Promise<MediaResult> {
    if (source === "anilist") {
      return this.getAnimeDetails(id);
    }

    if (source === "tmdb") {
      if (type === "TV") {
        return this.getTvDetails(id);
      }
      return this.getMovieDetails(id);
    }

    throw new Error(`Unsupported external metadata provider: ${source}`);
  }

  /**
   * Fetches episodes for a specific TV series season.
   */
  async getTvSeason(tvId: number | string, seasonNumber: number): Promise<NormalizedSeason> {
    const numericId = typeof tvId === "string" ? parseInt(tvId, 10) : tvId;
    const cacheKey = `season:tmdb:${numericId}:${seasonNumber}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const raw = await this.tmdb.getTvSeason(numericId, seasonNumber);
        return tmdbSeasonToNormalizedSeason(raw);
      },
      DETAILS_CACHE_TTL,
    );
  }

  /**
   * Clears the underlying metadata cache.
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Shared singleton instance of MetadataService.
 */
export const metadataService = new MetadataService();
