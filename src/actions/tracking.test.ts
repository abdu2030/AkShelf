import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  batchSeasonProgressAction,
  toggleEpisodeProgressAction,
  updateTitleStatusAction,
} from "./tracking";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
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
  });
});
