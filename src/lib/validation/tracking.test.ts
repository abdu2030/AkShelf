import { describe, expect, it } from "vitest";
import {
  batchSeasonSchema,
  toggleEpisodeSchema,
  updateTitleDatesSchema,
  updateTitleRatingSchema,
  updateTitleStatusSchema,
} from "./tracking";

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

  describe("updateTitleStatusSchema", () => {
    it("validates valid status updates across all status types", () => {
      const statuses = ["WATCHED", "WATCHING", "PLAN_TO_WATCH", "ON_HOLD", "DROPPED"] as const;

      for (const status of statuses) {
        const result = updateTitleStatusSchema.safeParse({
          titleExternalSource: "tmdb",
          titleExternalId: "27205",
          status,
          titleName: "Inception",
          mediaType: "MOVIE",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe(status);
        }
      }
    });

    it("accepts null status to untrack/remove a title from shelf", () => {
      const result = updateTitleStatusSchema.safeParse({
        titleExternalSource: "anilist",
        titleExternalId: "16498",
        status: null,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBeNull();
      }
    });

    it("rejects invalid status string", () => {
      const result = updateTitleStatusSchema.safeParse({
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        status: "COMPLETED",
      });

      expect(result.success).toBe(false);
    });

    it("validates optional rating within 0-10 bounds", () => {
      const valid = updateTitleStatusSchema.safeParse({
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        status: "WATCHED",
        rating: 9.5,
      });
      expect(valid.success).toBe(true);

      const invalidRating = updateTitleStatusSchema.safeParse({
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        status: "WATCHED",
        rating: 11,
      });
      expect(invalidRating.success).toBe(false);
    });
  });

  describe("updateTitleRatingSchema", () => {
    it("validates valid rating between 1 and 10", () => {
      const result = updateTitleRatingSchema.safeParse({
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        rating: 9,
        titleName: "Inception",
        mediaType: "MOVIE",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rating).toBe(9);
      }
    });

    it("accepts null to clear rating", () => {
      const result = updateTitleRatingSchema.safeParse({
        titleExternalSource: "anilist",
        titleExternalId: "16498",
        rating: null,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rating).toBeNull();
      }
    });

    it("rejects ratings below 1 or above 10", () => {
      const tooLow = updateTitleRatingSchema.safeParse({
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        rating: 0,
      });
      expect(tooLow.success).toBe(false);

      const tooHigh = updateTitleRatingSchema.safeParse({
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        rating: 11,
      });
      expect(tooHigh.success).toBe(false);
    });

    it("rejects missing titleExternalId", () => {
      const missingId = updateTitleRatingSchema.safeParse({
        titleExternalSource: "tmdb",
        titleExternalId: "",
        rating: 8,
      });
      expect(missingId.success).toBe(false);
    });
  });

  describe("updateTitleDatesSchema", () => {
    it("validates valid dates (YYYY-MM-DD format)", () => {
      const result = updateTitleDatesSchema.safeParse({
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        startedAt: "2026-10-01",
        watchedAt: "2026-10-12",
        titleName: "Inception",
        mediaType: "MOVIE",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.startedAt).toBe("2026-10-01");
        expect(result.data.watchedAt).toBe("2026-10-12");
      }
    });

    it("accepts null to clear dates", () => {
      const result = updateTitleDatesSchema.safeParse({
        titleExternalSource: "anilist",
        titleExternalId: "16498",
        startedAt: null,
        watchedAt: null,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.startedAt).toBeNull();
        expect(result.data.watchedAt).toBeNull();
      }
    });

    it("rejects invalid date format", () => {
      const invalidDate = updateTitleDatesSchema.safeParse({
        titleExternalSource: "tmdb",
        titleExternalId: "27205",
        startedAt: "not-a-date",
      });
      expect(invalidDate.success).toBe(false);
    });

    it("rejects missing titleExternalId", () => {
      const missingId = updateTitleDatesSchema.safeParse({
        titleExternalSource: "tmdb",
        titleExternalId: "",
        startedAt: "2026-10-01",
      });
      expect(missingId.success).toBe(false);
    });
  });
});
