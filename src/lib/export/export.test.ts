import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  escapeCsv,
  generateJsonExport,
  generateCsvExport,
  verifySchemaConsistency,
  restoreFromJson,
} from "./export-service";
import { prisma } from "@/lib/db";
import { ExportDataJson } from "./types";

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    userTitle: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    userEpisode: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    watchHistory: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    title: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    season: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    episode: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

describe("Day 48 - Data Safety & Export Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("escapeCsv (RFC 4180)", () => {
    it("handles null, undefined and basic values cleanly", () => {
      expect(escapeCsv(null)).toBe("");
      expect(escapeCsv(undefined)).toBe("");
      expect(escapeCsv(123)).toBe("123");
      expect(escapeCsv("NormalTitle")).toBe("NormalTitle");
    });

    it("wraps strings containing commas in quotes", () => {
      expect(escapeCsv("Spirited Away, The Movie")).toBe('"Spirited Away, The Movie"');
    });

    it("escapes embedded double quotes by doubling them", () => {
      expect(escapeCsv('Ghost in the "Shell"')).toBe('"Ghost in the ""Shell"""');
    });

    it("wraps multiline text in quotes", () => {
      expect(escapeCsv("Line 1\nLine 2")).toBe('"Line 1\nLine 2"');
    });
  });

  describe("verifySchemaConsistency", () => {
    const validPayload: ExportDataJson = {
      app: "AkShelf",
      version: "1.0.0",
      schemaVersion: 1,
      exportedAt: "2026-10-16T12:00:00.000Z",
      user: {
        email: "owner@akshelf.local",
      },
      stats: {
        totalTitles: 1,
        totalEpisodes: 1,
        totalHistory: 1,
      },
      titles: [
        {
          title: "Inception",
          type: "MOVIE",
          year: 2010,
          externalSource: "tmdb",
          externalId: "27205",
          status: "WATCHED",
          rating: 9.5,
          genres: ["Sci-Fi", "Action"],
        },
      ],
      episodes: [
        {
          externalSource: "tmdb",
          externalId: "1396",
          titleName: "Breaking Bad",
          seasonNumber: 1,
          episodeNumber: 1,
          watchedAt: "2026-10-16T10:00:00.000Z",
        },
      ],
      history: [
        {
          externalSource: "tmdb",
          externalId: "27205",
          titleName: "Inception",
          action: "STATUS_WATCHED",
          occurredAt: "2026-10-16T10:00:00.000Z",
        },
      ],
    };

    it("passes validation for compliant schema payload", () => {
      const result = verifySchemaConsistency(validPayload);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("detects schema mismatch or missing required root properties", () => {
      const invalid = { ...validPayload, app: "OtherApp" };
      const result = verifySchemaConsistency(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("app");
    });
  });

  describe("generateJsonExport", () => {
    it("throws an error when user is not found in database", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

      await expect(generateJsonExport("unknown-user")).rejects.toThrow(
        "User with ID unknown-user not found.",
      );
    });

    it("returns a compliant backup payload for valid user", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "user-123",
        email: "owner@akshelf.local",
      } as unknown as never);

      vi.mocked(prisma.userTitle.findMany).mockResolvedValueOnce([
        {
          id: "ut-1",
          userId: "user-123",
          titleId: "t-1",
          status: "WATCHED",
          rating: 9.0,
          startedAt: new Date("2026-10-01"),
          watchedAt: new Date("2026-10-02"),
          createdAt: new Date("2026-10-01"),
          updatedAt: new Date("2026-10-02"),
          title: {
            title: "Frieren",
            type: "ANIME",
            year: 2023,
            overview: "An elf journey",
            posterUrl: "https://example.com/poster.jpg",
            backdropUrl: null,
            genres: ["Fantasy"],
            externalSource: "anilist",
            externalId: "154587",
          },
        },
      ] as unknown as never);

      vi.mocked(prisma.userEpisode.findMany).mockResolvedValueOnce([
        {
          id: "ue-1",
          userId: "user-123",
          episodeId: "ep-1",
          watchedAt: new Date("2026-10-02"),
          episode: {
            episodeNumber: 1,
            name: "The Journey's End",
            season: {
              seasonNumber: 1,
              title: {
                title: "Frieren",
                externalSource: "anilist",
                externalId: "154587",
              },
            },
          },
        },
      ] as unknown as never);

      vi.mocked(prisma.watchHistory.findMany).mockResolvedValueOnce([
        {
          id: "wh-1",
          action: "EPISODE_WATCHED",
          occurredAt: new Date("2026-10-02"),
          title: {
            title: "Frieren",
            externalSource: "anilist",
            externalId: "154587",
          },
          episode: {
            episodeNumber: 1,
            season: { seasonNumber: 1 },
          },
        },
      ] as unknown as never);

      const result = await generateJsonExport("user-123");

      expect(result.app).toBe("AkShelf");
      expect(result.schemaVersion).toBe(1);
      expect(result.user.email).toBe("owner@akshelf.local");
      expect(result.stats.totalTitles).toBe(1);
      expect(result.stats.totalEpisodes).toBe(1);
      expect(result.stats.totalHistory).toBe(1);
      expect(result.titles[0].title).toBe("Frieren");
      expect(result.titles[0].rating).toBe(9.0);
      expect(result.episodes[0].episodeNumber).toBe(1);
      expect(result.history[0].action).toBe("EPISODE_WATCHED");
    });
  });

  describe("generateCsvExport", () => {
    it("generates correct CSV headers and escaped content rows", async () => {
      vi.mocked(prisma.userTitle.findMany).mockResolvedValueOnce([
        {
          status: "WATCHED",
          rating: 8.5,
          startedAt: new Date("2026-10-10"),
          watchedAt: new Date("2026-10-12"),
          createdAt: new Date("2026-10-10"),
          title: {
            title: "Everything Everywhere, All at Once",
            type: "MOVIE",
            year: 2022,
            externalSource: "tmdb",
            externalId: "545611",
          },
        },
      ] as unknown as never);

      const csv = await generateCsvExport("user-123");
      const lines = csv.split("\r\n");

      expect(lines[0]).toBe(
        "Title,Type,Status,Rating,StartedAt,WatchedAt,ReleaseYear,ExternalSource,ExternalId,AddedAt",
      );
      expect(lines[1]).toContain('"Everything Everywhere, All at Once",MOVIE,WATCHED,8.5');
      expect(lines[1]).toContain("2026-10-10");
      expect(lines[1]).toContain("tmdb,545611");
    });
  });

  describe("restoreFromJson", () => {
    it("rejects invalid backup without triggering database transaction", async () => {
      const result = await restoreFromJson("user-123", { invalid: "data" });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("restores titles, episodes, and history in a transaction", async () => {
      const mockTitleRecord = { id: "t-1", title: "Inception" };
      const mockSeason = { id: "s-1", seasonNumber: 1 };
      const mockEpisode = { id: "e-1", episodeNumber: 1 };

      vi.mocked(prisma.title.upsert).mockResolvedValueOnce(mockTitleRecord as never);
      vi.mocked(prisma.userTitle.upsert).mockResolvedValueOnce({} as never);
      vi.mocked(prisma.title.findUnique).mockResolvedValue(mockTitleRecord as never);
      vi.mocked(prisma.season.upsert).mockResolvedValueOnce(mockSeason as never);
      vi.mocked(prisma.episode.upsert).mockResolvedValueOnce(mockEpisode as never);
      vi.mocked(prisma.userEpisode.upsert).mockResolvedValueOnce({} as never);
      vi.mocked(prisma.season.findUnique).mockResolvedValueOnce(mockSeason as never);
      vi.mocked(prisma.episode.findUnique).mockResolvedValueOnce(mockEpisode as never);
      vi.mocked(prisma.watchHistory.create).mockResolvedValueOnce({} as never);

      const payload: ExportDataJson = {
        app: "AkShelf",
        version: "1.0.0",
        schemaVersion: 1,
        exportedAt: "2026-10-16T12:00:00.000Z",
        user: { email: "owner@akshelf.local" },
        stats: { totalTitles: 1, totalEpisodes: 1, totalHistory: 1 },
        titles: [
          {
            title: "Inception",
            type: "MOVIE",
            year: 2010,
            externalSource: "tmdb",
            externalId: "27205",
            status: "WATCHED",
            rating: 10,
            genres: ["Action"],
          },
        ],
        episodes: [
          {
            externalSource: "tmdb",
            externalId: "27205",
            titleName: "Inception",
            seasonNumber: 1,
            episodeNumber: 1,
            watchedAt: "2026-10-16T12:00:00.000Z",
          },
        ],
        history: [
          {
            externalSource: "tmdb",
            externalId: "27205",
            titleName: "Inception",
            action: "STATUS_WATCHED",
            seasonNumber: 1,
            episodeNumber: 1,
            occurredAt: "2026-10-16T12:00:00.000Z",
          },
        ],
      };

      const result = await restoreFromJson("user-123", payload);

      expect(result.success).toBe(true);
      expect(result.titlesRestored).toBe(1);
      expect(result.episodesRestored).toBe(1);
      expect(result.historyRestored).toBe(1);
      expect(result.errors).toHaveLength(0);
    });
  });
});
