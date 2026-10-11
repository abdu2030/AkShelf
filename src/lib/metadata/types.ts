import { z } from "zod";

/**
 * Standard media type categorization matching Prisma enum.
 */
export type MediaType = "MOVIE" | "TV" | "ANIME";

export const MediaTypeSchema = z.enum(["MOVIE", "TV", "ANIME"]);

/**
 * Supported external metadata provider keys.
 */
export type ExternalSource = "tmdb" | "anilist";

export const ExternalSourceSchema = z.enum(["tmdb", "anilist"]);

/**
 * Normalized cast member representation.
 */
export const CastMemberSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  character: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  order: z.number().optional(),
});

export type CastMember = z.infer<typeof CastMemberSchema>;

/**
 * Normalized crew member representation.
 */
export const CrewMemberSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  job: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
});

export type CrewMember = z.infer<typeof CrewMemberSchema>;

/**
 * Normalized episode metadata.
 */
export const NormalizedEpisodeSchema = z.object({
  episodeNumber: z.number().int().positive(),
  seasonNumber: z.number().int().nonnegative().optional(),
  name: z.string(),
  airDate: z.string().nullable().optional(),
  runtime: z.number().int().nonnegative().nullable().optional(),
  overview: z.string().nullable().optional(),
  stillUrl: z.string().nullable().optional(),
});

export type NormalizedEpisode = z.infer<typeof NormalizedEpisodeSchema>;

/**
 * Normalized season metadata for episodic TV and anime series.
 */
export const NormalizedSeasonSchema = z.object({
  seasonNumber: z.number().int().nonnegative(),
  name: z.string(),
  episodeCount: z.number().int().nonnegative(),
  overview: z.string().nullable().optional(),
  posterUrl: z.string().nullable().optional(),
  airDate: z.string().nullable().optional(),
  episodes: z.array(NormalizedEpisodeSchema).optional(),
});

export type NormalizedSeason = z.infer<typeof NormalizedSeasonSchema>;

/**
 * Unified normalized media result representation.
 * All provider-specific models (TMDB movies, TMDB TV series, AniList anime)
 * are translated into this consistent schema.
 */
export const MediaResultSchema = z.object({
  /** Composite key e.g. "tmdb:27205" or "anilist:16498" */
  id: z.string(),
  /** Source provider */
  externalSource: ExternalSourceSchema,
  /** Provider-specific unique ID as string */
  externalId: z.string(),
  /** Media classification: MOVIE, TV, or ANIME */
  type: MediaTypeSchema,
  /** Primary localized or preferred title */
  title: z.string().min(1),
  /** Original native language title (e.g. Romaji/Kanji) */
  originalTitle: z.string().nullable().optional(),
  /** Narrative synopsis / overview */
  overview: z.string().nullable().optional(),
  /** Release year (e.g. 2010) */
  year: z.number().int().nullable().optional(),
  /** Full release date in ISO format YYYY-MM-DD if available */
  releaseDate: z.string().nullable().optional(),
  /** High-quality poster artwork URL */
  posterUrl: z.string().nullable().optional(),
  /** High-quality backdrop or banner artwork URL */
  backdropUrl: z.string().nullable().optional(),
  /** Normalized genre names (e.g. ["Action", "Sci-Fi"]) */
  genres: z.array(z.string()).default([]),
  /** Movie runtime or average episode runtime in minutes */
  runtime: z.number().int().nonnegative().nullable().optional(),
  /** Production or airing status (e.g. "Released", "Ended", "Releasing") */
  status: z.string().nullable().optional(),
  /** Normalized community score on a 0-10 scale */
  voteAverage: z.number().min(0).max(10).nullable().optional(),
  /** Total community vote count */
  voteCount: z.number().int().nonnegative().nullable().optional(),
  /** Popularity metric from provider */
  popularity: z.number().nullable().optional(),
  /** Total episode count (1 for movies, N for series) */
  totalEpisodes: z.number().int().nonnegative().nullable().optional(),
  /** Total season count for TV series */
  totalSeasons: z.number().int().nonnegative().nullable().optional(),
  /** Animation or production studio names */
  studios: z.array(z.string()).optional(),
  /** Primary trailer link (YouTube URL) if available */
  trailerUrl: z.string().nullable().optional(),
  /** Director or primary creator name */
  director: z.string().nullable().optional(),
  /** Cast member previews */
  cast: z.array(CastMemberSchema).optional(),
  /** Season breakdowns for episodic titles */
  seasons: z.array(NormalizedSeasonSchema).optional(),
});

export type MediaResult = z.infer<typeof MediaResultSchema>;

/**
 * Options for metadata search operations.
 */
export interface MetadataSearchOptions {
  type?: MediaType | "ALL";
  page?: number;
  limit?: number;
  cacheTtlMs?: number;
}
