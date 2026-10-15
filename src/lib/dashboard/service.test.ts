import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  computeDashboardStats,
  getDashboardStats,
  getContinueWatching,
  getRecentlyWatched,
  getDemoContinueWatchingItems,
  getDemoRecentlyWatchedItems,
  computeDashboardAnalytics,
  getDashboardAnalytics,
  getDemoDashboardAnalytics,
} from "./service";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => {
  const mockPrisma = {
    userTitle: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    userEpisode: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

describe("Dashboard Service (Day 36, Day 37 & Day 38)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("computeDashboardStats (Pure Function)", () => {
    it("aggregates status counts correctly from an array of items", () => {
      const items = [
        { status: "WATCHED" },
        { status: "WATCHED" },
        { status: "WATCHING" },
        { status: "PLAN_TO_WATCH" },
        { status: "PLAN_TO_WATCH" },
        { status: "PLAN_TO_WATCH" },
        { status: "ON_HOLD" },
        { status: "DROPPED" },
        { status: null },
      ];

      const stats = computeDashboardStats(items);

      expect(stats.totalTracked).toBe(8);
      expect(stats.watched).toBe(2);
      expect(stats.watching).toBe(1);
      expect(stats.planToWatch).toBe(3);
      expect(stats.onHold).toBe(1);
      expect(stats.dropped).toBe(1);
    });

    it("returns zero counts for an empty array", () => {
      const stats = computeDashboardStats([]);

      expect(stats.totalTracked).toBe(0);
      expect(stats.watched).toBe(0);
      expect(stats.watching).toBe(0);
      expect(stats.planToWatch).toBe(0);
      expect(stats.onHold).toBe(0);
      expect(stats.dropped).toBe(0);
    });
  });

  describe("getDashboardStats (Database Integration)", () => {
    it("queries PostgreSQL groupBy for authenticated user and returns accurate live counts", async () => {
      vi.mocked(prisma.userTitle.groupBy).mockResolvedValueOnce([
        { status: "WATCHED", _count: { status: 15 } },
        { status: "WATCHING", _count: { status: 4 } },
        { status: "PLAN_TO_WATCH", _count: { status: 9 } },
        { status: "ON_HOLD", _count: { status: 2 } },
      ] as unknown as never);

      const stats = await getDashboardStats({ userId: "owner-123" });

      expect(prisma.userTitle.groupBy).toHaveBeenCalledWith({
        by: ["status"],
        where: { userId: "owner-123" },
        _count: { status: true },
      });

      expect(stats.totalTracked).toBe(30);
      expect(stats.watched).toBe(15);
      expect(stats.watching).toBe(4);
      expect(stats.planToWatch).toBe(9);
      expect(stats.onHold).toBe(2);
      expect(stats.dropped).toBe(0);
    });

    it("returns zero counts for a new user with zero tracked titles", async () => {
      vi.mocked(prisma.userTitle.groupBy).mockResolvedValueOnce([] as unknown as never);

      const stats = await getDashboardStats({ userId: "new-user-001" });

      expect(stats.totalTracked).toBe(0);
      expect(stats.watched).toBe(0);
      expect(stats.watching).toBe(0);
      expect(stats.planToWatch).toBe(0);
      expect(stats.onHold).toBe(0);
      expect(stats.dropped).toBe(0);
    });

    it("falls back to demo title counts when no userId is supplied (guest mode)", async () => {
      const stats = await getDashboardStats({ userId: null });

      expect(stats.totalTracked).toBeGreaterThan(0);
      expect(stats.watched).toBeGreaterThan(0);
      expect(prisma.userTitle.groupBy).not.toHaveBeenCalled();
    });

    it("handles database query errors safely and returns zero fallback", async () => {
      vi.mocked(prisma.userTitle.groupBy).mockRejectedValueOnce(new Error("Connection timeout"));

      const stats = await getDashboardStats({ userId: "owner-123" });

      expect(stats.totalTracked).toBe(0);
      expect(stats.watched).toBe(0);
      expect(stats.watching).toBe(0);
      expect(stats.planToWatch).toBe(0);
    });
  });

  describe("getContinueWatching (Day 37)", () => {
    it("returns demo continue watching items in guest mode", async () => {
      const items = await getContinueWatching({ userId: null });

      expect(items.length).toBeGreaterThan(0);
      expect(items[0]).toHaveProperty("nextUp");
      expect(items[0].percentage).toBeGreaterThanOrEqual(0);
      expect(prisma.userTitle.findMany).not.toHaveBeenCalled();
    });

    it("queries database for authenticated user and calculates series progress and nextUp", async () => {
      vi.mocked(prisma.userTitle.findMany).mockResolvedValueOnce([
        {
          id: "ut-1",
          userId: "user-1",
          titleId: "title-1",
          status: "WATCHING",
          rating: 9.0,
          updatedAt: new Date("2026-10-14T10:00:00Z"),
          title: {
            id: "title-1",
            externalSource: "tmdb",
            externalId: "1399",
            title: "Breaking Bad",
            type: "TV",
            posterUrl: "/posters/bb.jpg",
            backdropUrl: "/backdrops/bb.jpg",
            year: 2008,
            seasons: [
              {
                id: "s-1",
                seasonNumber: 1,
                name: "Season 1",
                episodeCount: 3,
                episodes: [
                  {
                    id: "ep-1",
                    episodeNumber: 1,
                    name: "Pilot",
                    airDate: "2008-01-20",
                    runtime: 58,
                  },
                  {
                    id: "ep-2",
                    episodeNumber: 2,
                    name: "Cat's in the Bag...",
                    airDate: "2008-01-27",
                    runtime: 48,
                  },
                  {
                    id: "ep-3",
                    episodeNumber: 3,
                    name: "...And the Bag's in the River",
                    airDate: "2008-02-10",
                    runtime: 48,
                  },
                ],
              },
            ],
          },
        },
      ] as unknown as never);

      vi.mocked(prisma.userEpisode.findMany).mockResolvedValueOnce([
        { episodeId: "ep-1" },
      ] as unknown as never);

      const items = await getContinueWatching({ userId: "user-1" });

      expect(items).toHaveLength(1);
      expect(items[0].title).toBe("Breaking Bad");
      expect(items[0].totalEpisodes).toBe(3);
      expect(items[0].watchedEpisodes).toBe(1);
      expect(items[0].percentage).toBe(33);
      expect(items[0].nextUp).toEqual({
        seasonNumber: 1,
        episodeNumber: 2,
        name: "Cat's in the Bag...",
        airDate: "2008-01-27",
        runtime: 48,
      });
      expect(items[0].isCompleted).toBe(false);
    });

    it("returns empty array when authenticated user has no in-progress series", async () => {
      vi.mocked(prisma.userTitle.findMany).mockResolvedValueOnce([] as unknown as never);

      const items = await getContinueWatching({ userId: "user-empty" });

      expect(items).toEqual([]);
    });

    it("safely returns empty array if database query throws", async () => {
      vi.mocked(prisma.userTitle.findMany).mockRejectedValueOnce(new Error("DB failure"));

      const items = await getContinueWatching({ userId: "user-err" });

      expect(items).toEqual([]);
    });
  });

  describe("getRecentlyWatched (Day 37)", () => {
    it("returns demo recently watched items in guest mode", async () => {
      const items = await getRecentlyWatched({ userId: null });

      expect(items.length).toBeGreaterThan(0);
      expect(items[0].status).toBe("WATCHED");
      expect(prisma.userTitle.findMany).not.toHaveBeenCalled();
    });

    it("queries database for authenticated user and returns recently completed titles", async () => {
      vi.mocked(prisma.userTitle.findMany).mockResolvedValueOnce([
        {
          id: "ut-2",
          userId: "user-1",
          titleId: "title-2",
          status: "WATCHED",
          rating: 9.5,
          watchedAt: new Date("2026-10-15T12:00:00Z"),
          updatedAt: new Date("2026-10-15T12:00:00Z"),
          title: {
            id: "title-2",
            externalSource: "tmdb",
            externalId: "27205",
            title: "Inception",
            type: "MOVIE",
            posterUrl: "/posters/inception.jpg",
            backdropUrl: null,
            year: 2010,
          },
        },
      ] as unknown as never);

      const items = await getRecentlyWatched({ userId: "user-1" });

      expect(items).toHaveLength(1);
      expect(items[0].title).toBe("Inception");
      expect(items[0].type).toBe("MOVIE");
      expect(items[0].rating).toBe(9.5);
      expect(items[0].status).toBe("WATCHED");
    });

    it("safely handles database query failures and returns empty array", async () => {
      vi.mocked(prisma.userTitle.findMany).mockRejectedValueOnce(new Error("Connection reset"));

      const items = await getRecentlyWatched({ userId: "user-err" });

      expect(items).toEqual([]);
    });
  });

  describe("computeDashboardAnalytics (Day 38 Pure Function)", () => {
    it("computes counts by type, average rating, and total episodes correctly", () => {
      const titles = [
        { type: "MOVIE", rating: 9.0 },
        { type: "MOVIE", rating: 8.5 },
        { type: "TV", rating: 9.5 },
        { type: "ANIME", rating: null },
        { type: "ANIME", rating: 10.0 },
      ];

      const analytics = computeDashboardAnalytics(titles, 42);

      expect(analytics.countsByType.movies).toBe(2);
      expect(analytics.countsByType.tv).toBe(1);
      expect(analytics.countsByType.anime).toBe(2);
      // (9.0 + 8.5 + 9.5 + 10.0) / 4 = 37.0 / 4 = 9.25 => rounded to 9.3
      expect(analytics.averageRating).toBe(9.3);
      expect(analytics.ratedCount).toBe(4);
      expect(analytics.totalWatchedEpisodes).toBe(42);
    });

    it("handles empty items array gracefully with null average rating", () => {
      const analytics = computeDashboardAnalytics([], 0);

      expect(analytics.countsByType).toEqual({ movies: 0, tv: 0, anime: 0 });
      expect(analytics.averageRating).toBeNull();
      expect(analytics.ratedCount).toBe(0);
      expect(analytics.totalWatchedEpisodes).toBe(0);
    });
  });

  describe("getDashboardAnalytics (Day 38 Database Integration)", () => {
    it("returns demo analytics in guest mode", async () => {
      const analytics = await getDashboardAnalytics({ userId: null });

      expect(analytics.countsByType.movies).toBeGreaterThan(0);
      expect(analytics.countsByType.tv).toBeGreaterThan(0);
      expect(analytics.countsByType.anime).toBeGreaterThan(0);
      expect(analytics.averageRating).toBeGreaterThan(0);
      expect(analytics.totalWatchedEpisodes).toBeGreaterThan(0);
      expect(prisma.userTitle.count).not.toHaveBeenCalled();
    });

    it("queries database for authenticated user and returns accurate analytical metrics", async () => {
      vi.mocked(prisma.userTitle.count)
        .mockResolvedValueOnce(12) // movies
        .mockResolvedValueOnce(5) // tv
        .mockResolvedValueOnce(7); // anime

      vi.mocked(prisma.userTitle.aggregate).mockResolvedValueOnce({
        _avg: { rating: 8.86 },
        _count: { rating: 15 },
      } as unknown as never);

      vi.mocked(prisma.userEpisode.count).mockResolvedValueOnce(84);

      const analytics = await getDashboardAnalytics({ userId: "owner-1" });

      expect(analytics.countsByType.movies).toBe(12);
      expect(analytics.countsByType.tv).toBe(5);
      expect(analytics.countsByType.anime).toBe(7);
      expect(analytics.averageRating).toBe(8.9);
      expect(analytics.ratedCount).toBe(15);
      expect(analytics.totalWatchedEpisodes).toBe(84);
    });

    it("safely returns zero/null fallback if database query fails", async () => {
      vi.mocked(prisma.userTitle.count).mockRejectedValueOnce(new Error("Timeout"));

      const analytics = await getDashboardAnalytics({ userId: "owner-err" });

      expect(analytics.countsByType).toEqual({ movies: 0, tv: 0, anime: 0 });
      expect(analytics.averageRating).toBeNull();
      expect(analytics.ratedCount).toBe(0);
      expect(analytics.totalWatchedEpisodes).toBe(0);
    });
  });

  describe("Synthetic Demo Generators", () => {
    it("getDemoContinueWatchingItems returns valid items with nextUp", () => {
      const demoItems = getDemoContinueWatchingItems();
      expect(demoItems.length).toBeGreaterThan(0);
      expect(demoItems.every((item) => item.nextUp !== null)).toBe(true);
      expect(demoItems.every((item) => item.type === "TV" || item.type === "ANIME")).toBe(true);
    });

    it("getDemoRecentlyWatchedItems returns watched titles", () => {
      const demoItems = getDemoRecentlyWatchedItems();
      expect(demoItems.length).toBeGreaterThan(0);
      expect(demoItems.every((item) => item.status === "WATCHED")).toBe(true);
    });

    it("getDemoDashboardAnalytics returns valid analytics", () => {
      const demoAnalytics = getDemoDashboardAnalytics();
      expect(demoAnalytics.countsByType.movies).toBeGreaterThan(0);
      expect(demoAnalytics.averageRating).toBeGreaterThan(0);
      expect(demoAnalytics.totalWatchedEpisodes).toBeGreaterThan(0);
    });
  });
});
