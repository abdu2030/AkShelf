import { beforeEach, describe, expect, it, vi } from "vitest";
import { getLibraryItems } from "./service";
import { prisma } from "@/lib/db";
import { demoLibraryItems } from "@/lib/data/demo-titles";

vi.mock("@/lib/db", () => ({
  prisma: {
    userTitle: { findMany: vi.fn() },
    userEpisode: { findMany: vi.fn() },
  },
}));

describe("Library Service (getLibraryItems)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns demo titles when userId is not provided", async () => {
    const items = await getLibraryItems();
    expect(items).toEqual(demoLibraryItems);
    expect(prisma.userTitle.findMany).not.toHaveBeenCalled();
  });

  it("queries PostgreSQL and calculates progress when authenticated", async () => {
    vi.mocked(prisma.userTitle.findMany).mockResolvedValueOnce([
      {
        id: "ut-1",
        userId: "user-123",
        titleId: "title-1",
        status: "WATCHING",
        rating: 9.0,
        watchedAt: null,
        startedAt: new Date("2026-03-01T12:00:00Z"),
        createdAt: new Date("2026-03-01T12:00:00Z"),
        updatedAt: new Date("2026-03-10T15:30:00Z"),
        title: {
          id: "title-1",
          externalSource: "tmdb",
          externalId: "1399",
          type: "TV",
          title: "Game of Thrones",
          year: 2011,
          posterUrl: "https://image.tmdb.org/t/p/w500/got.jpg",
          seasons: [
            {
              id: "s-1",
              seasonNumber: 1,
              episodeCount: 2,
              episodes: [
                { id: "ep-1", episodeNumber: 1 },
                { id: "ep-2", episodeNumber: 2 },
              ],
            },
          ],
        },
      },
    ] as unknown as never);

    vi.mocked(prisma.userEpisode.findMany).mockResolvedValueOnce([
      { episodeId: "ep-1" },
    ] as unknown as never);

    const items = await getLibraryItems({ userId: "user-123" });

    expect(items.length).toBe(1);
    expect(items[0]).toMatchObject({
      id: "db-title-1",
      title: "Game of Thrones",
      mediaType: "TV",
      year: 2011,
      status: "WATCHING",
      rating: 9.0,
      currentEpisode: 1,
      season: 1,
      episode: 2,
      totalEpisodes: 2,
      updatedAt: "2026-03-10T15:30:00.000Z",
    });
  });

  it("safely falls back to demo titles if database query fails", async () => {
    vi.mocked(prisma.userTitle.findMany).mockRejectedValueOnce(new Error("DB connection timeout"));

    const items = await getLibraryItems({ userId: "user-123" });
    expect(items).toEqual(demoLibraryItems);
  });

  it("returns empty array if authenticated user has no library entries", async () => {
    vi.mocked(prisma.userTitle.findMany).mockResolvedValueOnce([] as unknown as never);

    const items = await getLibraryItems({ userId: "user-123" });
    expect(items).toEqual([]);
  });
});
