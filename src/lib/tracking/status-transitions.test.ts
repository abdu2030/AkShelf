import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateTitleStatusAction } from "@/actions/tracking";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
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

vi.mock("@/lib/season/storage", () => ({
  ensureSeasonRecord: vi.fn(),
  persistTitleSeasons: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/episode/storage", () => ({
  persistSeasonEpisodes: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: vi.fn(),
    title: { upsert: vi.fn() },
    userTitle: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
    watchHistory: { create: vi.fn() },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockAuth = auth as unknown as {
  mockResolvedValue: (value: unknown) => void;
  mockResolvedValueOnce: (value: unknown) => void;
};

describe("Status Transitions Baseline Suite (Day 43)", () => {
  const mockUser = { id: "user-test-43", email: "tester@akshelf.local" };
  const mockTitle = {
    id: "title-db-43",
    externalSource: "tmdb",
    externalId: "550",
    title: "Fight Club",
    type: "MOVIE",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Validation & Unauthenticated Guarantees", () => {
    it("rejects invalid status enum strings", async () => {
      const result = await updateTitleStatusAction({
        titleExternalSource: "tmdb",
        titleExternalId: "550",
        // @ts-expect-error testing invalid status string
        status: "COMPLETED",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid status update input");
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("rejects empty or whitespace titleExternalId", async () => {
      const result = await updateTitleStatusAction({
        titleExternalSource: "tmdb",
        titleExternalId: "",
        status: "WATCHED",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("titleExternalId is required");
    });

    it("succeeds with simulated demo result when unauthenticated", async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await updateTitleStatusAction({
        titleExternalSource: "tmdb",
        titleExternalId: "550",
        status: "WATCHING",
        titleName: "Fight Club",
      });

      expect(result.success).toBe(true);
      expect(result.isDemo).toBe(true);
      expect(result.status).toBe("WATCHING");
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("Core State Machine Transitions", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: mockUser });
    });

    it("transitions from untracked to PLAN_TO_WATCH", async () => {
      let createdData: unknown = null;
      let historyData: unknown = null;

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const tx = {
          title: { upsert: vi.fn().mockResolvedValue(mockTitle) },
          userTitle: {
            findUnique: vi.fn().mockResolvedValue(null),
            upsert: vi.fn().mockImplementation(({ create }) => {
              createdData = create;
              return Promise.resolve({ ...mockTitle, ...create });
            }),
            deleteMany: vi.fn(),
          },
          watchHistory: {
            create: vi.fn().mockImplementation(({ data }) => {
              historyData = data;
              return Promise.resolve({ id: "hist-1", ...data });
            }),
          },
        };
        // @ts-expect-error mock transaction
        return callback(tx);
      });

      const result = await updateTitleStatusAction({
        titleExternalSource: "tmdb",
        titleExternalId: "550",
        status: "PLAN_TO_WATCH",
        titleName: "Fight Club",
        mediaType: "MOVIE",
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe("PLAN_TO_WATCH");
      expect(createdData).toMatchObject({
        userId: mockUser.id,
        titleId: mockTitle.id,
        status: "PLAN_TO_WATCH",
      });
      expect(historyData).toMatchObject({
        userId: mockUser.id,
        titleId: mockTitle.id,
        action: "STATUS_PLAN_TO_WATCH",
      });
      expect(revalidatePath).toHaveBeenCalledWith("/library");
    });

    it("transitions from PLAN_TO_WATCH to WATCHING and sets startedAt timestamp", async () => {
      let updatedData: unknown = null;

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const tx = {
          title: { upsert: vi.fn().mockResolvedValue(mockTitle) },
          userTitle: {
            findUnique: vi.fn().mockResolvedValue({
              id: "ut-1",
              userId: mockUser.id,
              titleId: mockTitle.id,
              status: "PLAN_TO_WATCH",
              startedAt: null,
              watchedAt: null,
            }),
            upsert: vi.fn().mockImplementation(({ update }) => {
              updatedData = update;
              return Promise.resolve({ ...mockTitle, ...update });
            }),
            deleteMany: vi.fn(),
          },
          watchHistory: { create: vi.fn().mockResolvedValue({ id: "hist-2" }) },
        };
        // @ts-expect-error mock transaction
        return callback(tx);
      });

      const result = await updateTitleStatusAction({
        titleExternalSource: "tmdb",
        titleExternalId: "550",
        status: "WATCHING",
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe("WATCHING");
      expect(updatedData).toMatchObject({
        status: "WATCHING",
      });
      // startedAt should be automatically populated
      expect((updatedData as { startedAt: Date }).startedAt).toBeInstanceOf(Date);
    });

    it("transitions from WATCHING to WATCHED and sets watchedAt timestamp", async () => {
      let updatedData: unknown = null;

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const tx = {
          title: { upsert: vi.fn().mockResolvedValue(mockTitle) },
          userTitle: {
            findUnique: vi.fn().mockResolvedValue({
              id: "ut-1",
              userId: mockUser.id,
              titleId: mockTitle.id,
              status: "WATCHING",
              startedAt: new Date("2026-10-01"),
              watchedAt: null,
            }),
            upsert: vi.fn().mockImplementation(({ update }) => {
              updatedData = update;
              return Promise.resolve({ ...mockTitle, ...update });
            }),
            deleteMany: vi.fn(),
          },
          watchHistory: { create: vi.fn().mockResolvedValue({ id: "hist-3" }) },
        };
        // @ts-expect-error mock transaction
        return callback(tx);
      });

      const result = await updateTitleStatusAction({
        titleExternalSource: "tmdb",
        titleExternalId: "550",
        status: "WATCHED",
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe("WATCHED");
      expect(updatedData).toMatchObject({
        status: "WATCHED",
      });
      expect((updatedData as { watchedAt: Date }).watchedAt).toBeInstanceOf(Date);
    });

    it("transitions between active states (WATCHING to ON_HOLD to DROPPED)", async () => {
      for (const nextStatus of ["ON_HOLD", "DROPPED", "WATCHING"] as const) {
        vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
          const tx = {
            title: { upsert: vi.fn().mockResolvedValue(mockTitle) },
            userTitle: {
              findUnique: vi.fn().mockResolvedValue({
                id: "ut-1",
                userId: mockUser.id,
                titleId: mockTitle.id,
                status: "WATCHING",
              }),
              upsert: vi.fn().mockResolvedValue({ status: nextStatus }),
              deleteMany: vi.fn(),
            },
            watchHistory: { create: vi.fn().mockResolvedValue({ id: "hist-x" }) },
          };
          // @ts-expect-error mock transaction
          return callback(tx);
        });

        const result = await updateTitleStatusAction({
          titleExternalSource: "tmdb",
          titleExternalId: "550",
          status: nextStatus,
        });

        expect(result.success).toBe(true);
        expect(result.status).toBe(nextStatus);
      }
    });

    it("untracks and deletes title record when status is set to null", async () => {
      let deletedWhere: unknown = null;
      let historyData: unknown = null;

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const tx = {
          title: { upsert: vi.fn().mockResolvedValue(mockTitle) },
          userTitle: {
            findUnique: vi.fn(),
            upsert: vi.fn(),
            deleteMany: vi.fn().mockImplementation(({ where }) => {
              deletedWhere = where;
              return Promise.resolve({ count: 1 });
            }),
          },
          watchHistory: {
            create: vi.fn().mockImplementation(({ data }) => {
              historyData = data;
              return Promise.resolve({ id: "hist-del", ...data });
            }),
          },
        };
        // @ts-expect-error mock transaction
        return callback(tx);
      });

      const result = await updateTitleStatusAction({
        titleExternalSource: "tmdb",
        titleExternalId: "550",
        status: null,
      });

      expect(result.success).toBe(true);
      expect(result.status).toBeNull();
      expect(deletedWhere).toMatchObject({
        userId: mockUser.id,
        titleId: mockTitle.id,
      });
      expect(historyData).toMatchObject({
        userId: mockUser.id,
        titleId: mockTitle.id,
        action: "TITLE_REMOVED",
      });
    });

    it("accepts explicit startedAt and watchedAt dates", async () => {
      let createdPayload: unknown = null;

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const tx = {
          title: { upsert: vi.fn().mockResolvedValue(mockTitle) },
          userTitle: {
            findUnique: vi.fn().mockResolvedValue(null),
            upsert: vi.fn().mockImplementation(({ create }) => {
              createdPayload = create;
              return Promise.resolve({ id: "ut-1", ...create });
            }),
            deleteMany: vi.fn(),
          },
          watchHistory: { create: vi.fn().mockResolvedValue({ id: "hist-1" }) },
        };
        // @ts-expect-error mock transaction
        return callback(tx);
      });

      const result = await updateTitleStatusAction({
        titleExternalSource: "tmdb",
        titleExternalId: "550",
        status: "WATCHED",
        startedAt: "2026-09-01",
        watchedAt: "2026-09-05",
      });

      expect(result.success).toBe(true);
      expect(createdPayload).toMatchObject({
        startedAt: new Date("2026-09-01"),
        watchedAt: new Date("2026-09-05"),
      });
    });

    it("catches and returns database transaction errors gracefully", async () => {
      vi.mocked(prisma.$transaction).mockRejectedValueOnce(new Error("Database deadlock occurred"));

      const result = await updateTitleStatusAction({
        titleExternalSource: "tmdb",
        titleExternalId: "550",
        status: "WATCHED",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Database deadlock occurred");
    });
  });
});
