import { RateLimiter } from "@/lib/utils/rate-limiter";
import { SEARCH_ANIME_QUERY, ANIME_DETAILS_QUERY, ANIME_BY_MAL_ID_QUERY } from "./queries";
import {
  AniListMedia,
  AniListMediaSchema,
  AniListPageInfoSchema,
  AniListSearchResponse,
} from "./types";

export interface AniListClientConfig {
  endpoint?: string;
  rateLimiter?: RateLimiter;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; status?: number }>;
}

export class AniListClient {
  private endpoint: string;
  private rateLimiter: RateLimiter;

  constructor(config: AniListClientConfig = {}) {
    this.endpoint = config.endpoint ?? "https://graphql.anilist.co";

    // AniList rate limit: 90 requests per minute.
    // We throttle at 75 requests per 60,000ms with retry backoff to stay safely compliant.
    this.rateLimiter =
      config.rateLimiter ??
      new RateLimiter({
        maxRequests: 75,
        perWindowMs: 60000,
        maxRetries: 3,
        initialRetryDelayMs: 600,
      });
  }

  /**
   * Internal GraphQL POST request executor.
   */
  private async execute<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    return this.rateLimiter.schedule(
      async () => {
        const response = await fetch(this.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ query, variables }),
        });

        if (!response.ok) {
          const status = response.status;
          let errorMessage = `AniList GraphQL request failed with status ${status}`;
          try {
            const body = (await response.json()) as GraphQLResponse<unknown>;
            if (body.errors && body.errors.length > 0) {
              errorMessage = `AniList error (${status}): ${body.errors.map((e) => e.message).join(", ")}`;
            }
          } catch {
            // body was not JSON
          }
          throw new Error(errorMessage);
        }

        const json = (await response.json()) as GraphQLResponse<T>;

        if (json.errors && json.errors.length > 0) {
          throw new Error(`AniList GraphQL error: ${json.errors.map((e) => e.message).join(", ")}`);
        }

        if (!json.data) {
          throw new Error("AniList returned empty data in GraphQL response");
        }

        return json.data;
      },
      { timeoutMs: 10000 },
    );
  }

  /**
   * Search anime titles by search term.
   */
  async searchAnime(query: string, page = 1, perPage = 20): Promise<AniListSearchResponse> {
    if (!query.trim()) {
      return {
        pageInfo: {
          total: 0,
          perPage,
          currentPage: page,
          lastPage: 1,
          hasNextPage: false,
        },
        media: [],
      };
    }

    interface SearchData {
      Page: {
        pageInfo: unknown;
        media: unknown[];
      };
    }

    const data = await this.execute<SearchData>(SEARCH_ANIME_QUERY, {
      search: query.trim(),
      page,
      perPage,
    });

    const parsedPageInfo = AniListPageInfoSchema.parse(data.Page.pageInfo);
    const parsedMedia = data.Page.media
      .map((item) => {
        const res = AniListMediaSchema.safeParse(item);
        return res.success ? res.data : null;
      })
      .filter((m): m is AniListMedia => m !== null);

    return {
      pageInfo: parsedPageInfo,
      media: parsedMedia,
    };
  }

  /**
   * Fetch complete anime details by AniList ID.
   */
  async getAnimeDetails(id: number): Promise<AniListMedia> {
    interface DetailsData {
      Media: unknown;
    }

    const data = await this.execute<DetailsData>(ANIME_DETAILS_QUERY, { id });
    const parsed = AniListMediaSchema.safeParse(data.Media);

    if (!parsed.success) {
      throw new Error(`Failed to parse AniList media details: ${parsed.error.message}`);
    }

    return parsed.data;
  }

  /**
   * Fetch anime details by MyAnimeList ID.
   */
  async getAnimeByMalId(idMal: number): Promise<AniListMedia> {
    interface MalData {
      Media: unknown;
    }

    const data = await this.execute<MalData>(ANIME_BY_MAL_ID_QUERY, { idMal });
    const parsed = AniListMediaSchema.safeParse(data.Media);

    if (!parsed.success) {
      throw new Error(`Failed to parse AniList media by MAL ID: ${parsed.error.message}`);
    }

    return parsed.data;
  }
}

/** Singleton instance configured with standard endpoint */
export const anilistClient = new AniListClient();
