import { beforeEach, describe, expect, it, vi } from "vitest";
import { batchSeasonProgressAction, toggleEpisodeProgressAction } from "./tracking";
import { computeSeriesProgress, getTitleProgressFromDb } from "@/lib/progress/service";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { renderToStaticMarkup } from "react-dom/server";
import { SeasonEpisodesSection } from "@/components/title/season-episodes-section";
import React from "react";

// Mock NextAuth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock Next.js cache revalidation
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock Prisma client
vi.mock("@/lib/db", () => {
  const mockPrisma = {
    $transaction: vi.fn(),
    title: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    season: {
      upsert: vi.fn(),
    },
    episode: {
      upsert: vi.fn(),
    },
    userEpisode: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
    userTitle: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    watchHistory: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

const mockAuth = auth as unknown as {
  mockResolvedValue: (value: unknown) => void;
  mockResolvedValueOnce: (value: unknown) => void;
};

describe("Week 5 Day 35: TV & Anime Progress Stability & End-to-End Workflows", () => {
  const testUser = {
    id: "owner-user-001",
    email: "owner@akshelf.local",
  };

  // 2 Seasons TV fixture (Breaking Bad sample: S1 has 7 eps, S2 has 13 eps)
  const tvSeasonsFixture = [
    {
      seasonNumber: 1,
      name: "Season 1",
      episodeCount: 7,
      episodes: Array.from({ length: 7 }, (_, i) => ({
        episodeNumber: i + 1,
        name: `S1 Episode ${i + 1}`,
        runtime: 48,
        airDate: `2008-0${i + 1}-01`,
        isAired: true,
      })),
    },
    {
      seasonNumber: 2,
      name: "Season 2",
      episodeCount: 13,
      episodes: Array.from({ length: 13 }, (_, i) => ({
        episodeNumber: i + 1,
        name: `S2 Episode ${i + 1}`,
        runtime: 47,
        airDate: `2009-0${Math.min(i + 1, 9)}-01`,
        isAired: true,
      })),
    },
  ];

  // 1 Season Anime fixture (Frieren: Beyond Journey's End - 28 episodes)
  const animeSeasonsFixture = [
    {
      seasonNumber: 1,
      name: "Season 1",
      episodeCount: 28,
      episodes: Array.from({ length: 28 }, (_, i) => ({
        episodeNumber: i + 1,
        name: `Journey Episode ${i + 1}`,
        runtime: 24,
        airDate: "2023-09-29",
        isAired: true,
      })),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(prisma.$transaction).mockImplementation(async (cb: unknown) => {
      if (typeof cb === "function") {
        return cb(prisma);
      }
      return cb;
    });

    mockAuth.mockResolvedValue({
      user: testUser,
      expires: new Date(Date.now() + 86400000).toISOString(),
    });
  });

  // =========================================================================
  // 1. Interrupted Viewing Scenarios
  // =========================================================================
  describe("1. Interrupted Viewing Scenarios", () => {
    it("advances nextUp monotonically during continuous sequential viewing", () => {
      const watchedMap: Record<string, boolean> = {};

      // Initially, nothing is watched
      let progress = computeSeriesProgress(tvSeasonsFixture, watchedMap);
      expect(progress.watchedEpisodes).toBe(0);
      expect(progress.totalEpisodes).toBe(20);
      expect(progress.percentage).toBe(0);
      expect(progress.nextUp?.seasonNumber).toBe(1);
      expect(progress.nextUp?.episodeNumber).toBe(1);

      // Watch Episode 1
      watchedMap["1:1"] = true;
      progress = computeSeriesProgress(tvSeasonsFixture, watchedMap);
      expect(progress.watchedEpisodes).toBe(1);
      expect(progress.percentage).toBe(5); // 1/20 = 5%
      expect(progress.nextUp?.seasonNumber).toBe(1);
      expect(progress.nextUp?.episodeNumber).toBe(2);

      // Watch Episode 2
      watchedMap["1:2"] = true;
      progress = computeSeriesProgress(tvSeasonsFixture, watchedMap);
      expect(progress.watchedEpisodes).toBe(2);
      expect(progress.percentage).toBe(10); // 2/20 = 10%
      expect(progress.nextUp?.seasonNumber).toBe(1);
      expect(progress.nextUp?.episodeNumber).toBe(3);
    });

    it("identifies lowest unwatched episode chronologically when user skips ahead (non-linear viewing)", () => {
      const watchedMap: Record<string, boolean> = {
        "1:1": true,
        // User skipped Episode 2!
        "1:3": true,
        "1:4": true,
      };

      const progress = computeSeriesProgress(tvSeasonsFixture, watchedMap);

      expect(progress.watchedEpisodes).toBe(3);
      expect(progress.totalEpisodes).toBe(20);
      expect(progress.percentage).toBe(15); // 3/20 = 15%

      // Next-up MUST be the skipped Episode 2, not Episode 5!
      expect(progress.nextUp).not.toBeNull();
      expect(progress.nextUp?.seasonNumber).toBe(1);
      expect(progress.nextUp?.episodeNumber).toBe(2);
      expect(progress.nextUp?.name).toBe("S1 Episode 2");
    });

    it("advances past previously watched episodes once the skipped episode is completed", () => {
      const watchedMap: Record<string, boolean> = {
        "1:1": true,
        "1:3": true,
        "1:4": true,
      };

      // User now watches the missing Episode 2
      watchedMap["1:2"] = true;

      const progress = computeSeriesProgress(tvSeasonsFixture, watchedMap);

      expect(progress.watchedEpisodes).toBe(4);
      expect(progress.percentage).toBe(20); // 4/20 = 20%
      // Episodes 1, 2, 3, 4 are watched -> next up is Episode 5
      expect(progress.nextUp?.seasonNumber).toBe(1);
      expect(progress.nextUp?.episodeNumber).toBe(5);
    });

    it("accurately finds interrupted episode in season 2 after season 1 is completed", () => {
      const watchedMap: Record<string, boolean> = {};
      // All of Season 1 watched (7 episodes)
      for (let ep = 1; ep <= 7; ep++) {
        watchedMap[`1:${ep}`] = true;
      }
      // In Season 2: watched Episode 1 and 3, skipped Episode 2
      watchedMap["2:1"] = true;
      watchedMap["2:3"] = true;

      const progress = computeSeriesProgress(tvSeasonsFixture, watchedMap);

      expect(progress.watchedEpisodes).toBe(9);
      expect(progress.percentage).toBe(45); // 9/20 = 45%

      // Season 1 summary is 100% complete
      expect(progress.seasonProgress[0].isCompleted).toBe(true);
      expect(progress.seasonProgress[0].watchedEpisodes).toBe(7);

      // Next up is Season 2 Episode 2
      expect(progress.nextUp?.seasonNumber).toBe(2);
      expect(progress.nextUp?.episodeNumber).toBe(2);
      expect(progress.defaultSeasonNumber).toBe(2);
    });
  });

  // =========================================================================
  // 2. Completed Seasons & Multi-Season Rollover
  // =========================================================================
  describe("2. Completed Seasons & Multi-Season Rollover", () => {
    it("rolls over nextUp to Season 2 Episode 1 when Season 1 is completed one-by-one", () => {
      const watchedMap: Record<string, boolean> = {};
      for (let ep = 1; ep <= 7; ep++) {
        watchedMap[`1:${ep}`] = true;
      }

      const progress = computeSeriesProgress(tvSeasonsFixture, watchedMap);

      expect(progress.seasonProgress[0].isCompleted).toBe(true);
      expect(progress.seasonProgress[0].percentage).toBe(100);
      expect(progress.watchedEpisodes).toBe(7);
      expect(progress.percentage).toBe(35); // 7/20 = 35%

      // Next up automatically points to Season 2 Episode 1
      expect(progress.nextUp).not.toBeNull();
      expect(progress.nextUp?.seasonNumber).toBe(2);
      expect(progress.nextUp?.episodeNumber).toBe(1);
      expect(progress.defaultSeasonNumber).toBe(2);
    });

    it("marks entire season as watched via batchSeasonProgressAction and records SEASON_1_WATCHED", async () => {
      vi.mocked(prisma.title.upsert).mockResolvedValue({ id: "title-bb" } as unknown as never);
      vi.mocked(prisma.season.upsert).mockResolvedValue({ id: "season-s1" } as unknown as never);
      vi.mocked(prisma.episode.upsert).mockResolvedValue({ id: "ep-1" } as unknown as never);
      vi.mocked(prisma.userEpisode.upsert).mockResolvedValue({ id: "ue-1" } as unknown as never);
      vi.mocked(prisma.userTitle.upsert).mockResolvedValue({ id: "ut-1" } as unknown as never);
      vi.mocked(prisma.watchHistory.create).mockResolvedValue({ id: "wh-1" } as unknown as never);

      const res = await batchSeasonProgressAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1396",
        seasonNumber: 1,
        watched: true,
        episodeNumbers: [1, 2, 3, 4, 5, 6, 7],
        titleName: "Breaking Bad",
        mediaType: "TV",
      });

      expect(res.success).toBe(true);
      expect(res.watched).toBe(true);

      // Verify watchHistory logged SEASON_1_WATCHED audit action
      expect(prisma.watchHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "SEASON_1_WATCHED",
            titleId: "title-bb",
          }),
        }),
      );
    });

    it("marks entire series complete when all seasons are watched, transitioning to 100% and null nextUp", () => {
      const watchedMap: Record<string, boolean> = {};
      // Watch all of S1 (7 eps) and S2 (13 eps)
      for (let ep = 1; ep <= 7; ep++) watchedMap[`1:${ep}`] = true;
      for (let ep = 1; ep <= 13; ep++) watchedMap[`2:${ep}`] = true;

      const progress = computeSeriesProgress(tvSeasonsFixture, watchedMap);

      expect(progress.watchedEpisodes).toBe(20);
      expect(progress.totalEpisodes).toBe(20);
      expect(progress.percentage).toBe(100);
      expect(progress.isCompleted).toBe(true);
      expect(progress.nextUp).toBeNull();
      expect(progress.seasonProgress.every((s) => s.isCompleted)).toBe(true);
    });
  });

  // =========================================================================
  // 3. Re-Opening a Series After Several Days (Database Persistence)
  // =========================================================================
  describe("3. Re-Opening a Series After Several Days (Database Persistence)", () => {
    it("loads saved progress from database and restores the exact next-up episode and season", async () => {
      // Simulate title stored in DB with 2 seasons
      const mockDbTitle = {
        id: "title-db-bb",
        externalSource: "tmdb",
        externalId: "1396",
        title: "Breaking Bad",
        type: "TV",
        seasons: [
          {
            id: "s1-id",
            seasonNumber: 1,
            name: "Season 1",
            episodeCount: 7,
            episodes: Array.from({ length: 7 }, (_, i) => ({
              id: `ep-s1-${i + 1}`,
              episodeNumber: i + 1,
              name: `Pilot ${i + 1}`,
              airDate: "2008-01-20",
              runtime: 48,
            })),
          },
          {
            id: "s2-id",
            seasonNumber: 2,
            name: "Season 2",
            episodeCount: 13,
            episodes: Array.from({ length: 13 }, (_, i) => ({
              id: `ep-s2-${i + 1}`,
              episodeNumber: i + 1,
              name: `Seven Thirty-Seven ${i + 1}`,
              airDate: "2009-03-08",
              runtime: 47,
            })),
          },
        ],
      };

      vi.mocked(prisma.title.findUnique).mockResolvedValue(mockDbTitle as unknown as never);

      // User previously watched all 7 episodes of Season 1 and Season 2 Episode 1
      const mockUserEpisodes = [
        ...Array.from({ length: 7 }, (_, i) => ({ episodeId: `ep-s1-${i + 1}` })),
        { episodeId: "ep-s2-1" },
      ];
      vi.mocked(prisma.userEpisode.findMany).mockResolvedValue(
        mockUserEpisodes as unknown as never,
      );

      const dbProgress = await getTitleProgressFromDb({
        userId: testUser.id,
        externalSource: "tmdb",
        externalId: "1396",
      });

      expect(dbProgress).not.toBeNull();
      expect(dbProgress!.watchedEpisodes).toBe(8);
      expect(dbProgress!.totalEpisodes).toBe(20);
      expect(dbProgress!.percentage).toBe(40); // 8/20 = 40%

      // On re-opening days later, page automatically defaults to Season 2 and prompts Episode 2
      expect(dbProgress!.defaultSeasonNumber).toBe(2);
      expect(dbProgress!.nextUp?.seasonNumber).toBe(2);
      expect(dbProgress!.nextUp?.episodeNumber).toBe(2);
    });

    it("returns null gracefully if title has no seasons or is not yet in the database", async () => {
      vi.mocked(prisma.title.findUnique).mockResolvedValue(null);

      const dbProgress = await getTitleProgressFromDb({
        userId: testUser.id,
        externalSource: "tmdb",
        externalId: "999999",
      });

      expect(dbProgress).toBeNull();
    });

    it("handles database network or query failures safely without crashing", async () => {
      vi.mocked(prisma.title.findUnique).mockRejectedValue(new Error("Connection reset by peer"));

      const dbProgress = await getTitleProgressFromDb({
        userId: testUser.id,
        externalSource: "tmdb",
        externalId: "1396",
      });

      expect(dbProgress).toBeNull();
    });
  });

  // =========================================================================
  // 4. Re-Watching, Rewinding & Undo Flows
  // =========================================================================
  describe("4. Re-Watching, Rewinding & Undo Flows", () => {
    it("rolls back nextUp when a user unmarks an episode via toggleEpisodeProgressAction", async () => {
      vi.mocked(prisma.title.upsert).mockResolvedValue({ id: "title-bb" } as unknown as never);
      vi.mocked(prisma.season.upsert).mockResolvedValue({ id: "season-s1" } as unknown as never);
      vi.mocked(prisma.episode.upsert).mockResolvedValue({ id: "ep-3" } as unknown as never);
      vi.mocked(prisma.userEpisode.deleteMany).mockResolvedValue({ count: 1 } as unknown as never);
      vi.mocked(prisma.userTitle.findUnique).mockResolvedValue({
        status: "WATCHING",
      } as unknown as never);
      vi.mocked(prisma.watchHistory.create).mockResolvedValue({
        id: "wh-unmark",
      } as unknown as never);

      const res = await toggleEpisodeProgressAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1396",
        seasonNumber: 1,
        episodeNumber: 3,
        watched: false,
        titleName: "Breaking Bad",
        mediaType: "TV",
      });

      expect(res.success).toBe(true);
      expect(res.watched).toBe(false);

      expect(prisma.userEpisode.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: testUser.id,
          episodeId: "ep-3",
        },
      });

      expect(prisma.watchHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "EPISODE_UNWATCHED",
          }),
        }),
      );
    });

    it("reverts entire season progress when user marks season unwatched", () => {
      const watchedMap: Record<string, boolean> = {
        "1:1": true,
        "1:2": true,
        "1:3": true,
        "1:4": true,
        "1:5": true,
        "1:6": true,
        "1:7": true,
        "2:1": true,
      };

      // Unmark all of Season 1
      for (let ep = 1; ep <= 7; ep++) {
        watchedMap[`1:${ep}`] = false;
      }

      const progress = computeSeriesProgress(tvSeasonsFixture, watchedMap);

      expect(progress.watchedEpisodes).toBe(1); // Only 2:1 remains watched
      expect(progress.percentage).toBe(5);
      expect(progress.seasonProgress[0].watchedEpisodes).toBe(0);
      expect(progress.seasonProgress[0].isCompleted).toBe(false);

      // Next up falls back to Season 1 Episode 1
      expect(progress.nextUp?.seasonNumber).toBe(1);
      expect(progress.nextUp?.episodeNumber).toBe(1);
      expect(progress.defaultSeasonNumber).toBe(1);
    });

    it("rolls back nextUp across seasons when rewinding an earlier season episode", () => {
      const watchedMap: Record<string, boolean> = {};
      // All of S1 watched
      for (let ep = 1; ep <= 7; ep++) watchedMap[`1:${ep}`] = true;
      // S2 watched up to ep 5
      for (let ep = 1; ep <= 5; ep++) watchedMap[`2:${ep}`] = true;

      // Rewind S1 E4 to unwatched
      watchedMap["1:4"] = false;

      const progress = computeSeriesProgress(tvSeasonsFixture, watchedMap);

      // Next up MUST fall back to S1 E4 despite being deep into Season 2!
      expect(progress.nextUp?.seasonNumber).toBe(1);
      expect(progress.nextUp?.episodeNumber).toBe(4);
      expect(progress.defaultSeasonNumber).toBe(1);
    });
  });

  // =========================================================================
  // 5. Anime Single-Season & High-Episode Count Scenarios
  // =========================================================================
  describe("5. Anime Single-Season & High-Episode Count Scenarios", () => {
    it("accurately computes progress and nextUp across 28-episode anime series", () => {
      const watchedMap: Record<string, boolean> = {};

      // User watches episodes 1 to 14 (half of 28 episodes)
      for (let ep = 1; ep <= 14; ep++) {
        watchedMap[`1:${ep}`] = true;
      }

      const progress = computeSeriesProgress(animeSeasonsFixture, watchedMap);

      expect(progress.totalEpisodes).toBe(28);
      expect(progress.watchedEpisodes).toBe(14);
      expect(progress.percentage).toBe(50); // 14 / 28 = 50%
      expect(progress.isCompleted).toBe(false);
      expect(progress.nextUp?.seasonNumber).toBe(1);
      expect(progress.nextUp?.episodeNumber).toBe(15);
      expect(progress.nextUp?.name).toBe("Journey Episode 15");
    });

    it("reaches 100% completion on episode 28 and updates status to complete", () => {
      const watchedMap: Record<string, boolean> = {};
      for (let ep = 1; ep <= 28; ep++) {
        watchedMap[`1:${ep}`] = true;
      }

      const progress = computeSeriesProgress(animeSeasonsFixture, watchedMap);

      expect(progress.watchedEpisodes).toBe(28);
      expect(progress.percentage).toBe(100);
      expect(progress.isCompleted).toBe(true);
      expect(progress.nextUp).toBeNull();
    });
  });

  // =========================================================================
  // 6. UI Component Integration with Progress Engine
  // =========================================================================
  describe("6. UI Component Integration with Progress Engine", () => {
    it("renders SeasonEpisodesSection on defaultSeasonNumber and highlights nextUp episode row", () => {
      // User has watched S1 entirely (7 eps) and S2 E1
      const html = renderToStaticMarkup(
        <SeasonEpisodesSection
          seasons={tvSeasonsFixture}
          userCurrentSeason={2}
          userCurrentEpisode={1}
          titleExternalSource="tmdb"
          titleExternalId="1396"
          titleName="Breaking Bad"
          mediaType="TV"
        />,
      );

      // Series overall progress badge: 8 / 20 (40%)
      expect(html).toContain("8 / 20 (40%)");

      // Continue action button prompts the next unwatched episode (S2 E2)
      expect(html).toContain("Continue S2 E2");

      // Progress bar for the active season (Season 2: 1 / 13 episodes - 8%)
      expect(html).toContain("1 / 13 episodes - 8%");

      // Episode 1 in Season 2 is marked watched
      expect(html).toContain('aria-label="Mark Episode 1 as unwatched"');
      // Episode 2 in Season 2 is unwatched and marked as Next Up
      expect(html).toContain('aria-label="Mark Episode 2 as watched"');
      expect(html).toContain("Continue");
    });

    it("renders 'All Episodes Watched' when every episode in the series is complete", () => {
      const html = renderToStaticMarkup(
        <SeasonEpisodesSection
          seasons={tvSeasonsFixture}
          userCurrentSeason={2}
          userCurrentEpisode={13}
          titleExternalSource="tmdb"
          titleExternalId="1396"
          titleName="Breaking Bad"
          mediaType="TV"
        />,
      );

      expect(html).toContain("20 / 20 (100%)");
      expect(html).toContain("All Episodes Watched");
      expect(html).not.toContain("Continue S");
    });

    it("displays spec-compliant empty state when seasons array has zero episodes", () => {
      const html = renderToStaticMarkup(
        <SeasonEpisodesSection seasons={[]} onMarkSeriesWatched={() => {}} />,
      );

      expect(html).toContain("No episode details yet");
      expect(html).toContain("You can still mark the whole series as watched.");
      expect(html).toContain("Mark series watched");
    });
  });
});
