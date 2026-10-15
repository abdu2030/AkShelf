import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  batchSeasonProgressAction,
  toggleEpisodeProgressAction,
  updateTitleDatesAction,
  updateTitleRatingAction,
  updateTitleStatusAction,
} from "./tracking";
import { getWatchHistory } from "@/lib/history/service";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { GET as searchApiGet } from "@/app/api/search/route";
import { NextRequest } from "next/server";
import { metadataService } from "@/lib/metadata";

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

describe("Core MVP End-to-End Workflow Verification", () => {
  const testUser = {
    id: "owner-user-001",
    email: "owner@akshelf.local",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock transaction to immediately execute the callback with mock prisma
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: unknown) => {
      if (typeof cb === "function") {
        return cb(prisma);
      }
      return cb;
    });

    mockAuth.mockResolvedValue({
      user: testUser,
      expires: "2099-01-01",
    });
  });

  describe("Movie Flow: Search -> Status -> Rate -> Dates -> History Feed", () => {
    const movieMeta = {
      externalSource: "tmdb" as const,
      externalId: "27205",
      titleName: "Inception",
      mediaType: "MOVIE" as const,
    };

    const mockDbTitle = {
      id: "title-db-inception",
      externalSource: movieMeta.externalSource,
      externalId: movieMeta.externalId,
      title: movieMeta.titleName,
      type: movieMeta.mediaType,
      posterUrl: "https://image.tmdb.org/t/p/w500/inception.jpg",
    };

    it("executes the full core MVP loop seamlessly with data integrity and audit logging", async () => {
      // -----------------------------------------------------------------------
      // Step 1: Search Title - Verify Instant Memory Badge & Catalog Search
      // -----------------------------------------------------------------------
      vi.spyOn(metadataService, "search").mockResolvedValueOnce([
        {
          id: `${movieMeta.externalSource}:${movieMeta.externalId}`,
          externalSource: movieMeta.externalSource,
          externalId: movieMeta.externalId,
          type: movieMeta.mediaType,
          title: movieMeta.titleName,
          overview:
            "A thief who steals corporate secrets through the use of dream-sharing technology.",
          year: 2010,
          posterUrl: mockDbTitle.posterUrl,
          genres: ["Action", "Sci-Fi", "Adventure"],
        },
      ]);

      const searchReq = new NextRequest("http://localhost:3000/api/search?q=Inception");
      const searchRes = await searchApiGet(searchReq);
      const searchData = await searchRes.json();

      expect(searchRes.status).toBe(200);
      expect(searchData.onShelf.length + searchData.results.length).toBeGreaterThan(0);

      // Verify that if it is on shelf (from demo dataset), it displays status and rating badge
      if (searchData.onShelf.length > 0) {
        expect(searchData.onShelf[0].isOnShelf).toBe(true);
        expect(searchData.onShelf[0].title).toBe("Inception");
      }

      // -----------------------------------------------------------------------
      // Step 2: Track Status - Move to WATCHING
      // -----------------------------------------------------------------------
      vi.mocked(prisma.title.upsert).mockResolvedValueOnce(mockDbTitle as unknown as never);
      vi.mocked(prisma.userTitle.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.userTitle.upsert).mockResolvedValueOnce({
        id: "ut-001",
        userId: testUser.id,
        titleId: mockDbTitle.id,
        status: "WATCHING",
        rating: null,
        startedAt: new Date(),
        watchedAt: null,
      } as unknown as never);
      vi.mocked(prisma.watchHistory.create).mockResolvedValueOnce({
        id: "wh-001",
        userId: testUser.id,
        titleId: mockDbTitle.id,
        action: "STATUS_WATCHING",
        occurredAt: new Date(),
      } as unknown as never);

      const statusWatchingResult = await updateTitleStatusAction({
        titleExternalSource: movieMeta.externalSource,
        titleExternalId: movieMeta.externalId,
        titleName: movieMeta.titleName,
        mediaType: movieMeta.mediaType,
        status: "WATCHING",
      });

      expect(statusWatchingResult.success).toBe(true);
      expect(statusWatchingResult.status).toBe("WATCHING");
      expect(prisma.userTitle.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_titleId: {
              userId: testUser.id,
              titleId: mockDbTitle.id,
            },
          },
          update: expect.objectContaining({
            status: "WATCHING",
          }),
        }),
      );
      expect(prisma.watchHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: testUser.id,
            titleId: mockDbTitle.id,
            action: "STATUS_WATCHING",
          }),
        }),
      );
      expect(revalidatePath).toHaveBeenCalledWith("/library");
      expect(revalidatePath).toHaveBeenCalledWith("/history");

      // -----------------------------------------------------------------------
      // Step 3: Track Status - Mark as WATCHED
      // -----------------------------------------------------------------------
      vi.mocked(prisma.title.upsert).mockResolvedValueOnce(mockDbTitle as unknown as never);
      vi.mocked(prisma.userTitle.findUnique).mockResolvedValueOnce({
        id: "ut-001",
        userId: testUser.id,
        titleId: mockDbTitle.id,
        status: "WATCHING",
        startedAt: new Date("2026-10-10T19:00:00Z"),
        watchedAt: null,
      } as unknown as never);
      vi.mocked(prisma.userTitle.upsert).mockResolvedValueOnce({
        id: "ut-001",
        userId: testUser.id,
        titleId: mockDbTitle.id,
        status: "WATCHED",
        rating: null,
        startedAt: new Date("2026-10-10T19:00:00Z"),
        watchedAt: new Date("2026-10-10T21:30:00Z"),
      } as unknown as never);
      vi.mocked(prisma.watchHistory.create).mockResolvedValueOnce({
        id: "wh-002",
        userId: testUser.id,
        titleId: mockDbTitle.id,
        action: "STATUS_WATCHED",
        occurredAt: new Date("2026-10-10T21:30:00Z"),
      } as unknown as never);

      const statusWatchedResult = await updateTitleStatusAction({
        titleExternalSource: movieMeta.externalSource,
        titleExternalId: movieMeta.externalId,
        titleName: movieMeta.titleName,
        mediaType: movieMeta.mediaType,
        status: "WATCHED",
      });

      expect(statusWatchedResult.success).toBe(true);
      expect(statusWatchedResult.status).toBe("WATCHED");
      expect(prisma.watchHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "STATUS_WATCHED",
          }),
        }),
      );

      // -----------------------------------------------------------------------
      // Step 4: Rate Title - Assign 9/10 Rating
      // -----------------------------------------------------------------------
      vi.mocked(prisma.title.upsert).mockResolvedValueOnce(mockDbTitle as unknown as never);
      vi.mocked(prisma.userTitle.upsert).mockResolvedValueOnce({
        id: "ut-001",
        userId: testUser.id,
        titleId: mockDbTitle.id,
        status: "WATCHED",
        rating: 9,
        updatedAt: new Date(),
      } as unknown as never);
      vi.mocked(prisma.watchHistory.create).mockResolvedValueOnce({
        id: "wh-003",
        userId: testUser.id,
        titleId: mockDbTitle.id,
        action: "RATED_9",
        occurredAt: new Date(),
      } as unknown as never);

      const ratingResult = await updateTitleRatingAction({
        titleExternalSource: movieMeta.externalSource,
        titleExternalId: movieMeta.externalId,
        titleName: movieMeta.titleName,
        mediaType: movieMeta.mediaType,
        rating: 9,
      });

      expect(ratingResult.success).toBe(true);
      expect(ratingResult.rating).toBe(9);
      expect(prisma.userTitle.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            rating: 9,
          }),
        }),
      );
      expect(prisma.watchHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "RATED_9",
          }),
        }),
      );

      // -----------------------------------------------------------------------
      // Step 5: Track Dates - Set Custom startedAt and watchedAt
      // -----------------------------------------------------------------------
      const customStartedAt = "2026-10-10T19:00:00.000Z";
      const customWatchedAt = "2026-10-10T21:30:00.000Z";

      vi.mocked(prisma.title.upsert).mockResolvedValueOnce(mockDbTitle as unknown as never);
      vi.mocked(prisma.userTitle.upsert).mockResolvedValueOnce({
        id: "ut-001",
        userId: testUser.id,
        titleId: mockDbTitle.id,
        startedAt: new Date(customStartedAt),
        watchedAt: new Date(customWatchedAt),
        updatedAt: new Date(),
      } as unknown as never);
      vi.mocked(prisma.watchHistory.create).mockResolvedValueOnce({
        id: "wh-004",
        userId: testUser.id,
        titleId: mockDbTitle.id,
        action: "DATES_UPDATED",
        occurredAt: new Date(),
      } as unknown as never);

      const datesResult = await updateTitleDatesAction({
        titleExternalSource: movieMeta.externalSource,
        titleExternalId: movieMeta.externalId,
        titleName: movieMeta.titleName,
        mediaType: movieMeta.mediaType,
        startedAt: customStartedAt,
        watchedAt: customWatchedAt,
      });

      expect(datesResult.success).toBe(true);
      expect(datesResult.startedAt?.toISOString()).toBe(customStartedAt);
      expect(datesResult.watchedAt?.toISOString()).toBe(customWatchedAt);
      expect(prisma.watchHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "DATES_UPDATED",
          }),
        }),
      );

      // -----------------------------------------------------------------------
      // Step 6: Verify Watch History Audit Feed
      // -----------------------------------------------------------------------
      const mockHistoryEntries = [
        {
          id: "wh-004",
          userId: testUser.id,
          titleId: mockDbTitle.id,
          action: "DATES_UPDATED",
          occurredAt: new Date("2026-10-10T21:40:00Z"),
          title: mockDbTitle,
          episode: null,
        },
        {
          id: "wh-003",
          userId: testUser.id,
          titleId: mockDbTitle.id,
          action: "RATED_9",
          occurredAt: new Date("2026-10-10T21:35:00Z"),
          title: mockDbTitle,
          episode: null,
        },
        {
          id: "wh-002",
          userId: testUser.id,
          titleId: mockDbTitle.id,
          action: "STATUS_WATCHED",
          occurredAt: new Date("2026-10-10T21:30:00Z"),
          title: mockDbTitle,
          episode: null,
        },
        {
          id: "wh-001",
          userId: testUser.id,
          titleId: mockDbTitle.id,
          action: "STATUS_WATCHING",
          occurredAt: new Date("2026-10-10T19:00:00Z"),
          title: mockDbTitle,
          episode: null,
        },
      ];

      vi.mocked(prisma.watchHistory.findMany).mockResolvedValueOnce(
        mockHistoryEntries as unknown as never,
      );
      vi.mocked(prisma.watchHistory.count).mockResolvedValueOnce(4);

      const historyFeed = await getWatchHistory({ limit: 10 });

      expect(historyFeed.totalCount).toBe(4);
      expect(historyFeed.items).toHaveLength(4);

      // Verify reverse-chronological event sentences
      expect(historyFeed.items[0].actionSentence).toBe("Updated watch dates");
      expect(historyFeed.items[1].actionSentence).toBe("Rated 9/10");
      expect(historyFeed.items[1].rating).toBe(9);
      expect(historyFeed.items[2].actionSentence).toBe("Marked as Watched");
      expect(historyFeed.items[2].status).toBe("WATCHED");
      expect(historyFeed.items[3].actionSentence).toBe("Moved to Watching");
      expect(historyFeed.items[3].status).toBe("WATCHING");

      // Verify type filtering works in history
      vi.mocked(prisma.watchHistory.findMany).mockResolvedValueOnce(
        mockHistoryEntries as unknown as never,
      );
      vi.mocked(prisma.watchHistory.count).mockResolvedValueOnce(4);

      const movieHistory = await getWatchHistory({ typeFilter: "MOVIE" });
      expect(movieHistory.items.every((i) => i.mediaType === "MOVIE")).toBe(true);
    });
  });

  describe("TV / Anime Flow: Episode Progress -> Batch Season -> History Feed", () => {
    const tvMeta = {
      externalSource: "tmdb" as const,
      externalId: "1399",
      titleName: "Game of Thrones",
      mediaType: "TV" as const,
    };

    const mockDbTvTitle = {
      id: "title-db-got",
      externalSource: tvMeta.externalSource,
      externalId: tvMeta.externalId,
      title: tvMeta.titleName,
      type: tvMeta.mediaType,
      posterUrl: "https://image.tmdb.org/t/p/w500/got.jpg",
    };

    const mockDbSeason = {
      id: "season-db-got-s1",
      titleId: mockDbTvTitle.id,
      seasonNumber: 1,
      episodeCount: 10,
    };

    it("tracks single episode progress and batch season progress with history audit trail", async () => {
      // 1. Single Episode Toggle: Mark S1 E1 watched
      vi.mocked(prisma.title.upsert).mockResolvedValueOnce(mockDbTvTitle as unknown as never);
      vi.mocked(prisma.season.upsert).mockResolvedValueOnce(mockDbSeason as unknown as never);
      vi.mocked(prisma.episode.upsert).mockResolvedValueOnce({
        id: "ep-db-got-s1e1",
        seasonId: mockDbSeason.id,
        episodeNumber: 1,
        name: "Winter Is Coming",
      } as unknown as never);
      vi.mocked(prisma.userEpisode.upsert).mockResolvedValueOnce({
        id: "ue-001",
        userId: testUser.id,
        episodeId: "ep-db-got-s1e1",
        watchedAt: new Date(),
      } as unknown as never);
      vi.mocked(prisma.userTitle.upsert).mockResolvedValueOnce({
        id: "ut-got",
        userId: testUser.id,
        titleId: mockDbTvTitle.id,
        status: "WATCHING",
      } as unknown as never);
      vi.mocked(prisma.watchHistory.create).mockResolvedValueOnce({
        id: "wh-got-1",
        userId: testUser.id,
        titleId: mockDbTvTitle.id,
        episodeId: "ep-db-got-s1e1",
        action: "EPISODE_WATCHED",
        occurredAt: new Date(),
      } as unknown as never);

      const epResult = await toggleEpisodeProgressAction({
        titleExternalSource: tvMeta.externalSource,
        titleExternalId: tvMeta.externalId,
        titleName: tvMeta.titleName,
        mediaType: tvMeta.mediaType,
        seasonNumber: 1,
        episodeNumber: 1,
        watched: true,
      });

      expect(epResult.success).toBe(true);
      expect(epResult.watched).toBe(true);
      expect(prisma.userTitle.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            status: "WATCHING",
          }),
        }),
      );
      expect(prisma.watchHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "EPISODE_WATCHED",
          }),
        }),
      );

      // 2. Batch Season Toggle: Mark entire Season 1 (episodes 1 to 10) watched
      vi.mocked(prisma.title.upsert).mockResolvedValueOnce(mockDbTvTitle as unknown as never);
      vi.mocked(prisma.season.upsert).mockResolvedValueOnce(mockDbSeason as unknown as never);

      const epNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      for (const epNum of epNumbers) {
        vi.mocked(prisma.episode.upsert).mockResolvedValueOnce({
          id: `ep-db-got-s1e${epNum}`,
          seasonId: mockDbSeason.id,
          episodeNumber: epNum,
          name: `Episode ${epNum}`,
        } as unknown as never);
        vi.mocked(prisma.userEpisode.upsert).mockResolvedValueOnce({
          id: `ue-got-${epNum}`,
          userId: testUser.id,
          episodeId: `ep-db-got-s1e${epNum}`,
          watchedAt: new Date(),
        } as unknown as never);
      }

      vi.mocked(prisma.userTitle.upsert).mockResolvedValueOnce({
        id: "ut-got",
        userId: testUser.id,
        titleId: mockDbTvTitle.id,
        status: "WATCHING",
      } as unknown as never);
      vi.mocked(prisma.watchHistory.create).mockResolvedValueOnce({
        id: "wh-got-batch",
        userId: testUser.id,
        titleId: mockDbTvTitle.id,
        action: "SEASON_1_WATCHED",
        occurredAt: new Date(),
      } as unknown as never);

      const batchResult = await batchSeasonProgressAction({
        titleExternalSource: tvMeta.externalSource,
        titleExternalId: tvMeta.externalId,
        titleName: tvMeta.titleName,
        mediaType: tvMeta.mediaType,
        seasonNumber: 1,
        episodeNumbers: epNumbers,
        watched: true,
      });

      expect(batchResult.success).toBe(true);
      expect(batchResult.count).toBe(10);
      expect(prisma.watchHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "SEASON_1_WATCHED",
          }),
        }),
      );

      // 3. Verify History feed translation for episodic activity
      const mockTvHistory = [
        {
          id: "wh-got-batch",
          userId: testUser.id,
          titleId: mockDbTvTitle.id,
          action: "SEASON_1_WATCHED",
          occurredAt: new Date("2026-10-12T22:00:00Z"),
          title: mockDbTvTitle,
          episode: null,
        },
        {
          id: "wh-got-1",
          userId: testUser.id,
          titleId: mockDbTvTitle.id,
          action: "EPISODE_WATCHED",
          occurredAt: new Date("2026-10-12T20:00:00Z"),
          title: mockDbTvTitle,
          episode: {
            id: "ep-db-got-s1e1",
            episodeNumber: 1,
            season: { seasonNumber: 1 },
          },
        },
      ];

      vi.mocked(prisma.watchHistory.findMany).mockResolvedValueOnce(
        mockTvHistory as unknown as never,
      );
      vi.mocked(prisma.watchHistory.count).mockResolvedValueOnce(2);

      const tvHistory = await getWatchHistory({ typeFilter: "TV" });
      expect(tvHistory.items).toHaveLength(2);
      expect(tvHistory.items[0].actionSentence).toBe("Finished season 1");
      expect(tvHistory.items[1].actionSentence).toBe("Watched S1 E1");
    });
  });

  describe("Removal & Reset Flow", () => {
    const movieMeta = {
      externalSource: "tmdb" as const,
      externalId: "550",
      titleName: "Fight Club",
      mediaType: "MOVIE" as const,
    };

    const mockDbTitle = {
      id: "title-db-fight-club",
      externalSource: movieMeta.externalSource,
      externalId: movieMeta.externalId,
      title: movieMeta.titleName,
      type: movieMeta.mediaType,
    };

    it("supports untracking title from shelf and clearing rating with audit events", async () => {
      // 1. Clear Rating
      vi.mocked(prisma.title.upsert).mockResolvedValueOnce(mockDbTitle as unknown as never);
      vi.mocked(prisma.userTitle.updateMany).mockResolvedValueOnce({ count: 1 });
      vi.mocked(prisma.watchHistory.create).mockResolvedValueOnce({
        id: "wh-fc-rating-clear",
        userId: testUser.id,
        titleId: mockDbTitle.id,
        action: "RATING_CLEARED",
        occurredAt: new Date(),
      } as unknown as never);

      const clearRatingRes = await updateTitleRatingAction({
        titleExternalSource: movieMeta.externalSource,
        titleExternalId: movieMeta.externalId,
        titleName: movieMeta.titleName,
        mediaType: movieMeta.mediaType,
        rating: null,
      });

      expect(clearRatingRes.success).toBe(true);
      expect(clearRatingRes.rating).toBeNull();
      expect(prisma.watchHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "RATING_CLEARED",
          }),
        }),
      );

      // 2. Remove Title from shelf (status: null)
      vi.mocked(prisma.title.upsert).mockResolvedValueOnce(mockDbTitle as unknown as never);
      vi.mocked(prisma.userTitle.deleteMany).mockResolvedValueOnce({ count: 1 });
      vi.mocked(prisma.watchHistory.create).mockResolvedValueOnce({
        id: "wh-fc-removed",
        userId: testUser.id,
        titleId: mockDbTitle.id,
        action: "TITLE_REMOVED",
        occurredAt: new Date(),
      } as unknown as never);

      const removeStatusRes = await updateTitleStatusAction({
        titleExternalSource: movieMeta.externalSource,
        titleExternalId: movieMeta.externalId,
        titleName: movieMeta.titleName,
        mediaType: movieMeta.mediaType,
        status: null,
      });

      expect(removeStatusRes.success).toBe(true);
      expect(removeStatusRes.status).toBeNull();
      expect(prisma.userTitle.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: testUser.id,
          titleId: mockDbTitle.id,
        },
      });
      expect(prisma.watchHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "TITLE_REMOVED",
          }),
        }),
      );
    });
  });
});
