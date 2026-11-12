import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { repairCompletedTitle } from "./repair-completion";

vi.mock("@/lib/db", () => ({
  prisma: {
    userTitle: { findUnique: vi.fn(), updateMany: vi.fn() },
    userEpisode: { findMany: vi.fn() },
  },
}));

const seasons = [{ seasonNumber: 1, episodeCount: 2 }];
const watched = { "1:1": true, "1:2": true };
const completedAt = new Date("2026-10-20T10:00:00Z");
const existing = {
  id: "entry",
  userId: "owner",
  titleId: "any-title",
  status: "WATCHING",
  watchedAt: null,
  updatedAt: completedAt,
};

describe("legacy completion repair for every title", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma.userTitle.findUnique).mockResolvedValue(existing as never);
    vi.mocked(prisma.userEpisode.findMany).mockResolvedValue(
      [1, 2].map((episodeNumber) => ({
        watchedAt: completedAt,
        episode: { episodeNumber, season: { seasonNumber: 1 } },
      })) as never,
    );
    vi.mocked(prisma.userTitle.updateMany).mockResolvedValue({ count: 1 });
  });

  it("persists completion using the historical episode date without changing ratings or history", async () => {
    const result = await repairCompletedTitle("owner", "any-title", seasons, watched);
    expect(result).toMatchObject({ status: "WATCHED", watchedAt: completedAt });
    expect(prisma.userTitle.updateMany).toHaveBeenCalledWith({
      where: { id: "entry", userId: "owner", status: "WATCHING", updatedAt: completedAt },
      data: { status: "WATCHED", watchedAt: completedAt },
    });
    expect(prisma.userEpisode.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "owner", episode: { season: { titleId: "any-title" } } },
      }),
    );
  });

  it("keeps an existing completion date", async () => {
    const previousDate = new Date("2026-10-01T00:00:00Z");
    vi.mocked(prisma.userTitle.findUnique).mockResolvedValue({
      ...existing,
      watchedAt: previousDate,
    } as never);
    expect((await repairCompletedTitle("owner", "any-title", seasons, watched))?.watchedAt).toEqual(
      previousDate,
    );
  });

  it.each([
    { catalog: null },
    { catalog: [...seasons, { seasonNumber: 2, episodeCount: 3 }] },
    { catalog: [{ seasonNumber: 1, episodeCount: 2, episodeCountKnown: false }] },
  ])("does not repair from incomplete or unverified catalog data", async ({ catalog }) => {
    expect(await repairCompletedTitle("owner", "any-title", catalog, watched)).toBeNull();
    expect(prisma.userTitle.findUnique).not.toHaveBeenCalled();
    expect(prisma.userTitle.updateMany).not.toHaveBeenCalled();
  });

  it.each(["WATCHED", "ON_HOLD", "DROPPED", "PLAN_TO_WATCH"])(
    "preserves an explicit %s status",
    async (status) => {
      vi.mocked(prisma.userTitle.findUnique).mockResolvedValue({ ...existing, status } as never);
      expect((await repairCompletedTitle("owner", "any-title", seasons, watched))?.status).toBe(
        status,
      );
      expect(prisma.userTitle.updateMany).not.toHaveBeenCalled();
    },
  );

  it("returns the actual saved status if a concurrent edit wins", async () => {
    vi.mocked(prisma.userTitle.updateMany).mockResolvedValue({ count: 0 });
    vi.mocked(prisma.userTitle.findUnique)
      .mockResolvedValueOnce(existing as never)
      .mockResolvedValueOnce({ ...existing, status: "DROPPED" } as never);
    expect((await repairCompletedTitle("owner", "any-title", seasons, watched))?.status).toBe(
      "DROPPED",
    );
  });
});

it("does not repair from stale page progress after an episode was unwatched", async () => {
  vi.mocked(prisma.userTitle.findUnique).mockResolvedValue(existing as never);
  vi.mocked(prisma.userTitle.updateMany).mockClear();
  vi.mocked(prisma.userEpisode.findMany).mockResolvedValue([
    { watchedAt: completedAt, episode: { episodeNumber: 1, season: { seasonNumber: 1 } } },
  ] as never);
  expect((await repairCompletedTitle("owner", "any-title", seasons, watched))?.status).toBe(
    "WATCHING",
  );
  expect(prisma.userTitle.updateMany).not.toHaveBeenCalled();
});
