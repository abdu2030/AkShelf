import { describe, expect, it } from "vitest";
import {
  aniListMediaToMediaResult,
  aniListMediaToNormalizedEpisodes,
  aniListMediaToNormalizedSeasons,
  cleanAniListDescription,
  formatAniListStatus,
  formatFuzzyDate,
} from "./anilist";
import { AniListMedia } from "@/lib/anilist";
import { MediaResultSchema } from "../types";

describe("AniList Metadata Translators", () => {
  describe("cleanAniListDescription", () => {
    it("strips HTML tags and preserves line breaks cleanly", () => {
      const html = "<p>Humanity lives behind walls.<br><br><i>Titans</i> lurk outside.</p>";
      const cleaned = cleanAniListDescription(html);
      expect(cleaned).toBe("Humanity lives behind walls.\n\nTitans lurk outside.");
    });

    it("unescapes HTML entities", () => {
      const html = "It&#039;s an &quot;epic&quot; show &amp; manga.";
      expect(cleanAniListDescription(html)).toBe('It\'s an "epic" show & manga.');
    });

    it("returns null for empty strings", () => {
      expect(cleanAniListDescription("")).toBeNull();
      expect(cleanAniListDescription(null)).toBeNull();
      expect(cleanAniListDescription(undefined)).toBeNull();
    });
  });

  describe("formatAniListStatus", () => {
    it("converts uppercase statuses to title case", () => {
      expect(formatAniListStatus("FINISHED")).toBe("Finished");
      expect(formatAniListStatus("RELEASING")).toBe("Releasing");
      expect(formatAniListStatus("NOT_YET_RELEASED")).toBe("Not Yet Released");
      expect(formatAniListStatus("CANCELLED")).toBe("Cancelled");
      expect(formatAniListStatus("HIATUS")).toBe("On Hiatus");
    });
  });

  describe("formatFuzzyDate", () => {
    it("formats 3-part date YYYY-MM-DD", () => {
      expect(formatFuzzyDate({ year: 2013, month: 4, day: 7 })).toBe("2013-04-07");
    });

    it("formats year and month YYYY-MM", () => {
      expect(formatFuzzyDate({ year: 2013, month: 4, day: null })).toBe("2013-04");
    });

    it("formats year only YYYY", () => {
      expect(formatFuzzyDate({ year: 2013, month: null, day: null })).toBe("2013");
    });

    it("returns null for missing year", () => {
      expect(formatFuzzyDate(null)).toBeNull();
      expect(formatFuzzyDate({ year: null })).toBeNull();
    });
  });

  describe("aniListMediaToMediaResult", () => {
    const baseMedia: AniListMedia = {
      id: 16498,
      title: {
        romaji: "Shingeki no Kyojin",
        english: "Attack on Titan",
        native: "進撃の巨人",
      },
      description: "<p>Centuries ago, mankind was nearly slaughtered to extinction by Titans.</p>",
      format: "TV",
      status: "FINISHED",
      episodes: 25,
      duration: 24,
      genres: ["Action", "Fantasy", "Drama"],
      averageScore: 85,
      popularity: 540000,
      coverImage: {
        extraLarge: "https://s4.anilist.co/file/cover-xl.jpg",
        large: "https://s4.anilist.co/file/cover-lg.jpg",
      },
      bannerImage: "https://s4.anilist.co/file/banner.jpg",
      startDate: { year: 2013, month: 4, day: 7 },
      studios: {
        nodes: [
          { id: 1, name: "WIT Studio", isAnimationStudio: true },
          { id: 2, name: "Pony Canyon", isAnimationStudio: false },
        ],
      },
      trailer: { id: "MGRm4IzK1SQ", site: "youtube" },
    };

    it("translates AniList media item with English title preferred", () => {
      const result = aniListMediaToMediaResult(baseMedia, "english");

      expect(result.id).toBe("anilist:16498");
      expect(result.externalSource).toBe("anilist");
      expect(result.externalId).toBe("16498");
      expect(result.type).toBe("ANIME");
      expect(result.title).toBe("Attack on Titan");
      expect(result.originalTitle).toBe("Shingeki no Kyojin");
      expect(result.year).toBe(2013);
      expect(result.releaseDate).toBe("2013-04-07");
      expect(result.posterUrl).toBe("https://s4.anilist.co/file/cover-xl.jpg");
      expect(result.backdropUrl).toBe("https://s4.anilist.co/file/banner.jpg");
      expect(result.genres).toEqual(["Action", "Fantasy", "Drama"]);
      expect(result.runtime).toBe(24);
      expect(result.status).toBe("Finished");
      expect(result.voteAverage).toBe(8.5); // 85 / 10
      expect(result.totalEpisodes).toBe(25);
      expect(result.studios).toEqual(["WIT Studio"]); // filters animation studios
      expect(result.trailerUrl).toBe("https://www.youtube.com/watch?v=MGRm4IzK1SQ");

      expect(() => MediaResultSchema.parse(result)).not.toThrow();
    });

    it("respects Romaji title preference when requested", () => {
      const result = aniListMediaToMediaResult(baseMedia, "romaji");
      expect(result.title).toBe("Shingeki no Kyojin");
    });

    it("falls back to available title when English is null", () => {
      const mediaWithoutEnglish: AniListMedia = {
        ...baseMedia,
        title: {
          english: null,
          romaji: "Sousou no Frieren",
          native: "葬送のフリーレン",
        },
      };

      const result = aniListMediaToMediaResult(mediaWithoutEnglish, "english");
      expect(result.title).toBe("Sousou no Frieren");
    });

    it("includes normalized seasons and episodes for TV anime series", () => {
      const result = aniListMediaToMediaResult(baseMedia, "english");
      expect(result.seasons).toBeDefined();
      expect(result.seasons).toHaveLength(1);
      expect(result.seasons?.[0].seasonNumber).toBe(1);
      expect(result.seasons?.[0].episodeCount).toBe(25);
      expect(result.seasons?.[0].episodes).toHaveLength(25);
      expect(result.seasons?.[0].episodes?.[0].name).toBe("Episode 1");
    });

    it("omits season breakdowns for anime movies", () => {
      const movieMedia: AniListMedia = {
        ...baseMedia,
        id: 199,
        format: "MOVIE",
        episodes: 1,
      };
      const result = aniListMediaToMediaResult(movieMedia, "english");
      expect(result.seasons).toBeUndefined();
    });
  });

  describe("aniListMediaToNormalizedEpisodes", () => {
    it("generates episodes utilizing streamingEpisodes metadata when available", () => {
      const mediaWithStreams: AniListMedia = {
        id: 16498,
        title: { english: "Attack on Titan" },
        format: "TV",
        episodes: 3,
        duration: 24,
        genres: ["Action", "Fantasy"],
        streamingEpisodes: [
          {
            title: "Episode 1 - To You, in 2000 Years",
            thumbnail: "https://thumb1.jpg",
            url: "https://crunchyroll.com/ep1",
          },
          {
            title: "Episode 2 - That Day",
            thumbnail: "https://thumb2.jpg",
            url: "https://crunchyroll.com/ep2",
          },
        ],
      };

      const episodes = aniListMediaToNormalizedEpisodes(mediaWithStreams);

      expect(episodes).toHaveLength(3);

      expect(episodes[0].episodeNumber).toBe(1);
      expect(episodes[0].name).toBe("Episode 1 - To You, in 2000 Years");
      expect(episodes[0].stillUrl).toBe("https://thumb1.jpg");
      expect(episodes[0].externalId).toBe("https://crunchyroll.com/ep1");
      expect(episodes[0].runtime).toBe(24);

      expect(episodes[1].episodeNumber).toBe(2);
      expect(episodes[1].name).toBe("Episode 2 - That Day");
      expect(episodes[1].stillUrl).toBe("https://thumb2.jpg");

      // Episode 3 falls back gracefully
      expect(episodes[2].episodeNumber).toBe(3);
      expect(episodes[2].name).toBe("Episode 3");
      expect(episodes[2].stillUrl).toBeNull();
      expect(episodes[2].externalId).toBe("16498-ep-3");
    });
  });

  describe("aniListMediaToNormalizedSeasons", () => {
    it("returns empty array for movies", () => {
      const movieMedia: AniListMedia = {
        id: 99,
        title: { english: "Spirited Away" },
        format: "MOVIE",
        episodes: 1,
        genres: ["Animation", "Fantasy"],
      };
      expect(aniListMediaToNormalizedSeasons(movieMedia)).toEqual([]);
    });

    it("returns Season 1 with episodes for TV series", () => {
      const tvMedia: AniListMedia = {
        id: 154587,
        title: { english: "Frieren" },
        description: "An elf journeys on.",
        format: "TV",
        episodes: 28,
        duration: 24,
        genres: ["Adventure", "Fantasy"],
      };

      const seasons = aniListMediaToNormalizedSeasons(tvMedia);
      expect(seasons).toHaveLength(1);
      expect(seasons[0].seasonNumber).toBe(1);
      expect(seasons[0].name).toBe("Season 1");
      expect(seasons[0].episodeCount).toBe(28);
      expect(seasons[0].episodes).toHaveLength(28);
      expect(seasons[0].episodes?.[27].episodeNumber).toBe(28);
    });
  });
});
