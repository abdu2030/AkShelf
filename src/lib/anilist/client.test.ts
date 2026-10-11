import { beforeEach, describe, expect, it, vi } from "vitest";
import { AniListClient } from "./client";
import { RateLimiter } from "@/lib/utils/rate-limiter";

describe("AniList GraphQL Client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("searchAnime", () => {
    it("fetches and validates anime search results", async () => {
      const mockGraphQLResponse = {
        data: {
          Page: {
            pageInfo: {
              total: 100,
              perPage: 20,
              currentPage: 1,
              lastPage: 5,
              hasNextPage: true,
            },
            media: [
              {
                id: 16498,
                idMal: 16498,
                title: {
                  romaji: "Shingeki no Kyojin",
                  english: "Attack on Titan",
                  native: "進撃の巨人",
                  userPreferred: "Attack on Titan",
                },
                coverImage: {
                  extraLarge:
                    "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-buvcRTBx4NSm.jpg",
                  large:
                    "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx16498-buvcRTBx4NSm.jpg",
                },
                bannerImage:
                  "https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-8jpFCOcDmneX.jpg",
                description: "Humanity fights Titans.",
                format: "TV",
                status: "FINISHED",
                episodes: 25,
                duration: 24,
                seasonYear: 2013,
                season: "SPRING",
                startDate: { year: 2013, month: 4, day: 7 },
                genres: ["Action", "Fantasy", "Drama"],
                averageScore: 85,
                popularity: 650000,
              },
            ],
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockGraphQLResponse,
      } as Response);

      const client = new AniListClient({
        rateLimiter: new RateLimiter({ maxRequests: 50, perWindowMs: 1000 }),
      });

      const response = await client.searchAnime("Attack on Titan");

      expect(response.pageInfo.total).toBe(100);
      expect(response.media).toHaveLength(1);
      expect(response.media[0].title.english).toBe("Attack on Titan");
      expect(response.media[0].episodes).toBe(25);
      expect(response.media[0].seasonYear).toBe(2013);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://graphql.anilist.co",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: expect.stringContaining("Attack on Titan"),
        }),
      );
    });

    it("returns empty results for empty query without calling fetch", async () => {
      const client = new AniListClient();
      const fetchSpy = vi.fn();
      global.fetch = fetchSpy;

      const res = await client.searchAnime("   ");
      expect(res.media).toEqual([]);
      expect(res.pageInfo.total).toBe(0);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe("getAnimeDetails", () => {
    it("fetches detailed anime metadata including studios and episodes", async () => {
      const mockDetailsResponse = {
        data: {
          Media: {
            id: 154587,
            idMal: 52991,
            title: {
              romaji: "Sousou no Frieren",
              english: "Frieren: Beyond Journey's End",
            },
            coverImage: {
              extraLarge: "https://s4.anilist.co/cover.jpg",
            },
            description: "The journey is over for the hero party.",
            format: "TV",
            status: "FINISHED",
            episodes: 28,
            duration: 24,
            seasonYear: 2023,
            genres: ["Adventure", "Drama", "Fantasy"],
            averageScore: 93,
            studios: {
              nodes: [{ id: 11, name: "Madhouse", isAnimationStudio: true }],
            },
            streamingEpisodes: [
              {
                title: "Episode 1 - The Journey's End",
                url: "https://crunchyroll.com/watch/1",
                site: "Crunchyroll",
              },
            ],
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockDetailsResponse,
      } as Response);

      const client = new AniListClient({
        rateLimiter: new RateLimiter({ maxRequests: 50, perWindowMs: 1000 }),
      });

      const details = await client.getAnimeDetails(154587);

      expect(details.id).toBe(154587);
      expect(details.title.english).toBe("Frieren: Beyond Journey's End");
      expect(details.episodes).toBe(28);
      expect(details.studios?.nodes[0].name).toBe("Madhouse");
      expect(details.streamingEpisodes?.[0].title).toBe("Episode 1 - The Journey's End");
    });
  });

  describe("getAnimeByMalId", () => {
    it("fetches anime metadata by MyAnimeList ID", async () => {
      const mockMalResponse = {
        data: {
          Media: {
            id: 5114,
            idMal: 5114,
            title: {
              romaji: "Hagane no Renkinjutsushi: FULLMETAL ALCHEMIST",
              english: "Fullmetal Alchemist: Brotherhood",
            },
            format: "TV",
            status: "FINISHED",
            episodes: 64,
            genres: ["Action", "Adventure"],
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMalResponse,
      } as Response);

      const client = new AniListClient({
        rateLimiter: new RateLimiter({ maxRequests: 50, perWindowMs: 1000 }),
      });

      const anime = await client.getAnimeByMalId(5114);
      expect(anime.id).toBe(5114);
      expect(anime.title.english).toBe("Fullmetal Alchemist: Brotherhood");
    });
  });

  describe("Error handling", () => {
    it("throws clear error when GraphQL returns error array", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          errors: [{ message: "Not Found." }],
        }),
      } as Response);

      const client = new AniListClient({
        rateLimiter: new RateLimiter({ maxRequests: 50, perWindowMs: 1000, maxRetries: 0 }),
      });

      await expect(client.getAnimeDetails(999999999)).rejects.toThrow(
        "AniList GraphQL error: Not Found.",
      );
    });

    it("throws error when HTTP request fails with 429", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({
          errors: [{ message: "Too Many Requests" }],
        }),
      } as Response);

      const client = new AniListClient({
        rateLimiter: new RateLimiter({ maxRequests: 50, perWindowMs: 1000, maxRetries: 0 }),
      });

      await expect(client.searchAnime("Naruto")).rejects.toThrow(
        "AniList error (429): Too Many Requests",
      );
    });
  });
});
