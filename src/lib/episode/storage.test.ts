import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ensureEpisodeRecord,
  EpisodeInput,
  getPersistedEpisodesForSeason,
  getPersistedEpisodesForTitleAndSeason,
  persistSeasonEpisodes,
  persistTitleSeasonEpisodes,
} from "./storage";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => {
  const mockPrisma = {
    season: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    episode: {
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

describe("Episode Storage Module (Day 31)", () => {
  const mockSeasonId = "season-db-123";
  const mockTitleId = "title-db-456";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("persistSeasonEpisodes", () => {
    const mockEpisodes: EpisodeInput[] = [
      {
        episodeNumber: 1,
        name: "Winter Is Coming",
        airDate: "2011-04-17",
        runtime: 62,
        externalId: "ep-tmdb-1",
      },
      {
        episodeNumber: 2,
        name: "The Kingsroad",
        airDate: "2011-04-24",
        runtime: 56,
        externalId: "ep-tmdb-2",
      },
      {
        episodeNumber: 3,
        name: "Lord Snow",
        airDate: "2011-05-01",
        runtime: 58,
        externalId: "ep-tmdb-3",
      },
    ];

    it("returns empty array when episodes array is empty", async () => {
      const result = await persistSeasonEpisodes(prisma, mockSeasonId, []);
      expect(result).toEqual([]);
      expect(prisma.episode.upsert).not.toHaveBeenCalled();
    });

    it("persists all episode metadata for the selected season", async () => {
      vi.mocked(prisma.episode.upsert).mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (async (args: any) => {
          return {
            id: `ep-${args.create.episodeNumber}`,
            seasonId: args.create.seasonId,
            episodeNumber: args.create.episodeNumber,
            name: args.create.name ?? null,
            airDate: args.create.airDate ?? null,
            runtime: args.create.runtime ?? null,
            externalId: args.create.externalId ?? null,
            createdAt: new Date(),
          };
        }) as unknown as never,
      );

      const persisted = await persistSeasonEpisodes(prisma, mockSeasonId, mockEpisodes);

      expect(persisted).toHaveLength(3);
      expect(prisma.episode.upsert).toHaveBeenCalledTimes(3);

      expect(prisma.episode.upsert).toHaveBeenCalledWith({
        where: {
          seasonId_episodeNumber: {
            seasonId: mockSeasonId,
            episodeNumber: 1,
          },
        },
        create: {
          seasonId: mockSeasonId,
          episodeNumber: 1,
          name: "Winter Is Coming",
          airDate: "2011-04-17",
          runtime: 62,
          externalId: "ep-tmdb-1",
        },
        update: {
          name: "Winter Is Coming",
          airDate: "2011-04-17",
          runtime: 62,
          externalId: "ep-tmdb-1",
        },
      });
    });

    it("supports selective episode persistence (persists only specified episode numbers)", async () => {
      vi.mocked(prisma.episode.upsert).mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (async (args: any) => {
          return {
            id: `ep-${args.create.episodeNumber}`,
            seasonId: args.create.seasonId,
            episodeNumber: args.create.episodeNumber,
            name: args.create.name ?? null,
            airDate: args.create.airDate ?? null,
            runtime: args.create.runtime ?? null,
            externalId: args.create.externalId ?? null,
            createdAt: new Date(),
          };
        }) as unknown as never,
      );

      const persisted = await persistSeasonEpisodes(prisma, mockSeasonId, mockEpisodes, {
        selectiveEpisodeNumbers: [2],
      });

      expect(persisted).toHaveLength(1);
      expect(prisma.episode.upsert).toHaveBeenCalledTimes(1);
      expect(prisma.episode.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            seasonId_episodeNumber: {
              seasonId: mockSeasonId,
              episodeNumber: 2,
            },
          },
        }),
      );
    });

    it("falls back to default episode name when name is empty or missing", async () => {
      vi.mocked(prisma.episode.upsert).mockResolvedValueOnce({
        id: "ep-5",
        seasonId: mockSeasonId,
        episodeNumber: 5,
        name: "Episode 5",
        airDate: null,
        runtime: null,
        externalId: null,
        createdAt: new Date(),
      } as unknown as never);

      await persistSeasonEpisodes(prisma, mockSeasonId, [{ episodeNumber: 5 }]);

      expect(prisma.episode.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            name: "Episode 5",
          }),
        }),
      );
    });

    it("updates season episodeCount when updateSeasonCount option is true", async () => {
      vi.mocked(prisma.episode.upsert).mockResolvedValue({
        id: "ep-1",
        seasonId: mockSeasonId,
        episodeNumber: 1,
        name: "Episode 1",
        airDate: null,
        runtime: null,
        externalId: null,
        createdAt: new Date(),
      } as unknown as never);

      await persistSeasonEpisodes(prisma, mockSeasonId, mockEpisodes, {
        updateSeasonCount: true,
      });

      expect(prisma.season.update).toHaveBeenCalledWith({
        where: { id: mockSeasonId },
        data: { episodeCount: 3 },
      });
    });
  });

  describe("getPersistedEpisodesForSeason", () => {
    it("fetches episodes ordered by episodeNumber ascending", async () => {
      const mockDbEpisodes = [
        {
          id: "ep-1",
          seasonId: mockSeasonId,
          episodeNumber: 1,
          name: "Ep 1",
          airDate: null,
          runtime: null,
          externalId: null,
          createdAt: new Date(),
        },
        {
          id: "ep-2",
          seasonId: mockSeasonId,
          episodeNumber: 2,
          name: "Ep 2",
          airDate: null,
          runtime: null,
          externalId: null,
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.episode.findMany).mockResolvedValueOnce(
        mockDbEpisodes as unknown as Awaited<ReturnType<typeof prisma.episode.findMany>>,
      );

      const result = await getPersistedEpisodesForSeason(mockSeasonId);

      expect(result).toEqual(mockDbEpisodes);
      expect(prisma.episode.findMany).toHaveBeenCalledWith({
        where: { seasonId: mockSeasonId },
        orderBy: { episodeNumber: "asc" },
      });
    });
  });

  describe("getPersistedEpisodesForTitleAndSeason", () => {
    it("returns empty array when season is not found", async () => {
      vi.mocked(prisma.season.findUnique).mockResolvedValueOnce(null);

      const result = await getPersistedEpisodesForTitleAndSeason(mockTitleId, 1);
      expect(result).toEqual([]);
      expect(prisma.episode.findMany).not.toHaveBeenCalled();
    });

    it("retrieves episodes when season exists", async () => {
      vi.mocked(prisma.season.findUnique).mockResolvedValueOnce({
        id: "season-found-id",
      } as unknown as never);

      const mockDbEpisodes = [
        {
          id: "ep-1",
          seasonId: "season-found-id",
          episodeNumber: 1,
          name: "Ep 1",
          airDate: null,
          runtime: null,
          externalId: null,
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.episode.findMany).mockResolvedValueOnce(
        mockDbEpisodes as unknown as Awaited<ReturnType<typeof prisma.episode.findMany>>,
      );

      const result = await getPersistedEpisodesForTitleAndSeason(mockTitleId, 1);
      expect(result).toEqual(mockDbEpisodes);
      expect(prisma.episode.findMany).toHaveBeenCalledWith({
        where: { seasonId: "season-found-id" },
        orderBy: { episodeNumber: "asc" },
      });
    });
  });

  describe("ensureEpisodeRecord", () => {
    it("upserts a single episode record", async () => {
      vi.mocked(prisma.episode.upsert).mockResolvedValueOnce({
        id: "ep-10",
        seasonId: mockSeasonId,
        episodeNumber: 10,
        name: "Fire and Blood",
        airDate: "2011-06-19",
        runtime: 53,
        externalId: "ext-10",
        createdAt: new Date(),
      } as unknown as never);

      const episode = await ensureEpisodeRecord(prisma, mockSeasonId, 10, {
        name: "Fire and Blood",
        airDate: "2011-06-19",
        runtime: 53,
        externalId: "ext-10",
      });

      expect(episode.episodeNumber).toBe(10);
      expect(episode.name).toBe("Fire and Blood");
      expect(prisma.episode.upsert).toHaveBeenCalledWith({
        where: {
          seasonId_episodeNumber: {
            seasonId: mockSeasonId,
            episodeNumber: 10,
          },
        },
        create: {
          seasonId: mockSeasonId,
          episodeNumber: 10,
          name: "Fire and Blood",
          airDate: "2011-06-19",
          runtime: 53,
          externalId: "ext-10",
        },
        update: {
          name: "Fire and Blood",
          airDate: "2011-06-19",
          runtime: 53,
          externalId: "ext-10",
        },
      });
    });
  });

  describe("persistTitleSeasonEpisodes", () => {
    it("ensures season exists and persists episodes in a composite flow", async () => {
      vi.mocked(prisma.season.upsert).mockResolvedValueOnce({
        id: "s-created",
        titleId: mockTitleId,
        seasonNumber: 1,
        name: "Season 1",
        episodeCount: 1,
        createdAt: new Date(),
      } as unknown as never);

      vi.mocked(prisma.episode.upsert).mockResolvedValueOnce({
        id: "ep-1",
        seasonId: "s-created",
        episodeNumber: 1,
        name: "Pilot",
        airDate: "2008-01-20",
        runtime: 58,
        externalId: null,
        createdAt: new Date(),
      } as unknown as never);

      const result = await persistTitleSeasonEpisodes(prisma, mockTitleId, 1, [
        { episodeNumber: 1, name: "Pilot", airDate: "2008-01-20", runtime: 58 },
      ]);

      expect(result.season.id).toBe("s-created");
      expect(result.episodes).toHaveLength(1);
      expect(prisma.season.upsert).toHaveBeenCalled();
      expect(prisma.episode.upsert).toHaveBeenCalled();
    });
  });
});
