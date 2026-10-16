import { describe, expect, it } from "vitest";
import {
  extractYear,
  resolveTmdbGenres,
  tmdbMovieToMediaResult,
  tmdbSeasonToNormalizedSeason,
  tmdbTvToMediaResult,
} from "./tmdb";
import {
  aniListMediaToMediaResult,
  aniListMediaToNormalizedEpisodes,
  aniListMediaToNormalizedSeasons,
  cleanAniListDescription,
  formatAniListStatus,
  formatFuzzyDate,
} from "./anilist";
import {
  TmdbMovieDetails,
  TmdbMovieSearchResult,
  TmdbSeasonDetails,
  TmdbTvDetails,
  TmdbTvSearchResult,
} from "@/lib/tmdb";
import { AniListMedia } from "@/lib/anilist";
import { MediaResultSchema } from "../types";

describe("Provider Normalization Baseline Suite (Day 43)", () => {
  describe("TMDB Movie Normalization", () => {
    const fullMovieFixture: TmdbMovieDetails = {
      id: 550,
      title: "Fight Club",
      original_title: "Fight Club",
      overview:
        "An insomniac office worker and a devil-may-care soap maker form an underground fight club.",
      poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      backdrop_path: "/hZkgoQYus5vegHoetLkCJzb17zJ.jpg",
      release_date: "1999-10-15",
      runtime: 139,
      vote_average: 8.433,
      vote_count: 27500,
      popularity: 61.416,
      status: "Released",
      genres: [
        { id: 18, name: "Drama" },
        { id: 53, name: "Thriller" },
      ],
      credits: {
        crew: [
          { id: 7467, name: "David Fincher", job: "Director", department: "Directing" },
          { id: 1234, name: "Art Linson", job: "Producer", department: "Production" },
        ],
        cast: [
          {
            id: 819,
            name: "Edward Norton",
            character: "The Narrator",
            order: 0,
            profile_path: "/5XBzD5WuTyikZeekjqvrwm0gUBi.jpg",
          },
          {
            id: 287,
            name: "Brad Pitt",
            character: "Tyler Durden",
            order: 1,
            profile_path: "/cckcYc2v0yh1tc9Qgr1LBoURNum.jpg",
          },
        ],
      },
    };

    it("normalizes complete movie details and satisfies MediaResultSchema", () => {
      const normalized = tmdbMovieToMediaResult(fullMovieFixture);
      const parseResult = MediaResultSchema.safeParse(normalized);

      expect(parseResult.success).toBe(true);
      expect(normalized.id).toBe("tmdb:550");
      expect(normalized.externalSource).toBe("tmdb");
      expect(normalized.externalId).toBe("550");
      expect(normalized.type).toBe("MOVIE");
      expect(normalized.title).toBe("Fight Club");
      expect(normalized.year).toBe(1999);
      expect(normalized.releaseDate).toBe("1999-10-15");
      expect(normalized.runtime).toBe(139);
      expect(normalized.director).toBe("David Fincher");
      expect(normalized.genres).toEqual(["Drama", "Thriller"]);
      expect(normalized.posterUrl).toContain("/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg");
      expect(normalized.backdropUrl).toContain("/hZkgoQYus5vegHoetLkCJzb17zJ.jpg");
      expect(normalized.cast).toHaveLength(2);
      expect(normalized.cast?.[0].name).toBe("Edward Norton");
    });

    it("handles minimal search results with null posters and invalid dates", () => {
      const minimalMovie: TmdbMovieSearchResult = {
        id: 9999,
        title: "Obscure Indie Movie",
        original_title: "Obscure Indie Movie",
        overview: "",
        poster_path: null,
        backdrop_path: null,
        release_date: "invalid-date",
        vote_average: 0,
        vote_count: 0,
        popularity: 1.0,
        genre_ids: [99999], // unknown genre ID
      };

      const normalized = tmdbMovieToMediaResult(minimalMovie);
      const parseResult = MediaResultSchema.safeParse(normalized);

      expect(parseResult.success).toBe(true);
      expect(normalized.id).toBe("tmdb:9999");
      expect(normalized.posterUrl).toBeNull();
      expect(normalized.backdropUrl).toBeNull();
      expect(normalized.year).toBeNull();
      expect(normalized.releaseDate).toBe("invalid-date");
      expect(normalized.director).toBeNull();
      expect(normalized.genres).toEqual([]);
    });
  });

  describe("TMDB TV Series & Season Normalization", () => {
    const tvFixture: TmdbTvDetails = {
      id: 1399,
      name: "Game of Thrones",
      original_name: "Game of Thrones",
      overview: "Seven noble families fight for control of the mythical land of Westeros.",
      poster_path: "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
      backdrop_path: "/suopoADq0k8YZr4dQXcU6p0drfH.jpg",
      first_air_date: "2011-04-17",
      episode_run_time: [55, 60],
      number_of_seasons: 8,
      number_of_episodes: 73,
      status: "Ended",
      vote_average: 8.45,
      vote_count: 22000,
      popularity: 369.594,
      genres: [
        { id: 10765, name: "Sci-Fi & Fantasy" },
        { id: 18, name: "Drama" },
      ],
      seasons: [
        {
          id: 3624,
          season_number: 0,
          name: "Specials",
          episode_count: 14,
          poster_path: null,
        },
        {
          id: 3625,
          season_number: 1,
          name: "Season 1",
          episode_count: 10,
          poster_path: "/path1.jpg",
        },
      ],
      credits: {
        crew: [],
        cast: [
          {
            id: 1229,
            name: "Peter Dinklage",
            character: "Tyrion Lannister",
            order: 0,
            profile_path: "/profile.jpg",
          },
        ],
      },
    };

    it("normalizes TV details, extracts runtime and preserves seasons (filtering specials)", () => {
      const normalized = tmdbTvToMediaResult(tvFixture);
      const parseResult = MediaResultSchema.safeParse(normalized);

      expect(parseResult.success).toBe(true);
      expect(normalized.id).toBe("tmdb:1399");
      expect(normalized.type).toBe("TV");
      expect(normalized.runtime).toBeNull();
      expect(normalized.totalEpisodes).toBe(73);
      expect(normalized.status).toBe("Ended");
      expect(normalized.seasons).toHaveLength(1);
      expect(normalized.seasons?.[0].seasonNumber).toBe(1);
    });

    it("normalizes TMDB Season details and episodes list", () => {
      const seasonDetailsFixture: TmdbSeasonDetails = {
        id: 3625,
        season_number: 1,
        name: "Season 1",
        overview: "Trouble is brewing in the Seven Kingdoms.",
        poster_path: "/season1.jpg",
        episodes: [
          {
            id: 63056,
            episode_number: 1,
            season_number: 1,
            name: "Winter Is Coming",
            overview: "Ned Stark is torn between his family and an old friend.",
            air_date: "2011-04-17",
            runtime: 62,
            still_path: "/still1.jpg",
            vote_average: 9.1,
          },
          {
            id: 63057,
            episode_number: 2,
            season_number: 1,
            name: "The Kingsroad",
            overview: "The Lannisters plot to ensure Bran's silence.",
            air_date: "2011-04-24",
            runtime: 56,
            still_path: null,
            vote_average: 8.8,
          },
        ],
      };

      const normalizedSeason = tmdbSeasonToNormalizedSeason(seasonDetailsFixture);

      expect(normalizedSeason.seasonNumber).toBe(1);
      expect(normalizedSeason.name).toBe("Season 1");
      expect(normalizedSeason.episodeCount).toBe(2);
      expect(normalizedSeason.episodes).toHaveLength(2);
      expect(normalizedSeason.episodes).toBeDefined();
      expect(normalizedSeason.episodes![0]).toMatchObject({
        episodeNumber: 1,
        name: "Winter Is Coming",
        airDate: "2011-04-17",
        runtime: 62,
      });
      expect(normalizedSeason.episodes![1]).toMatchObject({
        episodeNumber: 2,
        name: "The Kingsroad",
        airDate: "2011-04-24",
        runtime: 56,
      });
    });

    it("normalizes minimal TV search results cleanly", () => {
      const minimalTv: TmdbTvSearchResult = {
        id: 8888,
        name: "Mystery Show",
        original_name: "Mystery Show",
        overview: "A show about mystery.",
        poster_path: null,
        backdrop_path: null,
        first_air_date: "2020-01-01",
        vote_average: 7.2,
        vote_count: 100,
        popularity: 2.5,
        genre_ids: [18],
      };

      const normalized = tmdbTvToMediaResult(minimalTv);
      const parseResult = MediaResultSchema.safeParse(normalized);

      expect(parseResult.success).toBe(true);
      expect(normalized.id).toBe("tmdb:8888");
      expect(normalized.title).toBe("Mystery Show");
      expect(normalized.year).toBe(2020);
      expect(normalized.genres).toEqual(["Drama"]);
      expect(normalized.seasons).toBeUndefined();
    });

    it("verifies extractYear and resolveTmdbGenres utility helpers", () => {
      expect(extractYear("2024-05-12")).toBe(2024);
      expect(extractYear("not-a-date")).toBeNull();
      expect(extractYear(null)).toBeNull();
      expect(extractYear(undefined)).toBeNull();

      expect(resolveTmdbGenres([28, 12, 99999])).toEqual(["Action", "Adventure"]);
      expect(resolveTmdbGenres([])).toEqual([]);
      expect(resolveTmdbGenres(undefined)).toEqual([]);
    });
  });

  describe("AniList Media (Anime) Normalization", () => {
    const animeFixture: AniListMedia = {
      id: 16498,
      title: {
        english: "Attack on Titan",
        romaji: "Shingeki no Kyojin",
        native: "進撃の巨人",
      },
      format: "TV",
      status: "FINISHED",
      description:
        "<p>Centuries ago, mankind was hunted by <b>Titans</b>.<br><br>Now humanity lives in peace.</p>",
      startDate: { year: 2013, month: 4, day: 7 },
      episodes: 25,
      duration: 24,
      coverImage: {
        extraLarge: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498.jpg",
        large: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx16498.jpg",
      },
      bannerImage: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498.jpg",
      genres: ["Action", "Drama", "Fantasy"],
      averageScore: 85,
      studios: {
        nodes: [
          { id: 858, name: "WIT STUDIO", isAnimationStudio: true },
          { id: 999, name: "Production I.G", isAnimationStudio: false },
        ],
      },
    };

    it("normalizes complete anime media into unified MediaResult", () => {
      const normalized = aniListMediaToMediaResult(animeFixture);
      const parseResult = MediaResultSchema.safeParse(normalized);

      expect(parseResult.success).toBe(true);
      expect(normalized.id).toBe("anilist:16498");
      expect(normalized.externalSource).toBe("anilist");
      expect(normalized.externalId).toBe("16498");
      expect(normalized.type).toBe("ANIME");
      expect(normalized.title).toBe("Attack on Titan");
      expect(normalized.originalTitle).toBe("Shingeki no Kyojin");
      expect(normalized.year).toBe(2013);
      expect(normalized.releaseDate).toBe("2013-04-07");
      expect(normalized.runtime).toBe(24);
      expect(normalized.totalEpisodes).toBe(25);
      expect(normalized.status).toBe("Finished");
      expect(normalized.genres).toEqual(["Action", "Drama", "Fantasy"]);
      expect(normalized.studios).toEqual(["WIT STUDIO"]);
      // HTML cleaned
      expect(normalized.overview).toBe(
        "Centuries ago, mankind was hunted by Titans.\n\nNow humanity lives in peace.",
      );
    });

    it("generates synthetic seasons and episodes for anime", () => {
      const seasons = aniListMediaToNormalizedSeasons(animeFixture);
      expect(seasons).toHaveLength(1);
      expect(seasons[0]).toMatchObject({
        seasonNumber: 1,
        name: "Season 1",
        episodeCount: 25,
      });

      const episodes = aniListMediaToNormalizedEpisodes(animeFixture);
      expect(episodes).toHaveLength(25);
      expect(episodes[0]).toMatchObject({
        episodeNumber: 1,
        name: "Episode 1",
        runtime: 24,
      });
      expect(episodes[24]).toMatchObject({
        episodeNumber: 25,
        name: "Episode 25",
        runtime: 24,
      });
    });

    it("cleans diverse HTML tags and entities cleanly", () => {
      const htmlWithEntities = "It&#039;s an &quot;epic&quot; anime &amp; story.";
      expect(cleanAniListDescription(htmlWithEntities)).toBe('It\'s an "epic" anime & story.');

      expect(cleanAniListDescription(null)).toBeNull();
      expect(cleanAniListDescription("")).toBeNull();
    });

    it("formats fuzzy dates accurately across all partial permutations", () => {
      expect(formatFuzzyDate({ year: 2024, month: 10, day: 16 })).toBe("2024-10-16");
      expect(formatFuzzyDate({ year: 2024, month: 10, day: null })).toBe("2024-10");
      expect(formatFuzzyDate({ year: 2024, month: null, day: null })).toBe("2024");
      expect(formatFuzzyDate({ year: null, month: 10, day: 16 })).toBeNull();
      expect(formatFuzzyDate(null)).toBeNull();
    });

    it("formats status strings from uppercase to readable title case", () => {
      expect(formatAniListStatus("FINISHED")).toBe("Finished");
      expect(formatAniListStatus("RELEASING")).toBe("Releasing");
      expect(formatAniListStatus("NOT_YET_RELEASED")).toBe("Not Yet Released");
      expect(formatAniListStatus("CANCELLED")).toBe("Cancelled");
      expect(formatAniListStatus("HIATUS")).toBe("On Hiatus");
    });
  });
});
