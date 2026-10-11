import { RateLimiter } from "@/lib/utils/rate-limiter";
import {
  TmdbMovieDetails,
  TmdbMovieDetailsSchema,
  TmdbMovieSearchResult,
  TmdbMovieSearchResultSchema,
  TmdbSeasonDetails,
  TmdbSeasonDetailsSchema,
  TmdbTvDetails,
  TmdbTvDetailsSchema,
  TmdbTvSearchResult,
  TmdbTvSearchResultSchema,
} from "./types";

export interface TmdbClientConfig {
  apiKey?: string;
  readAccessToken?: string;
  baseUrl?: string;
  rateLimiter?: RateLimiter;
}

export interface TmdbPaginatedResponse<T> {
  page: number;
  results: T[];
  totalPages: number;
  totalResults: number;
}

export class TmdbClient {
  private baseUrl: string;
  private apiKey?: string;
  private readAccessToken?: string;
  private rateLimiter: RateLimiter;

  constructor(config: TmdbClientConfig = {}) {
    this.baseUrl = config.baseUrl ?? "https://api.themoviedb.org/3";
    this.apiKey = config.apiKey ?? process.env.TMDB_API_KEY;
    this.readAccessToken =
      config.readAccessToken ??
      process.env.TMDB_API_READ_ACCESS_TOKEN ??
      process.env.TMDB_READ_ACCESS_TOKEN;

    // TMDB official recommendation: stay under ~40 requests per 10 seconds
    this.rateLimiter =
      config.rateLimiter ??
      new RateLimiter({
        maxRequests: 35,
        perWindowMs: 10000,
        maxRetries: 3,
        initialRetryDelayMs: 400,
      });
  }

  /**
   * Returns true if client has valid authentication configured.
   */
  hasAuth(): boolean {
    return Boolean(this.readAccessToken || this.apiKey);
  }

  /**
   * Internal request handler with header setup, rate limiting, and validation.
   */
  private async request<T>(
    endpoint: string,
    params: Record<string, string | number> = {},
  ): Promise<T> {
    if (!this.hasAuth()) {
      console.warn(
        `[TmdbClient] Missing TMDB_API_KEY or TMDB_API_READ_ACCESS_TOKEN. Request to ${endpoint} skipped.`,
      );
      throw new Error("TMDB API credentials are not configured");
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);

    // If using API Key rather than Bearer token, append as query parameter
    if (this.apiKey && !this.readAccessToken) {
      url.searchParams.set("api_key", this.apiKey);
    }

    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null) {
        url.searchParams.set(key, String(val));
      }
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    if (this.readAccessToken) {
      headers.Authorization = `Bearer ${this.readAccessToken}`;
    }

    return this.rateLimiter.schedule(
      async () => {
        const response = await fetch(url.toString(), {
          method: "GET",
          headers,
        });

        if (!response.ok) {
          const status = response.status;
          let errorMessage = `TMDB request failed with status ${status}`;
          try {
            const errorJson = await response.json();
            if (errorJson.status_message) {
              errorMessage = `TMDB error (${status}): ${errorJson.status_message}`;
            }
          } catch {
            // response was not JSON
          }
          throw new Error(errorMessage);
        }

        return (await response.json()) as T;
      },
      { timeoutMs: 10000 },
    );
  }

  /**
   * Search movies by query.
   */
  async searchMovies(
    query: string,
    page = 1,
  ): Promise<TmdbPaginatedResponse<TmdbMovieSearchResult>> {
    if (!query.trim()) {
      return { page: 1, results: [], totalPages: 0, totalResults: 0 };
    }

    const raw = await this.request<{
      page: number;
      results: unknown[];
      total_pages: number;
      total_results: number;
    }>("/search/movie", {
      query: query.trim(),
      page,
      include_adult: "false",
    });

    const parsedResults = raw.results
      .map((item) => {
        const res = TmdbMovieSearchResultSchema.safeParse(item);
        return res.success ? res.data : null;
      })
      .filter((item): item is TmdbMovieSearchResult => item !== null);

    return {
      page: raw.page,
      results: parsedResults,
      totalPages: raw.total_pages,
      totalResults: raw.total_results,
    };
  }

  /**
   * Search TV shows by query.
   */
  async searchTv(query: string, page = 1): Promise<TmdbPaginatedResponse<TmdbTvSearchResult>> {
    if (!query.trim()) {
      return { page: 1, results: [], totalPages: 0, totalResults: 0 };
    }

    const raw = await this.request<{
      page: number;
      results: unknown[];
      total_pages: number;
      total_results: number;
    }>("/search/tv", {
      query: query.trim(),
      page,
      include_adult: "false",
    });

    const parsedResults = raw.results
      .map((item) => {
        const res = TmdbTvSearchResultSchema.safeParse(item);
        return res.success ? res.data : null;
      })
      .filter((item): item is TmdbTvSearchResult => item !== null);

    return {
      page: raw.page,
      results: parsedResults,
      totalPages: raw.total_pages,
      totalResults: raw.total_results,
    };
  }

  /**
   * Fetch full movie details with credits and videos.
   */
  async getMovieDetails(id: number | string): Promise<TmdbMovieDetails> {
    const raw = await this.request<unknown>(`/movie/${id}`, {
      append_to_response: "credits,videos",
    });

    const parsed = TmdbMovieDetailsSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`Failed to parse TMDB movie details: ${parsed.error.message}`);
    }
    return parsed.data;
  }

  /**
   * Fetch full TV show details with credits, videos, and season breakdown.
   */
  async getTvDetails(id: number | string): Promise<TmdbTvDetails> {
    const raw = await this.request<unknown>(`/tv/${id}`, {
      append_to_response: "credits,videos",
    });

    const parsed = TmdbTvDetailsSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`Failed to parse TMDB TV details: ${parsed.error.message}`);
    }
    return parsed.data;
  }

  /**
   * Fetch detailed episode list for a specific TV season.
   */
  async getTvSeason(id: number | string, seasonNumber: number): Promise<TmdbSeasonDetails> {
    const raw = await this.request<unknown>(`/tv/${id}/season/${seasonNumber}`);

    const parsed = TmdbSeasonDetailsSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`Failed to parse TMDB season details: ${parsed.error.message}`);
    }
    return parsed.data;
  }
}

/** Singleton instance configured with standard environment credentials */
export const tmdbClient = new TmdbClient();
