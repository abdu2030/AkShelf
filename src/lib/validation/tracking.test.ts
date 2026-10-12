import { describe, expect, it } from "vitest";
import { batchSeasonSchema, toggleEpisodeSchema } from "./tracking";

describe("Tracking Validation Schemas", () => {
  describe("toggleEpisodeSchema", () => {
    it("validates valid toggle episode input", () => {
      const result = toggleEpisodeSchema.safeParse({
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
      if (result.success) {
        expect(result.data.titleExternalSource).toBe("tmdb");
        expect(result.data.titleExternalId).toBe("1399");
        expect(result.data.seasonNumber).toBe(1);
        expect(result.data.episodeNumber).toBe(1);
        expect(result.data.watched).toBe(true);
      }
    });

    it("accepts anilist source", () => {
      const result = toggleEpisodeSchema.safeParse({
        titleExternalSource: "anilist",
        titleExternalId: "16498",
        seasonNumber: 1,
        episodeNumber: 5,
        watched: false,
      });

      expect(result.success).toBe(true);
    });

    it("rejects invalid external source", () => {
      const result = toggleEpisodeSchema.safeParse({
        titleExternalSource: "imdb",
        titleExternalId: "tt123",
        seasonNumber: 1,
        episodeNumber: 1,
        watched: true,
      });

      expect(result.success).toBe(false);
    });

    it("rejects negative seasonNumber or episodeNumber < 1", () => {
      const result1 = toggleEpisodeSchema.safeParse({
        titleExternalSource: "tmdb",
        titleExternalId: "100",
        seasonNumber: -1,
        episodeNumber: 1,
        watched: true,
      });
      expect(result1.success).toBe(false);

      const result2 = toggleEpisodeSchema.safeParse({
        titleExternalSource: "tmdb",
        titleExternalId: "100",
        seasonNumber: 1,
        episodeNumber: 0,
        watched: true,
      });
      expect(result2.success).toBe(false);
    });

    it("rejects missing required fields", () => {
      const result = toggleEpisodeSchema.safeParse({
        titleExternalSource: "tmdb",
        seasonNumber: 1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("batchSeasonSchema", () => {
    it("validates valid batch season input", () => {
      const result = batchSeasonSchema.safeParse({
        titleExternalSource: "tmdb",
        titleExternalId: "1399",
        seasonNumber: 1,
        watched: true,
        episodeNumbers: [1, 2, 3, 4, 5],
        titleName: "Game of Thrones",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.episodeNumbers).toHaveLength(5);
        expect(result.data.watched).toBe(true);
      }
    });

    it("rejects empty episodeNumbers array", () => {
      const result = batchSeasonSchema.safeParse({
        titleExternalSource: "tmdb",
        titleExternalId: "1399",
        seasonNumber: 1,
        watched: true,
        episodeNumbers: [],
      });

      expect(result.success).toBe(false);
    });
  });
});
