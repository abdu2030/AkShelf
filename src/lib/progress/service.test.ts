import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeSeriesProgress, getTitleProgressFromDb } from "./service";
import { prisma } from "@/lib/db";

// Mock Prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    title: {
      findUnique: vi.fn(),
    },
    userEpisode: {
      findMany: vi.fn(),
    },
  },
}));

describe("Progress Service - computeSeriesProgress (Day 34)", () => {
  const sampleSeasons = [
    {
      seasonNumber: 1,
      name: "Season 1",
      episodeCount: 5,
      episodes: [
        { episodeNumber: 1, name: "S1 E1" },
        { episodeNumber: 2, name: "S1 E2" },
        { episodeNumber: 3, name: "S1 E3" },
        { episodeNumber: 4, name: "S1 E4" },
        { episodeNumber: 5, name: "S1 E5" },
      ],
    },
    {
      seasonNumber: 2,
      name: "Season 2",
      episodeCount: 5,
      episodes: [
        { episodeNumber: 1, name: "S2 E1" },
        { episodeNumber: 2, name: "S2 E2" },
        { episodeNumber: 3, name: "S2 E3" },
        { episodeNumber: 4, name: "S2 E4" },
        { episodeNumber: 5, name: "S2 E5" },
      ],
    },
  ];

  it("calculates partial progress and identifies next unwatched episode in Season 1", () => {
    const watchedMap = {
      "1:1": true,
      "1:2": true,
    };

    const result = computeSeriesProgress(sampleSeasons, watchedMap);

    expect(result.totalEpisodes).toBe(10);
    expect(result.watchedEpisodes).toBe(2);
    expect(result.percentage).toBe(20);
    expect(result.isCompleted).toBe(false);

    // Next up is Episode 3 of Season 1
    expect(result.nextUp).toEqual({
      seasonNumber: 1,
      episodeNumber: 3,
      name: "S1 E3",
      airDate: null,
      runtime: null,
    });
    expect(result.defaultSeasonNumber).toBe(1);

    // Per-season progress
    expect(result.seasonProgress[0].watchedEpisodes).toBe(2);
    expect(result.seasonProgress[0].percentage).toBe(40);
    expect(result.seasonProgress[0].isCompleted).toBe(false);
  });

  it("advances next-up to Season 2 Episode 1 when Season 1 is completed", () => {
    const watchedMap = {
      "1:1": true,
      "1:2": true,
      "1:3": true,
      "1:4": true,
      "1:5": true,
    };

    const result = computeSeriesProgress(sampleSeasons, watchedMap);

    expect(result.totalEpisodes).toBe(10);
    expect(result.watchedEpisodes).toBe(5);
    expect(result.percentage).toBe(50);
    expect(result.isCompleted).toBe(false);

    // Season 1 is marked completed
    expect(result.seasonProgress[0].isCompleted).toBe(true);
    expect(result.seasonProgress[0].percentage).toBe(100);

    // Next-up points to Season 2 Episode 1!
    expect(result.nextUp).toEqual({
      seasonNumber: 2,
      episodeNumber: 1,
      name: "S2 E1",
      airDate: null,
      runtime: null,
    });
    // Default season to open is Season 2
    expect(result.defaultSeasonNumber).toBe(2);
  });

  it("correctly identifies the next unwatched episode during interrupted/non-contiguous viewing", () => {
    // Ep 1, 2, 4 watched, but Ep 3 was skipped
    const watchedMap = {
      "1:1": true,
      "1:2": true,
      "1:4": true,
    };

    const result = computeSeriesProgress(sampleSeasons, watchedMap);

    // Next-up should accurately point to Ep 3
    expect(result.nextUp?.seasonNumber).toBe(1);
    expect(result.nextUp?.episodeNumber).toBe(3);
  });

  it("marks series as completed when all episodes across all seasons are watched", () => {
    const watchedMap: Record<string, boolean> = {};
    for (let s = 1; s <= 2; s++) {
      for (let e = 1; e <= 5; e++) {
        watchedMap[`${s}:${e}`] = true;
      }
    }

    const result = computeSeriesProgress(sampleSeasons, watchedMap);

    expect(result.totalEpisodes).toBe(10);
    expect(result.watchedEpisodes).toBe(10);
    expect(result.percentage).toBe(100);
    expect(result.isCompleted).toBe(true);
    expect(result.nextUp).toBeNull();
  });

  it("handles empty seasons gracefully without division-by-zero", () => {
    const result = computeSeriesProgress([], {});

    expect(result.totalEpisodes).toBe(0);
    expect(result.watchedEpisodes).toBe(0);
    expect(result.percentage).toBe(0);
    expect(result.isCompleted).toBe(false);
    expect(result.nextUp).toBeNull();
    expect(result.defaultSeasonNumber).toBe(1);
  });
});

describe("Progress Service - getTitleProgressFromDb (Day 34)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches title, seasons, episodes, and user progress from database", async () => {
    const mockDbTitle = {
      id: "title-db-1",
      externalSource: "tmdb",
      externalId: "1399",
      seasons: [
        {
          id: "s1-id",
          seasonNumber: 1,
          name: "Season 1",
          episodeCount: 2,
          episodes: [
            {
              id: "s1e1-id",
              episodeNumber: 1,
              name: "Winter Is Coming",
              airDate: "2011-04-17",
              runtime: 60,
            },
            {
              id: "s1e2-id",
              episodeNumber: 2,
              name: "The Kingsroad",
              airDate: "2011-04-24",
              runtime: 60,
            },
          ],
        },
      ],
    };

    vi.mocked(prisma.title.findUnique).mockResolvedValueOnce(mockDbTitle as unknown as never);
    vi.mocked(prisma.userEpisode.findMany).mockResolvedValueOnce([
      { episodeId: "s1e1-id" } as unknown as never,
    ]);

    const result = await getTitleProgressFromDb({
      userId: "user-123",
      externalSource: "tmdb",
      externalId: "1399",
    });

    expect(result).not.toBeNull();
    expect(result?.totalEpisodes).toBe(2);
    expect(result?.watchedEpisodes).toBe(1);
    expect(result?.percentage).toBe(50);
    expect(result?.nextUp?.episodeNumber).toBe(2);
    expect(result?.watchedMap["1:1"]).toBe(true);
    expect(result?.watchedMap["1:2"]).toBe(false);
  });

  it("returns null if title is not found in database", async () => {
    vi.mocked(prisma.title.findUnique).mockResolvedValueOnce(null);

    const result = await getTitleProgressFromDb({
      userId: "user-123",
      externalSource: "tmdb",
      externalId: "99999",
    });

    expect(result).toBeNull();
  });
});
