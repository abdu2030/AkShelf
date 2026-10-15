import { describe, expect, it } from "vitest";
import {
  extractYear,
  resolveTmdbGenres,
  tmdbMovieToMediaResult,
  tmdbSeasonToNormalizedSeason,
  tmdbTvToMediaResult,
} from "./tmdb";
import {
  TmdbMovieDetails,
  TmdbMovieSearchResult,
  TmdbSeasonDetails,
  TmdbTvDetails,
  TmdbTvSearchResult,
} from "@/lib/tmdb";
import { MediaResultSchema } from "../types";

describe("TMDB Metadata Translators", () => {
  describe("extractYear", () => {
    it("extracts 4-digit year from valid date strings", () => {
      expect(extractYear("2010-07-16")).toBe(2010);
      expect(extractYear("1994-09-23")).toBe(1994);
      expect(extractYear("2024")).toBe(2024);
    });

    it("returns null for empty or invalid strings", () => {
      expect(extractYear("")).toBeNull();
      expect(extractYear(null)).toBeNull();
      expect(extractYear(undefined)).toBeNull();
      expect(extractYear("invalid-date")).toBeNull();
    });
  });

  describe("resolveTmdbGenres", () => {
    it("uses explicit genres array if provided", () => {
      const explicit = [
        { id: 28, name: "Action" },
        { id: 878, name: "Sci-Fi" },
      ];
      expect(resolveTmdbGenres([999], explicit)).toEqual(["Action", "Sci-Fi"]);
    });

    it("resolves movie genre IDs correctly", () => {
      expect(resolveTmdbGenres([28, 878, 12])).toEqual(["Action", "Science Fiction", "Adventure"]);
    });

    it("resolves TV genre IDs correctly", () => {
      expect(resolveTmdbGenres([10759, 18, 9648], undefined, true)).toEqual([
        "Action & Adventure",
        "Drama",
        "Mystery",
      ]);
    });

    it("returns empty array for empty inputs", () => {
      expect(resolveTmdbGenres([])).toEqual([]);
      expect(resolveTmdbGenres(undefined)).toEqual([]);
    });
  });

  describe("tmdbMovieToMediaResult", () => {
    it("normalizes a TMDB movie search result into MediaResult", () => {
      const searchItem: TmdbMovieSearchResult = {
        id: 27205,
        title: "Inception",
        original_title: "Inception",
        overview: "A thief enters the dreams of others.",
        release_date: "2010-07-15",
        poster_path: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
        backdrop_path: "/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
        vote_average: 8.36,
        vote_count: 36000,
        popularity: 85.2,
        genre_ids: [28, 878, 12],
      };

      const result = tmdbMovieToMediaResult(searchItem);

      expect(result.id).toBe("tmdb:27205");
      expect(result.externalSource).toBe("tmdb");
      expect(result.externalId).toBe("27205");
      expect(result.type).toBe("MOVIE");
      expect(result.title).toBe("Inception");
      expect(result.year).toBe(2010);
      expect(result.releaseDate).toBe("2010-07-15");
      expect(result.posterUrl).toBe(
        "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
      );
      expect(result.backdropUrl).toBe(
        "https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
      );
      expect(result.genres).toEqual(["Action", "Science Fiction", "Adventure"]);
      expect(result.voteAverage).toBe(8.4);
      expect(result.totalEpisodes).toBe(1);

      // Validate against Zod schema
      expect(() => MediaResultSchema.parse(result)).not.toThrow();
    });

    it("normalizes full TMDB movie details with credits and trailer", () => {
      const details: TmdbMovieDetails = {
        id: 27205,
        title: "Inception",
        original_title: "Inception",
        overview: "A thief who steals corporate secrets.",
        release_date: "2010-07-15",
        runtime: 148,
        status: "Released",
        genres: [
          { id: 28, name: "Action" },
          { id: 878, name: "Science Fiction" },
        ],
        poster_path: "/poster.jpg",
        backdrop_path: "/backdrop.jpg",
        vote_average: 8.4,
        vote_count: 36000,
        popularity: 90.0,
        credits: {
          cast: [
            { id: 6193, name: "Leonardo DiCaprio", character: "Dom Cobb", order: 0 },
            { id: 27578, name: "Joseph Gordon-Levitt", character: "Arthur", order: 1 },
          ],
          crew: [{ id: 525, name: "Christopher Nolan", job: "Director", department: "Directing" }],
        },
        videos: {
          results: [
            { id: "1", key: "YoHD9XEInc0", name: "Trailer", site: "YouTube", type: "Trailer" },
          ],
        },
      };

      const result = tmdbMovieToMediaResult(details);

      expect(result.runtime).toBe(148);
      expect(result.status).toBe("Released");
      expect(result.director).toBe("Christopher Nolan");
      expect(result.cast).toHaveLength(2);
      expect(result.cast?.[0].character).toBe("Dom Cobb");
      expect(result.trailerUrl).toBe("https://www.youtube.com/watch?v=YoHD9XEInc0");

      expect(() => MediaResultSchema.parse(result)).not.toThrow();
    });
  });

  describe("tmdbTvToMediaResult", () => {
    it("normalizes TMDB TV search results", () => {
      const tvSearch: TmdbTvSearchResult = {
        id: 1396,
        name: "Breaking Bad",
        original_name: "Breaking Bad",
        overview: "A chemistry teacher turned manufacturer.",
        first_air_date: "2008-01-20",
        poster_path: "/bb.jpg",
        backdrop_path: "/bb-back.jpg",
        vote_average: 8.9,
        vote_count: 14000,
        popularity: 110.5,
        genre_ids: [18, 80],
      };

      const result = tmdbTvToMediaResult(tvSearch);

      expect(result.id).toBe("tmdb:1396");
      expect(result.type).toBe("TV");
      expect(result.title).toBe("Breaking Bad");
      expect(result.year).toBe(2008);
      expect(result.genres).toEqual(["Drama", "Crime"]);

      expect(() => MediaResultSchema.parse(result)).not.toThrow();
    });

    it("normalizes detailed TMDB TV payload with season breakdown", () => {
      const tvDetails: TmdbTvDetails = {
        id: 1396,
        name: "Breaking Bad",
        original_name: "Breaking Bad",
        overview: "A chemistry teacher turned manufacturer.",
        first_air_date: "2008-01-20",
        poster_path: "/bb.jpg",
        backdrop_path: "/bb-back.jpg",
        number_of_episodes: 62,
        number_of_seasons: 5,
        episode_run_time: [47],
        status: "Ended",
        vote_average: 8.9,
        vote_count: 14000,
        popularity: 110.5,
        genres: [{ id: 18, name: "Drama" }],
        seasons: [
          { id: 100, season_number: 0, name: "Specials", episode_count: 3 }, // season 0 specials
          { id: 101, season_number: 1, name: "Season 1", episode_count: 7, air_date: "2008-01-20" },
          {
            id: 102,
            season_number: 2,
            name: "Season 2",
            episode_count: 13,
            air_date: "2009-03-08",
          },
        ],
      };

      const result = tmdbTvToMediaResult(tvDetails);

      expect(result.totalEpisodes).toBe(62);
      expect(result.totalSeasons).toBe(5);
      // Specials (season 0) are filtered out from default season list
      expect(result.seasons).toHaveLength(2);
      expect(result.seasons?.[0].seasonNumber).toBe(1);
      expect(result.seasons?.[0].episodeCount).toBe(7);

      expect(() => MediaResultSchema.parse(result)).not.toThrow();
    });
  });

  describe("tmdbSeasonToNormalizedSeason", () => {
    it("maps season and episodes cleanly with externalId and sorted episodes", () => {
      const seasonData: TmdbSeasonDetails = {
        id: 3572,
        season_number: 1,
        name: "Season 1",
        overview: "Walter White enters the business.",
        poster_path: "/s1.jpg",
        air_date: "2008-01-20",
        episodes: [
          {
            id: 62086,
            episode_number: 2,
            season_number: 1,
            name: "Cat's in the Bag...",
            overview: "Walt and Jesse clean up.",
            air_date: "2008-01-27",
            runtime: 48,
            vote_average: 8.3,
          },
          {
            id: 62085,
            episode_number: 1,
            season_number: 1,
            name: "Pilot",
            overview: "Walt gets diagnosed.",
            still_path: "/still1.jpg",
            air_date: "2008-01-20",
            runtime: 58,
            vote_average: 8.5,
          },
        ],
      };

      const normalized = tmdbSeasonToNormalizedSeason(seasonData);

      expect(normalized.seasonNumber).toBe(1);
      expect(normalized.episodeCount).toBe(2);
      expect(normalized.episodes).toHaveLength(2);

      // Verify sorted in ascending order
      expect(normalized.episodes?.[0].episodeNumber).toBe(1);
      expect(normalized.episodes?.[0].externalId).toBe("62085");
      expect(normalized.episodes?.[0].name).toBe("Pilot");
      expect(normalized.episodes?.[0].runtime).toBe(58);
      expect(normalized.episodes?.[0].stillUrl).toBe("https://image.tmdb.org/t/p/w342/still1.jpg");

      expect(normalized.episodes?.[1].episodeNumber).toBe(2);
      expect(normalized.episodes?.[1].externalId).toBe("62086");
      expect(normalized.episodes?.[1].name).toBe("Cat's in the Bag...");
    });
  });
});
