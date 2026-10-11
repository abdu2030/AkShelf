import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TmdbClient } from "./client";
import { getTmdbImageUrl } from "./types";
import { RateLimiter } from "@/lib/utils/rate-limiter";

describe("TMDB API Client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("getTmdbImageUrl helper", () => {
    it("returns null for null or undefined path", () => {
      expect(getTmdbImageUrl(null)).toBeNull();
      expect(getTmdbImageUrl(undefined)).toBeNull();
      expect(getTmdbImageUrl("")).toBeNull();
    });

    it("constructs w500 URL by default", () => {
      expect(getTmdbImageUrl("/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg")).toBe(
        "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
      );
    });

    it("constructs URL with specified size and missing leading slash", () => {
      expect(getTmdbImageUrl("poster.jpg", "original")).toBe(
        "https://image.tmdb.org/t/p/original/poster.jpg",
      );
    });
  });

  describe("TmdbClient authentication guard", () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it("throws clear error when credentials are not configured", async () => {
      delete process.env.TMDB_API_KEY;
      delete process.env.TMDB_API_READ_ACCESS_TOKEN;
      delete process.env.TMDB_READ_ACCESS_TOKEN;

      const client = new TmdbClient({ apiKey: undefined, readAccessToken: undefined });
      expect(client.hasAuth()).toBe(false);

      await expect(client.searchMovies("Inception")).rejects.toThrow(
        "TMDB API credentials are not configured",
      );
    });

    it("throws clear error when instantiated with no config and missing env vars", async () => {
      delete process.env.TMDB_API_KEY;
      delete process.env.TMDB_API_READ_ACCESS_TOKEN;
      delete process.env.TMDB_READ_ACCESS_TOKEN;

      const client = new TmdbClient();
      expect(client.hasAuth()).toBe(false);

      await expect(client.searchMovies("Inception")).rejects.toThrow(
        "TMDB API credentials are not configured",
      );
    });

    it("overrides ambient process.env when explicit empty credentials are passed", async () => {
      process.env.TMDB_API_KEY = "ambient-key";
      const client = new TmdbClient({ apiKey: undefined, readAccessToken: undefined });
      expect(client.hasAuth()).toBe(false);
    });
  });

  describe("searchMovies", () => {
    it("fetches and validates movie search results", async () => {
      const mockResponse = {
        page: 1,
        results: [
          {
            id: 27205,
            title: "Inception",
            overview: "A thief enters the dreams of others.",
            poster_path: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
            backdrop_path: "/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
            release_date: "2010-07-15",
            vote_average: 8.4,
            vote_count: 36000,
            popularity: 85.2,
            genre_ids: [28, 878, 12],
          },
        ],
        total_pages: 1,
        total_results: 1,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const client = new TmdbClient({
        apiKey: "test-api-key",
        rateLimiter: new RateLimiter({ maxRequests: 50, perWindowMs: 1000 }),
      });

      const data = await client.searchMovies("Inception");

      expect(data.page).toBe(1);
      expect(data.totalResults).toBe(1);
      expect(data.results[0].title).toBe("Inception");
      expect(data.results[0].release_date).toBe("2010-07-15");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/search/movie?api_key=test-api-key&query=Inception"),
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("returns empty results for empty query without calling fetch", async () => {
      const client = new TmdbClient({ apiKey: "test" });
      const fetchSpy = vi.fn();
      global.fetch = fetchSpy;

      const res = await client.searchMovies("   ");
      expect(res.results).toEqual([]);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe("searchTv", () => {
    it("fetches and validates TV search results using Bearer token", async () => {
      const mockResponse = {
        page: 1,
        results: [
          {
            id: 1396,
            name: "Breaking Bad",
            overview: "Chemistry teacher turns meth kingpin.",
            poster_path: "/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg",
            backdrop_path: "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
            first_air_date: "2008-01-20",
            vote_average: 8.9,
            vote_count: 14000,
            popularity: 110.5,
            genre_ids: [18, 80],
          },
        ],
        total_pages: 1,
        total_results: 1,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const client = new TmdbClient({
        readAccessToken: "test-token",
        rateLimiter: new RateLimiter({ maxRequests: 50, perWindowMs: 1000 }),
      });

      const data = await client.searchTv("Breaking Bad");

      expect(data.results[0].name).toBe("Breaking Bad");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/search/tv?query=Breaking+Bad"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        }),
      );
    });
  });

  describe("getMovieDetails", () => {
    it("fetches movie details with appended credits", async () => {
      const mockDetails = {
        id: 27205,
        title: "Inception",
        overview: "Dream espionage.",
        release_date: "2010-07-15",
        runtime: 148,
        genres: [{ id: 28, name: "Action" }],
        vote_average: 8.4,
        vote_count: 36000,
        status: "Released",
        credits: {
          cast: [{ id: 6193, name: "Leonardo DiCaprio", character: "Dom Cobb", order: 0 }],
          crew: [{ id: 525, name: "Christopher Nolan", job: "Director", department: "Directing" }],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockDetails,
      } as Response);

      const client = new TmdbClient({
        apiKey: "test",
        rateLimiter: new RateLimiter({ maxRequests: 50, perWindowMs: 1000 }),
      });

      const details = await client.getMovieDetails(27205);
      expect(details.title).toBe("Inception");
      expect(details.runtime).toBe(148);
      expect(details.credits?.cast[0].name).toBe("Leonardo DiCaprio");
    });
  });

  describe("getTvDetails and getTvSeason", () => {
    it("fetches TV series details and season episodes", async () => {
      const mockTv = {
        id: 1396,
        name: "Breaking Bad",
        overview: "Walter White story.",
        first_air_date: "2008-01-20",
        number_of_seasons: 5,
        number_of_episodes: 62,
        genres: [{ id: 18, name: "Drama" }],
        seasons: [{ id: 3572, name: "Season 1", season_number: 1, episode_count: 7 }],
      };

      const mockSeason = {
        id: 3572,
        name: "Season 1",
        season_number: 1,
        overview: "Season 1 overview",
        episodes: [
          {
            id: 62085,
            episode_number: 1,
            season_number: 1,
            name: "Pilot",
            overview: "Chemistry teacher diagnosed with cancer.",
            runtime: 58,
          },
        ],
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTv,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSeason,
        } as Response);

      const client = new TmdbClient({
        apiKey: "test",
        rateLimiter: new RateLimiter({ maxRequests: 50, perWindowMs: 1000 }),
      });

      const tv = await client.getTvDetails(1396);
      expect(tv.name).toBe("Breaking Bad");
      expect(tv.seasons[0].season_number).toBe(1);

      const season = await client.getTvSeason(1396, 1);
      expect(season.episodes[0].name).toBe("Pilot");
      expect(season.episodes[0].runtime).toBe(58);
    });

    it("handles HTTP error status from TMDB with status message", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ status_message: "The resource you requested could not be found." }),
      } as Response);

      const client = new TmdbClient({
        apiKey: "test",
        rateLimiter: new RateLimiter({ maxRequests: 50, perWindowMs: 1000, maxRetries: 0 }),
      });

      await expect(client.getMovieDetails(99999999)).rejects.toThrow(
        "TMDB error (404): The resource you requested could not be found.",
      );
    });
  });
});
