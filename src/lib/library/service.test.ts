import { beforeEach, describe, expect, it, vi } from "vitest";
import { getLibraryItems } from "./service";
import { prisma } from "@/lib/db";
import { metadataService } from "@/lib/metadata/service";
import { demoLibraryItems } from "@/lib/data/demo-titles";

vi.mock("@/lib/metadata/service", () => ({
  metadataService: { getTitleSeasons: vi.fn(), getTitleDetails: vi.fn() },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    userTitle: { findMany: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() },
    userEpisode: { findMany: vi.fn() },
  },
}));

describe("Library Service (getLibraryItems)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(metadataService.getTitleSeasons).mockResolvedValue([
      { seasonNumber: 1, name: "Season 1", episodeCount: 2 },
    ]);
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

  it("omits episode progress fields for movies in the user library", async () => {
    vi.mocked(prisma.userTitle.findMany).mockResolvedValueOnce([
      {
        id: "ut-movie",
        userId: "user-123",
        titleId: "title-movie",
        status: "WATCHING",
        rating: 8.0,
        watchedAt: null,
        startedAt: new Date("2026-03-01T12:00:00Z"),
        createdAt: new Date("2026-03-01T12:00:00Z"),
        updatedAt: new Date("2026-03-10T15:30:00Z"),
        title: {
          id: "title-movie",
          externalSource: "tmdb",
          externalId: "980489",
          type: "MOVIE",
          title: "Gran Turismo",
          year: 2023,
          posterUrl: "https://image.tmdb.org/t/p/w500/granturismo.jpg",
          seasons: [],
        },
      },
    ] as unknown as never);

    vi.mocked(prisma.userEpisode.findMany).mockResolvedValueOnce([] as unknown as never);

    const items = await getLibraryItems({ userId: "user-123" });

    expect(items.length).toBe(1);
    expect(items[0]).toMatchObject({
      id: "db-title-movie",
      title: "Gran Turismo",
      mediaType: "MOVIE",
      year: 2023,
      status: "WATCHING",
      rating: 8.0,
      currentEpisode: null,
      season: null,
      episode: null,
      totalEpisodes: null,
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

describe("consistent library completion", () => {
  const date = new Date("2026-10-20T10:00:00Z");
  const row = () => ({
    id: "entry",
    userId: "owner",
    titleId: "series",
    status: "WATCHING",
    rating: 8,
    watchedAt: null,
    createdAt: date,
    updatedAt: date,
    title: {
      id: "series",
      type: "TV",
      title: "A tracked series",
      externalSource: "tmdb",
      externalId: "123",
      posterUrl: "https://image.tmdb.org/poster.jpg",
      seasons: [
        {
          seasonNumber: 1,
          episodeCount: 2,
          episodes: [
            { id: "e1", episodeNumber: 1 },
            { id: "e2", episodeNumber: 2 },
          ],
        },
      ],
    },
  });
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.userTitle.findMany).mockResolvedValue([row()] as never);
    vi.mocked(prisma.userEpisode.findMany).mockResolvedValue(
      [1, 2].map((episodeNumber) => ({
        episodeId: `e${episodeNumber}`,
        watchedAt: date,
        episode: { episodeNumber, season: { seasonNumber: 1 } },
      })) as never,
    );
    vi.mocked(prisma.userTitle.findUnique).mockResolvedValue(row() as never);
    vi.mocked(prisma.userTitle.updateMany).mockResolvedValue({ count: 1 });
  });
  it("repairs an existing fully watched entry and returns the saved Watched status", async () => {
    vi.mocked(metadataService.getTitleSeasons).mockResolvedValue([
      { seasonNumber: 1, name: "Season 1", episodeCount: 2 },
    ]);
    const [item] = await getLibraryItems({ userId: "owner" });
    expect(item).toMatchObject({ status: "WATCHED", watchedAt: date.toISOString(), rating: 8 });
    expect(prisma.userTitle.updateMany).toHaveBeenCalledTimes(1);
  });
  it("includes unloaded seasons in totals and shows completed seasons without completing the whole show", async () => {
    vi.mocked(metadataService.getTitleSeasons).mockResolvedValue([
      { seasonNumber: 1, name: "Season 1", episodeCount: 2 },
      { seasonNumber: 2, name: "Season 2", episodeCount: 3 },
    ]);
    const [item] = await getLibraryItems({ userId: "owner" });
    expect(item).toMatchObject({
      status: "WATCHING",
      currentEpisode: 2,
      totalEpisodes: 5,
      season: 2,
      episode: 1,
      completedSeasons: [1],
    });
    expect(prisma.userTitle.updateMany).not.toHaveBeenCalled();
  });
  it("keeps an ongoing combined anime Watching when its full total is unknown", async () => {
    vi.mocked(metadataService.getTitleSeasons).mockResolvedValue([
      { seasonNumber: 1, name: "Season 1", episodeCount: 2, episodeCountKnown: false },
    ]);
    const [item] = await getLibraryItems({ userId: "owner" });
    expect(item).toMatchObject({ status: "WATCHING", currentEpisode: 2, totalEpisodes: null });
    expect(prisma.userTitle.updateMany).not.toHaveBeenCalled();
  });
});
