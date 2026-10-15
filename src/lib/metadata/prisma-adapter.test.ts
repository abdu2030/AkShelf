import { describe, expect, it } from "vitest";
import {
  mediaResultToPrismaCreateInput,
  mediaResultToPrismaUpsertArgs,
  normalizedEpisodeToPrismaUpsertArgs,
  normalizedSeasonToPrismaUpsertArgs,
  prismaTitleToMediaResult,
  PrismaTitleWithRelations,
} from "./prisma-adapter";
import { MediaResult, MediaResultSchema } from "./types";

describe("Prisma Title Metadata Adapter", () => {
  const sampleMediaResult: MediaResult = {
    id: "tmdb:27205",
    externalSource: "tmdb",
    externalId: "27205",
    type: "MOVIE",
    title: "Inception",
    overview: "A thief enters the dreams of others.",
    year: 2010,
    posterUrl: "https://image.tmdb.org/t/p/w500/poster.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/backdrop.jpg",
    genres: ["Action", "Science Fiction"],
  };

  it("converts MediaResult to Prisma Title create input", () => {
    const input = mediaResultToPrismaCreateInput(sampleMediaResult);

    expect(input.externalSource).toBe("tmdb");
    expect(input.externalId).toBe("27205");
    expect(input.title).toBe("Inception");
    expect(input.type).toBe("MOVIE");
    expect(input.year).toBe(2010);
    expect(input.genres).toEqual(["Action", "Science Fiction"]);
  });

  it("generates correct Prisma upsert parameters with composite key", () => {
    const upsertArgs = mediaResultToPrismaUpsertArgs(sampleMediaResult);

    expect(upsertArgs.where.externalSource_externalId).toEqual({
      externalSource: "tmdb",
      externalId: "27205",
    });
    expect(upsertArgs.create.title).toBe("Inception");
    expect(upsertArgs.update.title).toBe("Inception");
  });

  it("converts Prisma Title record with relations to MediaResult", () => {
    const record: PrismaTitleWithRelations = {
      id: "clxyz123",
      externalSource: "tmdb",
      externalId: "1396",
      title: "Breaking Bad",
      type: "TV",
      year: 2008,
      overview: "Chemistry teacher turns kingpin.",
      posterUrl: "https://image.tmdb.org/t/p/w500/bb.jpg",
      backdropUrl: null,
      genres: ["Drama", "Crime"],
      createdAt: new Date(),
      updatedAt: new Date(),
      seasons: [
        {
          id: "season-1",
          titleId: "clxyz123",
          seasonNumber: 1,
          name: "Season 1",
          episodeCount: 7,
          createdAt: new Date(),
          episodes: [
            {
              id: "ep-1",
              seasonId: "season-1",
              externalId: null,
              episodeNumber: 1,
              name: "Pilot",
              airDate: "2008-01-20",
              runtime: 58,
              createdAt: new Date(),
            },
          ],
        },
      ],
    };

    const media = prismaTitleToMediaResult(record);

    expect(media.id).toBe("clxyz123");
    expect(media.externalSource).toBe("tmdb");
    expect(media.externalId).toBe("1396");
    expect(media.type).toBe("TV");
    expect(media.totalEpisodes).toBe(7);
    expect(media.totalSeasons).toBe(1);
    expect(media.seasons).toHaveLength(1);
    expect(media.seasons?.[0].episodes?.[0].name).toBe("Pilot");

    expect(() => MediaResultSchema.parse(media)).not.toThrow();
  });

  it("builds Prisma upsert arguments for normalized season summaries", () => {
    const args = normalizedSeasonToPrismaUpsertArgs("title-123", {
      seasonNumber: 2,
      name: "Season 2: The Return",
      episodeCount: 12,
    });

    expect(args.where.titleId_seasonNumber).toEqual({
      titleId: "title-123",
      seasonNumber: 2,
    });
    expect(args.create).toEqual({
      titleId: "title-123",
      seasonNumber: 2,
      name: "Season 2: The Return",
      episodeCount: 12,
    });
    expect(args.update).toEqual({
      name: "Season 2: The Return",
      episodeCount: 12,
    });

    // Test fallback naming and default episode count
    const fallbackArgs = normalizedSeasonToPrismaUpsertArgs("title-123", {
      seasonNumber: 3,
      name: "",
      episodeCount: 0,
    });
    expect(fallbackArgs.create.name).toBe("Season 3");
    expect(fallbackArgs.create.episodeCount).toBe(0);
  });

  it("builds Prisma upsert arguments for normalized episode records", () => {
    const args = normalizedEpisodeToPrismaUpsertArgs("season-123", {
      episodeNumber: 4,
      name: "The Pointy End",
      airDate: "2011-05-08",
      runtime: 55,
    });

    expect(args.where.seasonId_episodeNumber).toEqual({
      seasonId: "season-123",
      episodeNumber: 4,
    });
    expect(args.create).toEqual({
      seasonId: "season-123",
      episodeNumber: 4,
      name: "The Pointy End",
      airDate: "2011-05-08",
      runtime: 55,
    });
    expect(args.update).toEqual({
      name: "The Pointy End",
      airDate: "2011-05-08",
      runtime: 55,
    });

    // Test fallback naming when name is missing or whitespace
    const fallbackArgs = normalizedEpisodeToPrismaUpsertArgs("season-123", {
      episodeNumber: 5,
      name: "   ",
    });
    expect(fallbackArgs.create.name).toBe("Episode 5");
    expect(fallbackArgs.create.airDate).toBeNull();
    expect(fallbackArgs.create.runtime).toBeNull();
  });
});
