import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  ensureSeasonRecord,
  getPersistedSeasonsForTitle,
  persistTitleSeasons,
  SeasonSummary,
} from "./storage";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => {
  const mockPrisma = {
    season: {
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    episode: {
      create: vi.fn(),
      upsert: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

describe("Season Storage Module (Day 30)", () => {
  const mockTitleId = "title-db-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("persistTitleSeasons", () => {
    const mockSeasons: SeasonSummary[] = [
      { seasonNumber: 1, name: "Season 1", episodeCount: 10 },
      { seasonNumber: 2, name: "Season 2", episodeCount: 12 },
      { seasonNumber: 3, name: "Season 3", episodeCount: 8 },
    ];

    it("returns empty array when seasons array is empty", async () => {
      const result = await persistTitleSeasons(prisma, mockTitleId, []);
      expect(result).toEqual([]);
      expect(prisma.season.upsert).not.toHaveBeenCalled();
    });

    it("persists all season summaries without touching episode records", async () => {
      vi.mocked(prisma.season.upsert).mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (async (args: any) => {
          return {
            id: `season-${args.create.seasonNumber}`,
            titleId: args.create.titleId,
            seasonNumber: args.create.seasonNumber,
            name: args.create.name ?? null,
            episodeCount: args.create.episodeCount ?? 0,
            createdAt: new Date(),
          };
        }) as unknown as never,
      );

      const persisted = await persistTitleSeasons(prisma, mockTitleId, mockSeasons);

      expect(persisted).toHaveLength(3);
      expect(prisma.season.upsert).toHaveBeenCalledTimes(3);

      expect(prisma.season.upsert).toHaveBeenCalledWith({
        where: {
          titleId_seasonNumber: {
            titleId: mockTitleId,
            seasonNumber: 1,
          },
        },
        create: {
          titleId: mockTitleId,
          seasonNumber: 1,
          name: "Season 1",
          episodeCount: 10,
        },
        update: {
          name: "Season 1",
          episodeCount: 10,
        },
      });

      // INVARIANT: Avoid importing unnecessary episodes until needed (Day 30)
      expect(prisma.episode.create).not.toHaveBeenCalled();
      expect(prisma.episode.upsert).not.toHaveBeenCalled();
    });

    it("supports selective season persistence (only specified season numbers)", async () => {
      vi.mocked(prisma.season.upsert).mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (async (args: any) => {
          return {
            id: `season-${args.create.seasonNumber}`,
            titleId: args.create.titleId,
            seasonNumber: args.create.seasonNumber,
            name: args.create.name ?? null,
            episodeCount: args.create.episodeCount ?? 0,
            createdAt: new Date(),
          };
        }) as unknown as never,
      );

      const persisted = await persistTitleSeasons(prisma, mockTitleId, mockSeasons, {
        selectiveSeasonNumbers: [2],
      });

      expect(persisted).toHaveLength(1);
      expect(prisma.season.upsert).toHaveBeenCalledTimes(1);
      expect(prisma.season.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            titleId_seasonNumber: {
              titleId: mockTitleId,
              seasonNumber: 2,
            },
          },
        }),
      );
    });

    it("defaults missing season names cleanly", async () => {
      vi.mocked(prisma.season.upsert).mockResolvedValueOnce({
        id: "season-1",
        titleId: mockTitleId,
        seasonNumber: 1,
        name: "Season 1",
        episodeCount: 5,
        createdAt: new Date(),
      } as unknown as never);

      await persistTitleSeasons(prisma, mockTitleId, [{ seasonNumber: 1, episodeCount: 5 }]);

      expect(prisma.season.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            name: "Season 1",
          }),
        }),
      );
    });
  });

  describe("getPersistedSeasonsForTitle", () => {
    it("retrieves seasons ordered by seasonNumber ascending", async () => {
      const mockDbSeasons = [
        { id: "s1", titleId: mockTitleId, seasonNumber: 1, name: "Season 1", episodeCount: 10 },
        { id: "s2", titleId: mockTitleId, seasonNumber: 2, name: "Season 2", episodeCount: 12 },
      ];

      vi.mocked(prisma.season.findMany).mockResolvedValueOnce(
        mockDbSeasons as unknown as Awaited<ReturnType<typeof prisma.season.findMany>>,
      );

      const result = await getPersistedSeasonsForTitle(mockTitleId);

      expect(result).toEqual(mockDbSeasons);
      expect(prisma.season.findMany).toHaveBeenCalledWith({
        where: { titleId: mockTitleId },
        orderBy: { seasonNumber: "asc" },
      });
    });
  });

  describe("ensureSeasonRecord", () => {
    it("upserts a single season record with provided metadata", async () => {
      vi.mocked(prisma.season.upsert).mockResolvedValueOnce({
        id: "season-1",
        titleId: mockTitleId,
        seasonNumber: 1,
        name: "Season 1",
        episodeCount: 24,
        createdAt: new Date(),
      } as unknown as never);

      const season = await ensureSeasonRecord(prisma, mockTitleId, 1, {
        name: "Season 1",
        episodeCount: 24,
      });

      expect(season.episodeCount).toBe(24);
      expect(prisma.season.upsert).toHaveBeenCalledWith({
        where: {
          titleId_seasonNumber: {
            titleId: mockTitleId,
            seasonNumber: 1,
          },
        },
        create: {
          titleId: mockTitleId,
          seasonNumber: 1,
          name: "Season 1",
          episodeCount: 24,
        },
        update: {
          name: "Season 1",
          episodeCount: 24,
        },
      });
    });
  });
});
