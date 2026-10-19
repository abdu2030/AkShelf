import { beforeEach, describe, expect, it, vi } from "vitest";
import { MetadataService } from "./service";
import { MetadataCache } from "./cache";
import { TmdbClient } from "@/lib/tmdb";
import { AniListClient } from "@/lib/anilist";

describe("MetadataService", () => {
  let mockTmdb: TmdbClient;
  let mockAniList: AniListClient;
  let cache: MetadataCache;
  let service: MetadataService;

  beforeEach(() => {
    cache = new MetadataCache({ defaultTtlMs: 60000 });

    mockTmdb = {
      searchMovies: vi.fn(),
      searchTv: vi.fn(),
      getMovieDetails: vi.fn(),
      getTvDetails: vi.fn(),
      getTvSeason: vi.fn(),
      hasAuth: vi.fn().mockReturnValue(true),
    } as unknown as TmdbClient;

    mockAniList = {
      searchAnime: vi.fn(),
      getAnimeDetails: vi.fn(),
    } as unknown as AniListClient;

    service = new MetadataService({
      tmdbClient: mockTmdb,
      aniListClient: mockAniList,
      cache,
    });
  });

  describe("searchMovies", () => {
    it("searches TMDB movies and caches results", async () => {
      vi.mocked(mockTmdb.searchMovies).mockResolvedValue({
        page: 1,
        totalPages: 1,
        totalResults: 1,
        results: [
          {
            id: 27205,
            title: "Inception",
            original_title: "Inception",
            overview: "Dream espionage.",
            release_date: "2010-07-15",
            poster_path: "/inception.jpg",
            backdrop_path: "/back.jpg",
            vote_average: 8.4,
            vote_count: 36000,
            popularity: 85,
            genre_ids: [28],
          },
        ],
      });

      const firstCall = await service.searchMovies("Inception");
      expect(firstCall).toHaveLength(1);
      expect(firstCall[0].title).toBe("Inception");
      expect(firstCall[0].type).toBe("MOVIE");
      expect(mockTmdb.searchMovies).toHaveBeenCalledTimes(1);

      // Second call should come from cache
      const secondCall = await service.searchMovies("Inception");
      expect(secondCall).toHaveLength(1);
      expect(mockTmdb.searchMovies).toHaveBeenCalledTimes(1);
    });

    it("returns empty array without calling client for empty string", async () => {
      const res = await service.searchMovies("   ");
      expect(res).toEqual([]);
      expect(mockTmdb.searchMovies).not.toHaveBeenCalled();
    });
  });

  describe("searchAnime", () => {
    it("searches AniList anime and returns normalized MediaResult", async () => {
      vi.mocked(mockAniList.searchAnime).mockResolvedValue({
        pageInfo: { total: 1, currentPage: 1, lastPage: 1, hasNextPage: false, perPage: 10 },
        media: [
          {
            id: 16498,
            title: { english: "Attack on Titan", romaji: "Shingeki no Kyojin" },
            description: "Titans invade.",
            format: "TV",
            status: "FINISHED",
            episodes: 25,
            genres: ["Action"],
            averageScore: 85,
            popularity: 500000,
            startDate: { year: 2013 },
            coverImage: { large: "https://cover.jpg" },
          },
        ],
      });

      const results = await service.searchAnime("Attack on Titan");
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("Attack on Titan");
      expect(results[0].type).toBe("ANIME");
      expect(results[0].voteAverage).toBe(8.5);
    });
  });

  describe("search (unified multi-source)", () => {
    it("aggregates and ranks multi-source results by popularity", async () => {
      vi.mocked(mockTmdb.searchMovies).mockResolvedValue({
        page: 1,
        totalPages: 1,
        totalResults: 1,
        results: [
          {
            id: 1,
            title: "Low Pop Movie",
            overview: "A low pop movie",
            release_date: "2020-01-01",
            popularity: 10,
            vote_average: 7,
            vote_count: 100,
            genre_ids: [],
          },
        ],
      });

      vi.mocked(mockTmdb.searchTv).mockResolvedValue({
        page: 1,
        totalPages: 1,
        totalResults: 1,
        results: [
          {
            id: 2,
            name: "High Pop TV",
            overview: "A high pop tv show",
            first_air_date: "2021-01-01",
            popularity: 90,
            vote_average: 9,
            vote_count: 500,
            genre_ids: [],
          },
        ],
      });

      vi.mocked(mockAniList.searchAnime).mockResolvedValue({
        pageInfo: { total: 1, currentPage: 1, lastPage: 1, hasNextPage: false, perPage: 10 },
        media: [
          {
            id: 3,
            title: { english: "Mid Pop Anime" },
            popularity: 50,
            genres: ["Action"],
          },
        ],
      });

      const combined = await service.search("hero", { type: "ALL" });
      expect(combined).toHaveLength(3);
      // Ranked order: High Pop TV (90) -> Mid Pop Anime (50) -> Low Pop Movie (10)
      expect(combined[0].title).toBe("High Pop TV");
      expect(combined[1].title).toBe("Mid Pop Anime");
      expect(combined[2].title).toBe("Low Pop Movie");
    });

    it("survives gracefully if one provider throws an error", async () => {
      vi.mocked(mockTmdb.searchMovies).mockRejectedValue(new Error("TMDB Network down"));
      vi.mocked(mockTmdb.searchTv).mockRejectedValue(new Error("TMDB Network down"));
      vi.mocked(mockAniList.searchAnime).mockResolvedValue({
        pageInfo: { total: 1, currentPage: 1, lastPage: 1, hasNextPage: false, perPage: 10 },
        media: [
          { id: 55, title: { english: "Demon Slayer" }, popularity: 100, genres: ["Action"] },
        ],
      });

      const results = await service.search("Demon Slayer", { type: "ALL" });
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("Demon Slayer");
    });
  });

  describe("getTitleDetails & getTvSeason", () => {
    it("routes TMDB movie details appropriately and caches", async () => {
      vi.mocked(mockTmdb.getMovieDetails).mockResolvedValue({
        id: 27205,
        title: "Inception",
        overview: "Dream theft.",
        release_date: "2010-07-15",
        runtime: 148,
        status: "Released",
        genres: [{ id: 28, name: "Action" }],
        vote_average: 8.4,
        vote_count: 36000,
        popularity: 85,
      });

      const details = await service.getTitleDetails("tmdb", 27205, "MOVIE");
      expect(details.title).toBe("Inception");
      expect(details.runtime).toBe(148);
      expect(mockTmdb.getMovieDetails).toHaveBeenCalledWith(27205);

      // Subsequent call from cache
      await service.getTitleDetails("tmdb", 27205, "MOVIE");
      expect(mockTmdb.getMovieDetails).toHaveBeenCalledTimes(1);
    });

    it("routes AniList anime details appropriately", async () => {
      vi.mocked(mockAniList.getAnimeDetails).mockResolvedValue({
        id: 16498,
        title: { english: "Attack on Titan" },
        episodes: 25,
        format: "TV",
        genres: ["Action", "Fantasy"],
      });

      const details = await service.getTitleDetails("anilist", 16498);
      expect(details.title).toBe("Attack on Titan");
      expect(details.type).toBe("ANIME");
      expect(mockAniList.getAnimeDetails).toHaveBeenCalledWith(16498);
    });

    it("fetches and normalizes season episodes", async () => {
      vi.mocked(mockTmdb.getTvSeason).mockResolvedValue({
        id: 3572,
        season_number: 1,
        name: "Season 1",
        overview: "First season",
        episodes: [
          {
            id: 1,
            episode_number: 1,
            season_number: 1,
            name: "Pilot",
            overview: "Intro",
            vote_average: 8.5,
          },
        ],
      });

      const season = await service.getTvSeason(1396, 1);
      expect(season.seasonNumber).toBe(1);
      expect(season.episodes).toHaveLength(1);
      expect(season.episodes?.[0].name).toBe("Pilot");
    });

    it("fetches and caches anime season and episodes via getAnimeSeason", async () => {
      vi.mocked(mockAniList.getAnimeDetails).mockResolvedValue({
        id: 16498,
        title: { english: "Attack on Titan" },
        format: "TV",
        episodes: 25,
        duration: 24,
        genres: ["Action"],
      } as unknown as Awaited<ReturnType<typeof mockAniList.getAnimeDetails>>);

      const season = await service.getAnimeSeason(16498, 1);
      expect(season.seasonNumber).toBe(1);
      expect(season.episodeCount).toBe(25);
      expect(season.episodes).toHaveLength(25);
      expect(season.episodes?.[0].name).toBe("Episode 1");

      // Cached call
      await service.getAnimeSeason(16498, 1);
      expect(mockAniList.getAnimeDetails).toHaveBeenCalledTimes(1);
    });

    it("retrieves seasons for title via getTitleSeasons", async () => {
      vi.mocked(mockTmdb.getTvDetails).mockResolvedValue({
        id: 1396,
        name: "Breaking Bad",
        number_of_seasons: 1,
        number_of_episodes: 7,
        seasons: [
          {
            id: 1,
            season_number: 1,
            name: "Season 1",
            episode_count: 7,
          },
        ],
      } as unknown as Awaited<ReturnType<typeof mockTmdb.getTvDetails>>);

      const tvSeasons = await service.getTitleSeasons("tmdb", 1396, "TV");
      expect(tvSeasons).toHaveLength(1);
      expect(tvSeasons[0].name).toBe("Season 1");

      const movieSeasons = await service.getTitleSeasons("tmdb", 27205, "MOVIE");
      expect(movieSeasons).toEqual([]);
    });

    it("retrieves season episodes via unified getSeasonEpisodes", async () => {
      vi.mocked(mockTmdb.getTvSeason).mockResolvedValue({
        id: 3572,
        season_number: 1,
        name: "Season 1",
        episodes: [
          {
            id: 101,
            episode_number: 1,
            season_number: 1,
            name: "Pilot",
            overview: "",
            vote_average: 8.0,
          },
          {
            id: 102,
            episode_number: 2,
            season_number: 1,
            name: "Episode 2",
            overview: "",
            vote_average: 8.0,
          },
        ],
      } as unknown as Awaited<ReturnType<typeof mockTmdb.getTvSeason>>);

      const episodes = await service.getSeasonEpisodes("tmdb", 1396, 1);
      expect(episodes).toHaveLength(2);
      expect(episodes[0].name).toBe("Pilot");
      expect(episodes[1].name).toBe("Episode 2");
    });

    it("correctly disambiguates overlapping TMDB numeric IDs using mediaType parameter", async () => {
      vi.mocked(mockTmdb.getMovieDetails).mockResolvedValue({
        id: 5920,
        title: "Le Mans",
        original_title: "Le Mans",
        overview: "A race car driver competes in 24 Hours of Le Mans.",
        release_date: "1971-06-23",
        poster_path: "/lemans.jpg",
        backdrop_path: "/lemans_back.jpg",
        vote_average: 6.8,
        vote_count: 240,
        runtime: 106,
        status: "Released",
        genres: [{ id: 28, name: "Action" }],
      } as unknown as Awaited<ReturnType<typeof mockTmdb.getMovieDetails>>);

      vi.mocked(mockTmdb.getTvDetails).mockResolvedValue({
        id: 5920,
        name: "The Mentalist",
        original_name: "The Mentalist",
        overview: "Patrick Jane is an independent consultant for the CBI.",
        first_air_date: "2008-09-23",
        poster_path: "/mentalist.jpg",
        backdrop_path: "/mentalist_back.jpg",
        vote_average: 8.3,
        vote_count: 3600,
        status: "Ended",
        number_of_seasons: 7,
        number_of_episodes: 151,
        genres: [
          { id: 18, name: "Drama" },
          { id: 80, name: "Crime" },
        ],
        seasons: [
          {
            season_number: 1,
            name: "Season 1",
            episode_count: 23,
            overview: "",
            poster_path: "",
            air_date: "",
          },
          {
            season_number: 2,
            name: "Season 2",
            episode_count: 23,
            overview: "",
            poster_path: "",
            air_date: "",
          },
        ],
      } as unknown as Awaited<ReturnType<typeof mockTmdb.getTvDetails>>);

      // When type is TV, it MUST fetch TV details (The Mentalist), not the Movie (Le Mans)
      const tvResult = await service.getTitleDetails("tmdb", 5920, "TV");
      expect(tvResult.type).toBe("TV");
      expect(tvResult.title).toBe("The Mentalist");
      expect(tvResult.totalSeasons).toBe(7);
      expect(mockTmdb.getTvDetails).toHaveBeenCalledWith(5920);

      // When type is MOVIE, it MUST fetch Movie details (Le Mans)
      const movieResult = await service.getTitleDetails("tmdb", "5920", "MOVIE");
      expect(movieResult.type).toBe("MOVIE");
      expect(movieResult.title).toBe("Le Mans");
      expect(mockTmdb.getMovieDetails).toHaveBeenCalledWith(5920);
    });
  });
});
