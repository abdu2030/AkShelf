import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  batchSeasonProgressAction,
  fetchSeasonEpisodesAction,
  syncSeasonEpisodesAction,
  syncTitleSeasonsAction,
  toggleEpisodeProgressAction,
  updateTitleDatesAction,
  updateTitleRatingAction,
  updateTitleStatusAction,
} from "./tracking";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { metadataService } from "@/lib/metadata/service";
import { revalidatePath } from "next/cache";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/metadata/service", () => ({
  metadataService: {
    getTvSeason: vi.fn(),
    getAnimeDetails: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: vi.fn(),
    title: { upsert: vi.fn() },
    season: { upsert: vi.fn() },
    episode: { upsert: vi.fn() },
    userEpisode: { upsert: vi.fn(), deleteMany: vi.fn() },
    userTitle: { upsert: vi.fn() },
    watchHistory: { create: vi.fn() },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Typed mock accessor for next-auth auth()
const mockAuth = auth as unknown as {
  mockResolvedValueOnce: (value: unknown) => void;
};

describe("Tracking Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("toggleEpisodeProgressAction", () => {
    it("returns error for invalid input", async () => {
      const result = await toggleEpisodeProgressAction({
        titleExternalSource: "invalid" as unknown as "tmdb",
        titleExternalId: "",
        seasonNumber: 1,
        episodeNumber: -1,
        watched: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid episode tracking input");
    });

    it("returns simulated success when unauthenticated (demo mode)", async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await toggleEpisodeProgressAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1399",
        seasonNumber: 1,
        episodeNumber: 1,
        watched: true,
        titleName: "Game of Thrones",
      });

      expect(result.success).toBe(true);
      expect(result.isDemo).toBe(true);
      expect(result.watched).toBe(true);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("executes transaction and updates records when authenticated", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-123", email: "owner@akshelf.local" },
        expires: "2099-01-01",
      });

      const mockTitle = { id: "title-1" };
      const mockSeason = { id: "season-1" };
      const mockEpisode = { id: "ep-1" };

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const tx = {
          title: { upsert: vi.fn().mockResolvedValue(mockTitle) },
          season: { upsert: vi.fn().mockResolvedValue(mockSeason) },
          episode: { upsert: vi.fn().mockResolvedValue(mockEpisode) },
          userEpisode: { upsert: vi.fn().mockResolvedValue({ id: "ue-1" }), deleteMany: vi.fn() },
          userTitle: { upsert: vi.fn().mockResolvedValue({ id: "ut-1" }) },
          watchHistory: { create: vi.fn().mockResolvedValue({ id: "wh-1" }) },
        };
        return callback(tx as unknown as Parameters<Parameters<typeof prisma.$transaction>[0]>[0]);
      });

      const result = await toggleEpisodeProgressAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1399",
        seasonNumber: 1,
        episodeNumber: 1,
        watched: true,
        titleName: "Game of Thrones",
        mediaType: "TV",
        episodeName: "Winter Is Coming",
      });

      expect(result.success).toBe(true);
      expect(result.watched).toBe(true);
      expect(result.seasonNumber).toBe(1);
      expect(result.episodeNumber).toBe(1);
      expect(revalidatePath).toHaveBeenCalledWith("/title/tmdb:1399");
      expect(revalidatePath).toHaveBeenCalledWith("/");
      expect(revalidatePath).toHaveBeenCalledWith("/library");
    });

    it("handles unwatching an episode", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-123" },
        expires: "2099-01-01",
      });

      const deleteManyMock = vi.fn().mockResolvedValue({ count: 1 });
      const watchHistoryMock = vi.fn().mockResolvedValue({ id: "wh-1" });

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const tx = {
          title: { upsert: vi.fn().mockResolvedValue({ id: "title-1" }) },
          season: { upsert: vi.fn().mockResolvedValue({ id: "season-1" }) },
          episode: { upsert: vi.fn().mockResolvedValue({ id: "ep-1" }) },
          userEpisode: { upsert: vi.fn(), deleteMany: deleteManyMock },
          userTitle: { upsert: vi.fn() },
          watchHistory: { create: watchHistoryMock },
        };
        return callback(tx as unknown as Parameters<Parameters<typeof prisma.$transaction>[0]>[0]);
      });

      const result = await toggleEpisodeProgressAction({
        titleExternalSource: "anilist",
        titleExternalId: "16498",
        seasonNumber: 1,
        episodeNumber: 3,
        watched: false,
      });

      expect(result.success).toBe(true);
      expect(result.watched).toBe(false);
      expect(deleteManyMock).toHaveBeenCalled();
      expect(watchHistoryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "EPISODE_UNWATCHED",
          }),
        }),
      );
    });

    it("transitions title status from PLAN_TO_WATCH to WATCHING on first episode watched (Spec 11.3 & 17.4)", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-123" },
        expires: "2099-01-01",
      });

      const upsertUserTitleMock = vi.fn().mockResolvedValue({ id: "ut-ptw", status: "WATCHING" });

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const tx = {
          title: { upsert: vi.fn().mockResolvedValue({ id: "title-1" }) },
          season: { upsert: vi.fn().mockResolvedValue({ id: "season-1" }) },
          episode: { upsert: vi.fn().mockResolvedValue({ id: "ep-1" }) },
          userEpisode: { upsert: vi.fn().mockResolvedValue({ id: "ue-1" }), deleteMany: vi.fn() },
          userTitle: {
            findUnique: vi.fn().mockResolvedValue({ id: "ut-ptw", status: "PLAN_TO_WATCH" }),
            upsert: upsertUserTitleMock,
          },
          watchHistory: { create: vi.fn().mockResolvedValue({ id: "wh-1" }) },
        };
        return callback(tx as unknown as Parameters<Parameters<typeof prisma.$transaction>[0]>[0]);
      });

      const result = await toggleEpisodeProgressAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1399",
        seasonNumber: 1,
        episodeNumber: 1,
        watched: true,
      });

      expect(result.success).toBe(true);
      expect(result.statusTransitioned).toBe(true);
      expect(result.previousStatus).toBe("PLAN_TO_WATCH");
      expect(result.status).toBe("WATCHING");
      expect(upsertUserTitleMock).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            status: "WATCHING",
          }),
        }),
      );
    });

    it("restores title status when undoing episode toggle with revertStatus", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-123" },
        expires: "2099-01-01",
      });

      const upsertUserTitleMock = vi
        .fn()
        .mockResolvedValue({ id: "ut-ptw", status: "PLAN_TO_WATCH" });

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const tx = {
          title: { upsert: vi.fn().mockResolvedValue({ id: "title-1" }) },
          season: { upsert: vi.fn().mockResolvedValue({ id: "season-1" }) },
          episode: { upsert: vi.fn().mockResolvedValue({ id: "ep-1" }) },
          userEpisode: { upsert: vi.fn(), deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
          userTitle: {
            findUnique: vi.fn().mockResolvedValue({ id: "ut-ptw", status: "WATCHING" }),
            upsert: upsertUserTitleMock,
          },
          watchHistory: { create: vi.fn().mockResolvedValue({ id: "wh-1" }) },
        };
        return callback(tx as unknown as Parameters<Parameters<typeof prisma.$transaction>[0]>[0]);
      });

      const result = await toggleEpisodeProgressAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1399",
        seasonNumber: 1,
        episodeNumber: 1,
        watched: false,
        revertStatus: "PLAN_TO_WATCH",
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe("PLAN_TO_WATCH");
      expect(upsertUserTitleMock).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            status: "PLAN_TO_WATCH",
          }),
        }),
      );
    });
  });

  describe("batchSeasonProgressAction", () => {
    it("returns error for invalid batch input", async () => {
      const result = await batchSeasonProgressAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1399",
        seasonNumber: 1,
        watched: true,
        episodeNumbers: [],
      });

      expect(result.success).toBe(false);
    });

    it("executes batch transaction when authenticated", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-123" },
        expires: "2099-01-01",
      });

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const tx = {
          title: { upsert: vi.fn().mockResolvedValue({ id: "title-1" }) },
          season: { upsert: vi.fn().mockResolvedValue({ id: "season-1" }) },
          episode: {
            upsert: vi.fn().mockImplementation(({ where }) => ({
              id: `ep-${where.seasonId_episodeNumber.episodeNumber}`,
            })),
          },
          userEpisode: { upsert: vi.fn().mockResolvedValue({ id: "ue" }), deleteMany: vi.fn() },
          userTitle: { upsert: vi.fn().mockResolvedValue({ id: "ut" }) },
          watchHistory: { create: vi.fn().mockResolvedValue({ id: "wh" }) },
        };
        return callback(tx as unknown as Parameters<Parameters<typeof prisma.$transaction>[0]>[0]);
      });

      const result = await batchSeasonProgressAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1399",
        seasonNumber: 1,
        watched: true,
        episodeNumbers: [1, 2, 3],
        titleName: "Game of Thrones",
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(3);
      expect(result.watched).toBe(true);
      expect(revalidatePath).toHaveBeenCalled();
    });

    it("marks title status as WATCHED when allSeasonsWatched is true", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-123" },
        expires: "2099-01-01",
      });

      const userTitleUpsertMock = vi.fn().mockResolvedValue({ id: "ut" });

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const tx = {
          title: { upsert: vi.fn().mockResolvedValue({ id: "title-1" }) },
          season: { upsert: vi.fn().mockResolvedValue({ id: "season-1" }) },
          episode: {
            upsert: vi.fn().mockImplementation(({ where }) => ({
              id: `ep-${where.seasonId_episodeNumber.episodeNumber}`,
            })),
          },
          userEpisode: { upsert: vi.fn().mockResolvedValue({ id: "ue" }), deleteMany: vi.fn() },
          userTitle: { upsert: userTitleUpsertMock },
          watchHistory: { create: vi.fn().mockResolvedValue({ id: "wh" }) },
        };
        return callback(tx as unknown as Parameters<Parameters<typeof prisma.$transaction>[0]>[0]);
      });

      const result = await batchSeasonProgressAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1399",
        seasonNumber: 1,
        watched: true,
        episodeNumbers: [1, 2, 3],
        titleName: "Chernobyl",
        allSeasonsWatched: true,
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe("WATCHED");
      expect(userTitleUpsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ status: "WATCHED" }),
        }),
      );
    });
  });

  describe("updateTitleStatusAction", () => {
    it("returns error for invalid status input", async () => {
      const result = await updateTitleStatusAction({
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        status: "INVALID_STATUS" as unknown as "WATCHED",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid status update input");
    });

    it("returns simulated success when unauthenticated (demo mode)", async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await updateTitleStatusAction({
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        status: "PLAN_TO_WATCH",
      });

      expect(result.success).toBe(true);
      expect(result.isDemo).toBe(true);
      expect(result.status).toBe("PLAN_TO_WATCH");
    });

    it("updates title status to WATCHED in transaction when authenticated", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-123" },
        expires: "2099-01-01",
      });

      const userTitleUpsertMock = vi.fn().mockResolvedValue({ id: "ut-1", status: "WATCHED" });
      const watchHistoryMock = vi.fn().mockResolvedValue({ id: "wh-1" });

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const tx = {
          title: { upsert: vi.fn().mockResolvedValue({ id: "title-1" }) },
          userTitle: {
            findUnique: vi.fn().mockResolvedValue(null),
            upsert: userTitleUpsertMock,
            deleteMany: vi.fn(),
          },
          watchHistory: { create: watchHistoryMock },
        };
        return callback(tx as unknown as Parameters<Parameters<typeof prisma.$transaction>[0]>[0]);
      });

      const result = await updateTitleStatusAction({
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        status: "WATCHED",
        titleName: "Inception",
        mediaType: "MOVIE",
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe("WATCHED");
      expect(userTitleUpsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ status: "WATCHED" }),
        }),
      );
      expect(watchHistoryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: "STATUS_WATCHED" }),
        }),
      );
      expect(revalidatePath).toHaveBeenCalledWith("/title/tmdb:27205");
      expect(revalidatePath).toHaveBeenCalledWith("/library");
    });

    it("untracks title and removes from shelf when status is null", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-123" },
        expires: "2099-01-01",
      });

      const deleteManyMock = vi.fn().mockResolvedValue({ count: 1 });
      const watchHistoryMock = vi.fn().mockResolvedValue({ id: "wh-1" });

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const tx = {
          title: { upsert: vi.fn().mockResolvedValue({ id: "title-1" }) },
          userTitle: {
            findUnique: vi.fn(),
            upsert: vi.fn(),
            deleteMany: deleteManyMock,
          },
          watchHistory: { create: watchHistoryMock },
        };
        return callback(tx as unknown as Parameters<Parameters<typeof prisma.$transaction>[0]>[0]);
      });

      const result = await updateTitleStatusAction({
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        status: null,
      });

      expect(result.success).toBe(true);
      expect(result.status).toBeNull();
      expect(deleteManyMock).toHaveBeenCalled();
      expect(watchHistoryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: "TITLE_REMOVED" }),
        }),
      );
    });

    it("persists season summaries when tracking episodic titles", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-123" },
        expires: "2099-01-01",
      });

      const seasonUpsertMock = vi.fn().mockImplementation((args) =>
        Promise.resolve({
          id: `s-${args.create.seasonNumber}`,
          titleId: "title-1",
          seasonNumber: args.create.seasonNumber,
          name: args.create.name,
          episodeCount: args.create.episodeCount,
          createdAt: new Date(),
        }),
      );

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const tx = {
          title: { upsert: vi.fn().mockResolvedValue({ id: "title-1" }) },
          season: { upsert: seasonUpsertMock },
          userTitle: {
            findUnique: vi.fn().mockResolvedValue(null),
            upsert: vi.fn().mockResolvedValue({ id: "ut-1" }),
            deleteMany: vi.fn(),
          },
          watchHistory: { create: vi.fn().mockResolvedValue({ id: "wh-1" }) },
        };
        return callback(tx as unknown as Parameters<Parameters<typeof prisma.$transaction>[0]>[0]);
      });

      const result = await updateTitleStatusAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1399",
        status: "WATCHING",
        titleName: "Game of Thrones",
        mediaType: "TV",
        seasons: [
          { seasonNumber: 1, name: "Season 1", episodeCount: 10 },
          { seasonNumber: 2, name: "Season 2", episodeCount: 10 },
        ],
      });

      expect(result.success).toBe(true);
      expect(seasonUpsertMock).toHaveBeenCalledTimes(2);
      expect(seasonUpsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { titleId_seasonNumber: { titleId: "title-1", seasonNumber: 1 } },
        }),
      );
    });
  });

  describe("updateTitleRatingAction", () => {
    it("returns error on invalid input", async () => {
      const result = await updateTitleRatingAction({
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        rating: 15,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid rating input");
    });

    it("returns isDemo true when user is unauthenticated", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as unknown as Awaited<ReturnType<typeof auth>>);

      const result = await updateTitleRatingAction({
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        rating: 8,
      });

      expect(result.success).toBe(true);
      expect(result.rating).toBe(8);
      expect(result.isDemo).toBe(true);
    });

    it("upserts UserTitle and records RATED_9 in watchHistory when authenticated", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-123", email: "owner@akshelf.local" },
        expires: "2099-01-01",
      });

      const upsertUserTitleMock = vi.fn().mockResolvedValue({ id: "ut-1" });
      const watchHistoryMock = vi.fn().mockResolvedValue({ id: "wh-1" });

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const tx = {
          title: { upsert: vi.fn().mockResolvedValue({ id: "title-1" }) },
          userTitle: {
            upsert: upsertUserTitleMock,
            updateMany: vi.fn(),
          },
          watchHistory: { create: watchHistoryMock },
        };
        return callback(tx as unknown as Parameters<Parameters<typeof prisma.$transaction>[0]>[0]);
      });

      const result = await updateTitleRatingAction({
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        rating: 9,
      });

      expect(result.success).toBe(true);
      expect(result.rating).toBe(9);
      expect(upsertUserTitleMock).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ rating: 9 }),
          create: expect.objectContaining({ rating: 9, status: "WATCHED" }),
        }),
      );
      expect(watchHistoryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: "RATED_9" }),
        }),
      );
      expect(revalidatePath).toHaveBeenCalledWith("/title/tmdb:27205");
    });

    it("clears rating on UserTitle and records RATING_CLEARED when rating is null", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-123", email: "owner@akshelf.local" },
        expires: "2099-01-01",
      });

      const updateManyMock = vi.fn().mockResolvedValue({ count: 1 });
      const watchHistoryMock = vi.fn().mockResolvedValue({ id: "wh-1" });

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const tx = {
          title: { upsert: vi.fn().mockResolvedValue({ id: "title-1" }) },
          userTitle: {
            upsert: vi.fn(),
            updateMany: updateManyMock,
          },
          watchHistory: { create: watchHistoryMock },
        };
        return callback(tx as unknown as Parameters<Parameters<typeof prisma.$transaction>[0]>[0]);
      });

      const result = await updateTitleRatingAction({
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        rating: null,
      });

      expect(result.success).toBe(true);
      expect(result.rating).toBeNull();
      expect(updateManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ rating: null }),
        }),
      );
      expect(watchHistoryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: "RATING_CLEARED" }),
        }),
      );
    });

    it("returns error on database transaction failure", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-123", email: "owner@akshelf.local" },
        expires: "2099-01-01",
      });

      vi.mocked(prisma.$transaction).mockRejectedValueOnce(new Error("Connection reset"));

      const result = await updateTitleRatingAction({
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        rating: 7,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Connection reset");
    });
  });

  describe("updateTitleDatesAction", () => {
    it("returns error on invalid date format", async () => {
      const result = await updateTitleDatesAction({
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        startedAt: "invalid-date",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid date input");
    });

    it("returns isDemo true when user is unauthenticated", async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await updateTitleDatesAction({
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        startedAt: "2026-10-01",
      });

      expect(result.success).toBe(true);
      expect(result.isDemo).toBe(true);
      expect(result.startedAt).toBeInstanceOf(Date);
    });

    it("upserts UserTitle and records DATES_UPDATED in watchHistory when authenticated", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-123", email: "owner@akshelf.local" },
        expires: "2099-01-01",
      });

      const upsertUserTitleMock = vi.fn().mockResolvedValue({ id: "ut-1" });
      const watchHistoryMock = vi.fn().mockResolvedValue({ id: "wh-1" });

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const tx = {
          title: { upsert: vi.fn().mockResolvedValue({ id: "title-1" }) },
          userTitle: { upsert: upsertUserTitleMock },
          watchHistory: { create: watchHistoryMock },
        };
        return callback(tx as unknown as Parameters<Parameters<typeof prisma.$transaction>[0]>[0]);
      });

      const result = await updateTitleDatesAction({
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        startedAt: "2026-10-01",
        watchedAt: "2026-10-12",
      });

      expect(result.success).toBe(true);
      expect(result.startedAt).toBeInstanceOf(Date);
      expect(result.watchedAt).toBeInstanceOf(Date);
      expect(upsertUserTitleMock).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            startedAt: expect.any(Date),
            watchedAt: expect.any(Date),
          }),
        }),
      );
      expect(watchHistoryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: "DATES_UPDATED" }),
        }),
      );
      expect(revalidatePath).toHaveBeenCalledWith("/title/tmdb:27205");
    });

    it("clears dates when null is passed", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-123", email: "owner@akshelf.local" },
        expires: "2099-01-01",
      });

      const upsertUserTitleMock = vi.fn().mockResolvedValue({ id: "ut-1" });
      const watchHistoryMock = vi.fn().mockResolvedValue({ id: "wh-1" });

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const tx = {
          title: { upsert: vi.fn().mockResolvedValue({ id: "title-1" }) },
          userTitle: { upsert: upsertUserTitleMock },
          watchHistory: { create: watchHistoryMock },
        };
        return callback(tx as unknown as Parameters<Parameters<typeof prisma.$transaction>[0]>[0]);
      });

      const result = await updateTitleDatesAction({
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        startedAt: null,
        watchedAt: null,
      });

      expect(result.success).toBe(true);
      expect(result.startedAt).toBeNull();
      expect(result.watchedAt).toBeNull();
      expect(upsertUserTitleMock).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            startedAt: null,
            watchedAt: null,
          }),
        }),
      );
    });

    it("returns error on database failure", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-123", email: "owner@akshelf.local" },
        expires: "2099-01-01",
      });

      vi.mocked(prisma.$transaction).mockRejectedValueOnce(new Error("Database offline"));

      const result = await updateTitleDatesAction({
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        startedAt: "2026-10-01",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database offline");
    });
  });

  describe("syncTitleSeasonsAction", () => {
    it("returns error on invalid input", async () => {
      const result = await syncTitleSeasonsAction({
        titleExternalSource: "tmdb",
        titleExternalId: "",
        seasons: [{ seasonNumber: -1, episodeCount: 10 }],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid season sync input");
    });

    it("simulates season sync in demo mode without database calls", async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await syncTitleSeasonsAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1399",
        titleName: "Game of Thrones",
        mediaType: "TV",
        seasons: [
          { seasonNumber: 1, name: "Season 1", episodeCount: 10 },
          { seasonNumber: 2, name: "Season 2", episodeCount: 10 },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.isDemo).toBe(true);
      expect(result.count).toBe(2);
      expect(result.seasons).toHaveLength(2);
      expect(result.seasons?.[0].seasonNumber).toBe(1);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("simulates selective season sync in demo mode", async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await syncTitleSeasonsAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1399",
        seasons: [
          { seasonNumber: 1, name: "Season 1", episodeCount: 10 },
          { seasonNumber: 2, name: "Season 2", episodeCount: 10 },
        ],
        selectedSeasonNumber: 2,
      });

      expect(result.success).toBe(true);
      expect(result.isDemo).toBe(true);
      expect(result.count).toBe(1);
      expect(result.seasons).toEqual([{ seasonNumber: 2, name: "Season 2", episodeCount: 10 }]);
    });

    it("persists season summaries in database when authenticated", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-123", email: "owner@akshelf.local" },
        expires: "2099-01-01",
      });

      const titleUpsertMock = vi.fn().mockResolvedValue({ id: "title-got" });
      const seasonUpsertMock = vi.fn().mockImplementation((args) =>
        Promise.resolve({
          id: `season-${args.create.seasonNumber}`,
          titleId: "title-got",
          seasonNumber: args.create.seasonNumber,
          name: args.create.name,
          episodeCount: args.create.episodeCount,
          createdAt: new Date(),
        }),
      );

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const tx = {
          title: { upsert: titleUpsertMock },
          season: { upsert: seasonUpsertMock },
        };
        return callback(tx as unknown as Parameters<Parameters<typeof prisma.$transaction>[0]>[0]);
      });

      const result = await syncTitleSeasonsAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1399",
        titleName: "Game of Thrones",
        mediaType: "TV",
        seasons: [
          { seasonNumber: 1, name: "Season 1", episodeCount: 10 },
          { seasonNumber: 2, name: "Season 2", episodeCount: 10 },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(result.seasons).toHaveLength(2);
      expect(titleUpsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            externalSource_externalId: {
              externalSource: "tmdb",
              externalId: "1399",
            },
          },
        }),
      );
      expect(seasonUpsertMock).toHaveBeenCalledTimes(2);
      expect(revalidatePath).toHaveBeenCalledWith("/title/tmdb:1399");
    });

    it("persists only selected season when selectedSeasonNumber is specified", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-123", email: "owner@akshelf.local" },
        expires: "2099-01-01",
      });

      const seasonUpsertMock = vi.fn().mockImplementation((args) =>
        Promise.resolve({
          id: `season-${args.create.seasonNumber}`,
          titleId: "title-got",
          seasonNumber: args.create.seasonNumber,
          name: args.create.name,
          episodeCount: args.create.episodeCount,
          createdAt: new Date(),
        }),
      );

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const tx = {
          title: { upsert: vi.fn().mockResolvedValue({ id: "title-got" }) },
          season: { upsert: seasonUpsertMock },
        };
        return callback(tx as unknown as Parameters<Parameters<typeof prisma.$transaction>[0]>[0]);
      });

      const result = await syncTitleSeasonsAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1399",
        seasons: [
          { seasonNumber: 1, name: "Season 1", episodeCount: 10 },
          { seasonNumber: 2, name: "Season 2", episodeCount: 10 },
          { seasonNumber: 3, name: "Season 3", episodeCount: 10 },
        ],
        selectedSeasonNumber: 2,
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(seasonUpsertMock).toHaveBeenCalledTimes(1);
      expect(seasonUpsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            titleId_seasonNumber: {
              titleId: "title-got",
              seasonNumber: 2,
            },
          },
        }),
      );
    });

    it("handles database transaction failure gracefully", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-123", email: "owner@akshelf.local" },
        expires: "2099-01-01",
      });

      vi.mocked(prisma.$transaction).mockRejectedValueOnce(
        new Error("Deadlock detected during season upsert"),
      );

      const result = await syncTitleSeasonsAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1399",
        seasons: [{ seasonNumber: 1, episodeCount: 10 }],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Deadlock detected during season upsert");
    });
  });

  describe("syncSeasonEpisodesAction", () => {
    it("returns error on invalid input", async () => {
      const result = await syncSeasonEpisodesAction({
        titleExternalSource: "tmdb",
        titleExternalId: "",
        seasonNumber: -1,
        episodes: [],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid episode sync input");
    });

    it("simulates episode sync in demo mode without database calls", async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await syncSeasonEpisodesAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1399",
        seasonNumber: 1,
        seasonName: "Season 1",
        titleName: "Game of Thrones",
        mediaType: "TV",
        episodes: [
          { episodeNumber: 1, name: "Winter Is Coming", runtime: 62 },
          { episodeNumber: 2, name: "The Kingsroad", runtime: 56 },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.isDemo).toBe(true);
      expect(result.count).toBe(2);
      expect(result.seasonNumber).toBe(1);
      expect(result.episodes).toHaveLength(2);
      expect(result.episodes?.[0].episodeNumber).toBe(1);
      expect(result.episodes?.[0].name).toBe("Winter Is Coming");
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("simulates selective episode sync in demo mode", async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await syncSeasonEpisodesAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1399",
        seasonNumber: 1,
        episodes: [
          { episodeNumber: 1, name: "Winter Is Coming" },
          { episodeNumber: 2, name: "The Kingsroad" },
        ],
        selectiveEpisodeNumbers: [2],
      });

      expect(result.success).toBe(true);
      expect(result.isDemo).toBe(true);
      expect(result.count).toBe(1);
      expect(result.episodes).toEqual([
        { episodeNumber: 2, name: "The Kingsroad", airDate: null, runtime: null },
      ]);
    });

    it("persists episode details in database when authenticated", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-123", email: "owner@akshelf.local" },
        expires: "2099-01-01",
      });

      const titleUpsertMock = vi.fn().mockResolvedValue({ id: "title-got" });
      const seasonUpsertMock = vi.fn().mockResolvedValue({
        id: "season-got-1",
        titleId: "title-got",
        seasonNumber: 1,
        name: "Season 1",
        episodeCount: 2,
        createdAt: new Date(),
      });
      const seasonUpdateMock = vi.fn().mockResolvedValue({ id: "season-got-1" });
      const episodeUpsertMock = vi.fn().mockImplementation((args) =>
        Promise.resolve({
          id: `ep-${args.create.episodeNumber}`,
          seasonId: "season-got-1",
          episodeNumber: args.create.episodeNumber,
          name: args.create.name,
          airDate: args.create.airDate,
          runtime: args.create.runtime,
          createdAt: new Date(),
        }),
      );

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const tx = {
          title: { upsert: titleUpsertMock },
          season: { upsert: seasonUpsertMock, update: seasonUpdateMock },
          episode: { upsert: episodeUpsertMock },
        };
        return callback(tx as unknown as Parameters<Parameters<typeof prisma.$transaction>[0]>[0]);
      });

      const result = await syncSeasonEpisodesAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1399",
        seasonNumber: 1,
        seasonName: "Season 1",
        titleName: "Game of Thrones",
        mediaType: "TV",
        episodes: [
          { episodeNumber: 1, name: "Winter Is Coming", airDate: "2011-04-17", runtime: 62 },
          { episodeNumber: 2, name: "The Kingsroad", airDate: "2011-04-24", runtime: 56 },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(result.seasonNumber).toBe(1);
      expect(result.episodes).toHaveLength(2);
      expect(titleUpsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            externalSource_externalId: {
              externalSource: "tmdb",
              externalId: "1399",
            },
          },
        }),
      );
      expect(seasonUpsertMock).toHaveBeenCalled();
      expect(episodeUpsertMock).toHaveBeenCalledTimes(2);
      expect(revalidatePath).toHaveBeenCalledWith("/title/tmdb:1399");
    });

    it("persists only selected episodes when selectiveEpisodeNumbers is specified", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-123", email: "owner@akshelf.local" },
        expires: "2099-01-01",
      });

      const episodeUpsertMock = vi.fn().mockImplementation((args) =>
        Promise.resolve({
          id: `ep-${args.create.episodeNumber}`,
          seasonId: "season-got-1",
          episodeNumber: args.create.episodeNumber,
          name: args.create.name,
          createdAt: new Date(),
        }),
      );

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const tx = {
          title: { upsert: vi.fn().mockResolvedValue({ id: "title-got" }) },
          season: {
            upsert: vi.fn().mockResolvedValue({
              id: "season-got-1",
              titleId: "title-got",
              seasonNumber: 1,
            }),
            update: vi.fn(),
          },
          episode: { upsert: episodeUpsertMock },
        };
        return callback(tx as unknown as Parameters<Parameters<typeof prisma.$transaction>[0]>[0]);
      });

      const result = await syncSeasonEpisodesAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1399",
        seasonNumber: 1,
        episodes: [
          { episodeNumber: 1, name: "Winter Is Coming" },
          { episodeNumber: 2, name: "The Kingsroad" },
          { episodeNumber: 3, name: "Lord Snow" },
        ],
        selectiveEpisodeNumbers: [2],
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(episodeUpsertMock).toHaveBeenCalledTimes(1);
      expect(episodeUpsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            seasonId_episodeNumber: {
              seasonId: "season-got-1",
              episodeNumber: 2,
            },
          },
        }),
      );
    });

    it("handles database transaction failure gracefully", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-123", email: "owner@akshelf.local" },
        expires: "2099-01-01",
      });

      vi.mocked(prisma.$transaction).mockRejectedValueOnce(
        new Error("Deadlock detected during episode upsert"),
      );

      const result = await syncSeasonEpisodesAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1399",
        seasonNumber: 1,
        episodes: [{ episodeNumber: 1, name: "Winter Is Coming" }],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Deadlock detected during episode upsert");
    });
  });

  describe("fetchSeasonEpisodesAction", () => {
    it("returns error on invalid input", async () => {
      const result = await fetchSeasonEpisodesAction({
        titleExternalSource: "tmdb",
        titleExternalId: "",
        seasonNumber: -1,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid fetch season input");
    });

    it("fetches TMDB season episodes in demo mode without database calls", async () => {
      mockAuth.mockResolvedValueOnce(null);

      vi.mocked(metadataService.getTvSeason).mockResolvedValueOnce({
        seasonNumber: 1,
        name: "Season 1",
        episodeCount: 2,
        episodes: [
          { episodeNumber: 1, name: "Winter Is Coming", runtime: 62 },
          { episodeNumber: 2, name: "The Kingsroad", runtime: 56 },
        ],
      } as unknown as never);

      const result = await fetchSeasonEpisodesAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1399",
        seasonNumber: 1,
      });

      expect(result.success).toBe(true);
      expect(result.isDemo).toBe(true);
      expect(result.count).toBe(2);
      expect(result.episodes).toHaveLength(2);
      expect(result.episodes?.[0].name).toBe("Winter Is Coming");
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("fetches AniList anime episodes in demo mode", async () => {
      mockAuth.mockResolvedValueOnce(null);

      vi.mocked(metadataService.getAnimeDetails).mockResolvedValueOnce({
        id: "anilist:16498",
        externalSource: "anilist",
        externalId: "16498",
        type: "ANIME",
        title: "Attack on Titan",
        genres: ["Action"],
        seasons: [
          {
            seasonNumber: 1,
            name: "Season 1",
            episodeCount: 2,
            episodes: [
              { episodeNumber: 1, name: "To You, in 2000 Years" },
              { episodeNumber: 2, name: "That Day" },
            ],
          },
        ],
      } as unknown as never);

      const result = await fetchSeasonEpisodesAction({
        titleExternalSource: "anilist",
        titleExternalId: "16498",
        seasonNumber: 1,
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(result.episodes?.[0].name).toBe("To You, in 2000 Years");
    });

    it("fetches and lazily persists episodes in database when authenticated", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-123", email: "owner@akshelf.local" },
        expires: "2099-01-01",
      });

      vi.mocked(metadataService.getTvSeason).mockResolvedValueOnce({
        seasonNumber: 1,
        name: "Season 1",
        episodeCount: 2,
        episodes: [
          { episodeNumber: 1, name: "Pilot", runtime: 58 },
          { episodeNumber: 2, name: "Cat's in the Bag...", runtime: 48 },
        ],
      } as unknown as never);

      const titleUpsertMock = vi.fn().mockResolvedValue({ id: "title-bb" });
      const seasonUpsertMock = vi.fn().mockResolvedValue({
        id: "season-bb-1",
        titleId: "title-bb",
        seasonNumber: 1,
        episodeCount: 2,
      });
      const seasonUpdateMock = vi.fn().mockResolvedValue({ id: "season-bb-1" });
      const episodeUpsertMock = vi.fn().mockImplementation((args) =>
        Promise.resolve({
          id: `ep-${args.create.episodeNumber}`,
          seasonId: "season-bb-1",
          episodeNumber: args.create.episodeNumber,
          name: args.create.name,
          createdAt: new Date(),
        }),
      );

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const tx = {
          title: { upsert: titleUpsertMock },
          season: { upsert: seasonUpsertMock, update: seasonUpdateMock },
          episode: { upsert: episodeUpsertMock },
        };
        return callback(tx as unknown as Parameters<Parameters<typeof prisma.$transaction>[0]>[0]);
      });

      const result = await fetchSeasonEpisodesAction({
        titleExternalSource: "tmdb",
        titleExternalId: "1396",
        seasonNumber: 1,
        titleName: "Breaking Bad",
        mediaType: "TV",
      });

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(result.episodes).toHaveLength(2);
      expect(titleUpsertMock).toHaveBeenCalled();
      expect(seasonUpsertMock).toHaveBeenCalled();
      expect(episodeUpsertMock).toHaveBeenCalledTimes(2);
    });
  });
});
