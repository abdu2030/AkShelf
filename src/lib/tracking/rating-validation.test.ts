import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateTitleRatingAction } from "@/actions/tracking";
import { updateTitleRatingSchema } from "@/lib/validation/tracking";
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
    userTitle: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
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

describe("Rating Validation & Persistence Baseline Suite (Day 43)", () => {
  const mockUser = { id: "user-rating-43", email: "rater@akshelf.local" };
  const mockTitle = {
    id: "title-rating-43",
    externalSource: "tmdb",
    externalId: "27205",
    title: "Inception",
    type: "MOVIE",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Schema Validation Bounds", () => {
    it("accepts each integer score from 1 to 10 inclusive", () => {
      for (let score = 1; score <= 10; score++) {
        const result = updateTitleRatingSchema.safeParse({
          titleExternalSource: "tmdb",
          titleExternalId: "27205",
          rating: score,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.rating).toBe(score);
        }
      }
    });

    it("accepts null to explicitly clear rating", () => {
      const result = updateTitleRatingSchema.safeParse({
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        rating: null,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rating).toBeNull();
      }
    });

    it("rejects score of 0 (scale is strictly 1 to 10)", () => {
      const result = updateTitleRatingSchema.safeParse({
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        rating: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative rating scores", () => {
      const negativeScores = [-1, -5, -10];
      for (const score of negativeScores) {
        const result = updateTitleRatingSchema.safeParse({
          titleExternalSource: "tmdb",
          titleExternalId: "27205",
          rating: score,
        });
        expect(result.success).toBe(false);
      }
    });

    it("rejects rating scores strictly greater than 10", () => {
      const excessScores = [10.1, 11, 15, 100];
      for (const score of excessScores) {
        const result = updateTitleRatingSchema.safeParse({
          titleExternalSource: "tmdb",
          titleExternalId: "27205",
          rating: score,
        });
        expect(result.success).toBe(false);
      }
    });

    it("rejects non-numeric types", () => {
      const invalidTypes = ["10", "five", true, {}, []];
      for (const val of invalidTypes) {
        const result = updateTitleRatingSchema.safeParse({
          titleExternalSource: "tmdb",
          titleExternalId: "27205",
          rating: val,
        });
        expect(result.success).toBe(false);
      }
    });
  });

  describe("Server Action Rating Mutations", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: mockUser });
    });

    it("simulates rating successfully in demo/unauthenticated mode", async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await updateTitleRatingAction({
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        rating: 9,
      });

      expect(result.success).toBe(true);
      expect(result.isDemo).toBe(true);
      expect(result.rating).toBe(9);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("defaults status to WATCHED when rating an untracked title", async () => {
      let upsertCreateData: unknown = null;
      let historyData: unknown = null;

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const tx = {
          title: { upsert: vi.fn().mockResolvedValue(mockTitle) },
          userTitle: {
            upsert: vi.fn().mockImplementation(({ create }) => {
              upsertCreateData = create;
              return Promise.resolve({ ...mockTitle, ...create });
            }),
            updateMany: vi.fn(),
          },
          watchHistory: {
            create: vi.fn().mockImplementation(({ data }) => {
              historyData = data;
              return Promise.resolve({ id: "hist-r1", ...data });
            }),
          },
        };
        // @ts-expect-error mock transaction
        return callback(tx);
      });

      const result = await updateTitleRatingAction({
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        rating: 8,
        titleName: "Inception",
        mediaType: "MOVIE",
      });

      expect(result.success).toBe(true);
      expect(upsertCreateData).toMatchObject({
        userId: mockUser.id,
        titleId: mockTitle.id,
        rating: 8,
        status: "WATCHED",
      });
      expect(historyData).toMatchObject({
        userId: mockUser.id,
        titleId: mockTitle.id,
        action: "RATED_8",
      });
      expect(revalidatePath).toHaveBeenCalledWith("/library");
    });

    it("clears rating with null and creates RATING_CLEARED audit log", async () => {
      let updateManyData: unknown = null;
      let historyData: unknown = null;

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const tx = {
          title: { upsert: vi.fn().mockResolvedValue(mockTitle) },
          userTitle: {
            upsert: vi.fn(),
            updateMany: vi.fn().mockImplementation(({ data }) => {
              updateManyData = data;
              return Promise.resolve({ count: 1 });
            }),
          },
          watchHistory: {
            create: vi.fn().mockImplementation(({ data }) => {
              historyData = data;
              return Promise.resolve({ id: "hist-rc", ...data });
            }),
          },
        };
        // @ts-expect-error mock transaction
        return callback(tx);
      });

      const result = await updateTitleRatingAction({
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        rating: null,
      });

      expect(result.success).toBe(true);
      expect(updateManyData).toMatchObject({
        rating: null,
      });
      expect(historyData).toMatchObject({
        userId: mockUser.id,
        titleId: mockTitle.id,
        action: "RATING_CLEARED",
      });
    });

    it("returns error message if database query fails", async () => {
      vi.mocked(prisma.$transaction).mockRejectedValueOnce(new Error("Connection reset by peer"));

      const result = await updateTitleRatingAction({
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        rating: 10,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Connection reset by peer");
    });
  });
});
