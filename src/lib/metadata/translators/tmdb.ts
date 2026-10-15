import {
  TmdbEpisode,
  TmdbMovieDetails,
  TmdbMovieSearchResult,
  TmdbSeasonDetails,
  TmdbTvDetails,
  TmdbTvSearchResult,
  getTmdbImageUrl,
} from "@/lib/tmdb";
import { CastMember, MediaResult, NormalizedEpisode, NormalizedSeason } from "../types";

// TMDB Standard Genre ID lookup mappings
const TMDB_MOVIE_GENRES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const TMDB_TV_GENRES: Record<number, string> = {
  10759: "Action & Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  10762: "Kids",
  9648: "Mystery",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
  37: "Western",
};

/**
 * Extracts 4-digit release year from ISO date strings (e.g. "2010-07-15" -> 2010).
 */
export function extractYear(dateString?: string | null): number | null {
  if (!dateString) return null;
  const match = dateString.match(/^(\d{4})/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Resolves TMDB genre IDs to human-readable names.
 */
export function resolveTmdbGenres(
  genreIds?: number[],
  explicitGenres?: Array<{ id: number; name: string }>,
  isTv = false,
): string[] {
  if (explicitGenres && explicitGenres.length > 0) {
    return explicitGenres.map((g) => g.name);
  }
  if (!genreIds || genreIds.length === 0) {
    return [];
  }
  const table = isTv ? TMDB_TV_GENRES : TMDB_MOVIE_GENRES;
  return genreIds
    .map((id) => table[id] || (isTv ? TMDB_MOVIE_GENRES[id] : TMDB_TV_GENRES[id]))
    .filter(Boolean);
}

/**
 * Finds a YouTube trailer link from TMDB video results.
 */
function extractYouTubeTrailer(videos?: {
  results: Array<{ site: string; type: string; key: string }>;
}): string | null {
  if (!videos || !videos.results) return null;
  const officialTrailer = videos.results.find((v) => v.site === "YouTube" && v.type === "Trailer");
  if (officialTrailer) {
    return `https://www.youtube.com/watch?v=${officialTrailer.key}`;
  }
  const teaser = videos.results.find((v) => v.site === "YouTube" && v.type === "Teaser");
  if (teaser) {
    return `https://www.youtube.com/watch?v=${teaser.key}`;
  }
  return null;
}

/**
 * Maps TMDB movie payload (search item or detailed response) to unified MediaResult.
 */
export function tmdbMovieToMediaResult(
  movie: TmdbMovieDetails | TmdbMovieSearchResult,
): MediaResult {
  const isDetails = "status" in movie || "runtime" in movie;
  const details = isDetails ? (movie as TmdbMovieDetails) : null;

  const genres = resolveTmdbGenres(
    "genre_ids" in movie ? movie.genre_ids : undefined,
    details?.genres,
    false,
  );

  let cast: CastMember[] | undefined = undefined;
  let director: string | null = null;

  if (details?.credits) {
    if (details.credits.cast) {
      cast = details.credits.cast.slice(0, 10).map((c) => ({
        id: c.id,
        name: c.name,
        character: c.character ?? null,
        image: getTmdbImageUrl(c.profile_path, "w185"),
        order: c.order,
      }));
    }
    if (details.credits.crew) {
      const directorEntry = details.credits.crew.find((member) => member.job === "Director");
      if (directorEntry) {
        director = directorEntry.name;
      }
    }
  }

  const trailerUrl = details?.videos ? extractYouTubeTrailer(details.videos) : null;

  return {
    id: `tmdb:${movie.id}`,
    externalSource: "tmdb",
    externalId: String(movie.id),
    type: "MOVIE",
    title: movie.title,
    originalTitle: ("original_title" in movie ? movie.original_title : null) || null,
    overview: movie.overview || null,
    year: extractYear(movie.release_date),
    releaseDate: movie.release_date || null,
    posterUrl: getTmdbImageUrl(movie.poster_path, "w500"),
    backdropUrl: getTmdbImageUrl(movie.backdrop_path, "original"),
    genres,
    runtime: details?.runtime ?? null,
    status: details?.status ?? null,
    voteAverage: movie.vote_average ? Math.round(movie.vote_average * 10) / 10 : null,
    voteCount: movie.vote_count ?? 0,
    popularity: ("popularity" in movie ? movie.popularity : null) ?? null,
    totalEpisodes: 1,
    totalSeasons: null,
    cast,
    director,
    trailerUrl,
  };
}

/**
 * Maps TMDB TV series payload (search item or detailed response) to unified MediaResult.
 */
export function tmdbTvToMediaResult(tv: TmdbTvDetails | TmdbTvSearchResult): MediaResult {
  const isDetails = "number_of_seasons" in tv;
  const details = isDetails ? (tv as TmdbTvDetails) : null;

  const genres = resolveTmdbGenres(
    "genre_ids" in tv ? tv.genre_ids : undefined,
    details?.genres,
    true,
  );

  let cast: CastMember[] | undefined = undefined;
  let director: string | null = null;

  if (details?.credits) {
    if (details.credits.cast) {
      cast = details.credits.cast.slice(0, 10).map((c) => ({
        id: c.id,
        name: c.name,
        character: c.character ?? null,
        image: getTmdbImageUrl(c.profile_path, "w185"),
        order: c.order,
      }));
    }
    if (details.credits.crew) {
      const creator = details.credits.crew.find(
        (m) => m.job === "Executive Producer" || m.job === "Director",
      );
      if (creator) {
        director = creator.name;
      }
    }
  }

  const trailerUrl = details?.videos ? extractYouTubeTrailer(details.videos) : null;

  const seasons: NormalizedSeason[] | undefined = details?.seasons
    ?.filter((s) => s.season_number > 0) // filter out specials (season 0) by default
    .map((s) => ({
      seasonNumber: s.season_number,
      name: s.name || `Season ${s.season_number}`,
      episodeCount: s.episode_count ?? 0,
      overview: s.overview || null,
      posterUrl: getTmdbImageUrl(s.poster_path, "w500"),
      airDate: s.air_date || null,
    }));

  return {
    id: `tmdb:${tv.id}`,
    externalSource: "tmdb",
    externalId: String(tv.id),
    type: "TV",
    title: tv.name,
    originalTitle: ("original_name" in tv ? tv.original_name : null) || null,
    overview: tv.overview || null,
    year: extractYear(tv.first_air_date),
    releaseDate: tv.first_air_date || null,
    posterUrl: getTmdbImageUrl(tv.poster_path, "w500"),
    backdropUrl: getTmdbImageUrl(tv.backdrop_path, "original"),
    genres,
    runtime: null,
    status: details?.status ?? null,
    voteAverage: tv.vote_average ? Math.round(tv.vote_average * 10) / 10 : null,
    voteCount: tv.vote_count ?? 0,
    popularity: ("popularity" in tv ? tv.popularity : null) ?? null,
    totalEpisodes: details?.number_of_episodes ?? null,
    totalSeasons: details?.number_of_seasons ?? (seasons ? seasons.length : null),
    cast,
    director,
    trailerUrl,
    seasons,
  };
}

/**
 * Maps TMDB single season payload to NormalizedSeason with episode list.
 */
export function tmdbSeasonToNormalizedSeason(season: TmdbSeasonDetails): NormalizedSeason {
  const episodes: NormalizedEpisode[] = (season.episodes || [])
    .map((ep) => tmdbEpisodeToNormalizedEpisode(ep))
    .sort((a, b) => a.episodeNumber - b.episodeNumber);

  return {
    seasonNumber: season.season_number,
    name: season.name?.trim() || `Season ${season.season_number}`,
    episodeCount: episodes.length,
    overview: season.overview?.trim() || null,
    posterUrl: getTmdbImageUrl(season.poster_path, "w500"),
    airDate: season.air_date || null,
    episodes,
  };
}

/**
 * Maps single TMDB episode to NormalizedEpisode with essential fields only.
 */
export function tmdbEpisodeToNormalizedEpisode(episode: TmdbEpisode): NormalizedEpisode {
  return {
    externalId: episode.id ? String(episode.id) : null,
    episodeNumber: episode.episode_number,
    seasonNumber: episode.season_number,
    name: episode.name?.trim() || `Episode ${episode.episode_number}`,
    airDate: episode.air_date || null,
    runtime: episode.runtime ?? null,
    overview: episode.overview?.trim() || null,
    stillUrl: getTmdbImageUrl(episode.still_path, "w342"),
  };
}
