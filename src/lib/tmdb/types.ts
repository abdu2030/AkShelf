import { z } from "zod";

export type TmdbImageSize = "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "original";

/**
 * Helper to construct an absolute TMDB image URL.
 */
export function getTmdbImageUrl(
  path: string | null | undefined,
  size: TmdbImageSize = "w500",
): string | null {
  if (!path) return null;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `https://image.tmdb.org/t/p/${size}${cleanPath}`;
}

export const TmdbGenreSchema = z.object({
  id: z.number(),
  name: z.string(),
});
export type TmdbGenre = z.infer<typeof TmdbGenreSchema>;

export const TmdbCastMemberSchema = z.object({
  id: z.number(),
  name: z.string(),
  character: z.string().default(""),
  profile_path: z.string().nullable().optional(),
  order: z.number().default(0),
});
export type TmdbCastMember = z.infer<typeof TmdbCastMemberSchema>;

export const TmdbCrewMemberSchema = z.object({
  id: z.number(),
  name: z.string(),
  job: z.string().default(""),
  department: z.string().default(""),
  profile_path: z.string().nullable().optional(),
});
export type TmdbCrewMember = z.infer<typeof TmdbCrewMemberSchema>;

export const TmdbVideoSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  site: z.string(),
  type: z.string(),
});
export type TmdbVideo = z.infer<typeof TmdbVideoSchema>;

export const TmdbMovieSearchResultSchema = z.object({
  id: z.number(),
  title: z.string(),
  original_title: z.string().optional(),
  overview: z.string().default(""),
  poster_path: z.string().nullable().optional(),
  backdrop_path: z.string().nullable().optional(),
  release_date: z.string().optional().default(""),
  genre_ids: z.array(z.number()).default([]),
  vote_average: z.number().default(0),
  vote_count: z.number().default(0),
  popularity: z.number().default(0),
});
export type TmdbMovieSearchResult = z.infer<typeof TmdbMovieSearchResultSchema>;

export const TmdbTvSearchResultSchema = z.object({
  id: z.number(),
  name: z.string(),
  original_name: z.string().optional(),
  overview: z.string().default(""),
  poster_path: z.string().nullable().optional(),
  backdrop_path: z.string().nullable().optional(),
  first_air_date: z.string().optional().default(""),
  genre_ids: z.array(z.number()).default([]),
  vote_average: z.number().default(0),
  vote_count: z.number().default(0),
  popularity: z.number().default(0),
});
export type TmdbTvSearchResult = z.infer<typeof TmdbTvSearchResultSchema>;

export const TmdbSeasonSummarySchema = z.object({
  id: z.number(),
  name: z.string().default(""),
  season_number: z.number(),
  episode_count: z.number().default(0),
  air_date: z.string().nullable().optional(),
  poster_path: z.string().nullable().optional(),
  overview: z.string().nullable().optional(),
});
export type TmdbSeasonSummary = z.infer<typeof TmdbSeasonSummarySchema>;

export const TmdbEpisodeSchema = z.object({
  id: z.number(),
  episode_number: z.number(),
  season_number: z.number(),
  name: z.string().default(""),
  overview: z.string().optional().default(""),
  air_date: z.string().nullable().optional(),
  still_path: z.string().nullable().optional(),
  runtime: z.number().nullable().optional(),
  vote_average: z.number().optional().default(0),
});
export type TmdbEpisode = z.infer<typeof TmdbEpisodeSchema>;

export const TmdbSeasonDetailsSchema = z.object({
  id: z.number(),
  name: z.string().default(""),
  season_number: z.number(),
  overview: z.string().default(""),
  poster_path: z.string().nullable().optional(),
  air_date: z.string().nullable().optional(),
  episodes: z.array(TmdbEpisodeSchema).default([]),
});
export type TmdbSeasonDetails = z.infer<typeof TmdbSeasonDetailsSchema>;

export const TmdbMovieDetailsSchema = z.object({
  id: z.number(),
  title: z.string(),
  original_title: z.string().optional(),
  overview: z.string().default(""),
  poster_path: z.string().nullable().optional(),
  backdrop_path: z.string().nullable().optional(),
  release_date: z.string().default(""),
  runtime: z.number().nullable().optional(),
  genres: z.array(TmdbGenreSchema).default([]),
  vote_average: z.number().default(0),
  vote_count: z.number().default(0),
  popularity: z.number().optional().default(0),
  status: z.string().default("Released"),
  tagline: z.string().nullable().optional(),
  credits: z
    .object({
      cast: z.array(TmdbCastMemberSchema).default([]),
      crew: z.array(TmdbCrewMemberSchema).default([]),
    })
    .optional(),
  videos: z
    .object({
      results: z.array(TmdbVideoSchema).default([]),
    })
    .optional(),
});
export type TmdbMovieDetails = z.infer<typeof TmdbMovieDetailsSchema>;

export const TmdbTvDetailsSchema = z.object({
  id: z.number(),
  name: z.string(),
  original_name: z.string().optional(),
  overview: z.string().default(""),
  poster_path: z.string().nullable().optional(),
  backdrop_path: z.string().nullable().optional(),
  first_air_date: z.string().default(""),
  last_air_date: z.string().nullable().optional(),
  number_of_seasons: z.number().default(0),
  number_of_episodes: z.number().default(0),
  episode_run_time: z.array(z.number()).default([]),
  genres: z.array(TmdbGenreSchema).default([]),
  seasons: z.array(TmdbSeasonSummarySchema).default([]),
  vote_average: z.number().default(0),
  vote_count: z.number().default(0),
  popularity: z.number().optional().default(0),
  status: z.string().default("Returning Series"),
  tagline: z.string().nullable().optional(),
  credits: z
    .object({
      cast: z.array(TmdbCastMemberSchema).default([]),
      crew: z.array(TmdbCrewMemberSchema).default([]),
    })
    .optional(),
  videos: z
    .object({
      results: z.array(TmdbVideoSchema).default([]),
    })
    .optional(),
});
export type TmdbTvDetails = z.infer<typeof TmdbTvDetailsSchema>;
