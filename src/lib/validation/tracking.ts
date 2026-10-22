import { z } from "zod";

export const toggleEpisodeSchema = z.object({
  titleExternalSource: z.enum(["tmdb", "anilist"]),
  titleExternalId: z.string().min(1, "titleExternalId is required"),
  seasonNumber: z.number().int().min(0, "seasonNumber must be >= 0"),
  episodeNumber: z.number().int().min(1, "episodeNumber must be >= 1"),
  watched: z.boolean(),
  titleName: z.string().optional(),
  mediaType: z.enum(["MOVIE", "TV", "ANIME"]).optional(),
  episodeName: z.string().optional(),
  revertStatus: z
    .enum(["WATCHED", "WATCHING", "PLAN_TO_WATCH", "ON_HOLD", "DROPPED"])
    .optional()
    .nullable(),
});

export type ToggleEpisodeInput = z.infer<typeof toggleEpisodeSchema>;

export const batchSeasonSchema = z.object({
  titleExternalSource: z.enum(["tmdb", "anilist"]),
  titleExternalId: z.string().min(1, "titleExternalId is required"),
  seasonNumber: z.number().int().min(0, "seasonNumber must be >= 0"),
  watched: z.boolean(),
  episodeNumbers: z
    .array(z.number().int().min(1))
    .min(1, "At least one episode number is required"),
  titleName: z.string().optional(),
  mediaType: z.enum(["MOVIE", "TV", "ANIME"]).optional(),
  allSeasonsWatched: z.boolean().optional(),
});

export type BatchSeasonInput = z.infer<typeof batchSeasonSchema>;

export const batchSeriesSchema = z.object({
  titleExternalSource: z.enum(["tmdb", "anilist"]),
  titleExternalId: z.string().min(1, "titleExternalId is required"),
  watched: z.boolean(),
  titleName: z.string().optional(),
  mediaType: z.enum(["MOVIE", "TV", "ANIME"]).optional(),
  seasons: z
    .array(
      z.object({
        seasonNumber: z.number().int().min(0),
        episodeCount: z.number().int().min(0),
        episodeNumbers: z.array(z.number().int().min(1)).optional(),
      }),
    )
    .optional(),
});

export type BatchSeriesInput = z.infer<typeof batchSeriesSchema>;

export const seasonSummaryInputSchema = z.object({
  seasonNumber: z.number().int().min(0),
  name: z.string().optional().nullable(),
  episodeCount: z.number().int().min(0).default(0),
});

export type SeasonSummaryInput = z.infer<typeof seasonSummaryInputSchema>;

export const syncTitleSeasonsSchema = z.object({
  titleExternalSource: z.enum(["tmdb", "anilist"]),
  titleExternalId: z.string().min(1, "titleExternalId is required"),
  titleName: z.string().optional(),
  mediaType: z.enum(["MOVIE", "TV", "ANIME"]).optional(),
  seasons: z.array(seasonSummaryInputSchema).min(1, "At least one season is required"),
  selectedSeasonNumber: z.number().int().min(0).optional(),
});

export type SyncTitleSeasonsInput = z.infer<typeof syncTitleSeasonsSchema>;

export const episodeInputSchema = z.object({
  episodeNumber: z.number().int().min(1, "episodeNumber must be >= 1"),
  name: z.string().optional().nullable(),
  airDate: z.string().optional().nullable(),
  runtime: z.number().int().nonnegative().optional().nullable(),
  externalId: z.string().optional().nullable(),
});

export type EpisodeInput = z.infer<typeof episodeInputSchema>;

export const syncSeasonEpisodesSchema = z.object({
  titleExternalSource: z.enum(["tmdb", "anilist"]),
  titleExternalId: z.string().min(1, "titleExternalId is required"),
  seasonNumber: z.number().int().min(0, "seasonNumber must be >= 0"),
  seasonName: z.string().optional().nullable(),
  titleName: z.string().optional(),
  mediaType: z.enum(["MOVIE", "TV", "ANIME"]).optional(),
  episodes: z.array(episodeInputSchema).min(1, "At least one episode is required"),
  selectiveEpisodeNumbers: z.array(z.number().int().min(1)).optional(),
});

export type SyncSeasonEpisodesInput = z.infer<typeof syncSeasonEpisodesSchema>;

export const fetchSeasonEpisodesSchema = z.object({
  titleExternalSource: z.enum(["tmdb", "anilist"]),
  titleExternalId: z.string().min(1, "titleExternalId is required"),
  seasonNumber: z.number().int().min(0, "seasonNumber must be >= 0"),
  titleName: z.string().optional(),
  mediaType: z.enum(["MOVIE", "TV", "ANIME"]).optional(),
});

export type FetchSeasonEpisodesInput = z.infer<typeof fetchSeasonEpisodesSchema>;

export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/, "Must be a valid date string (YYYY-MM-DD or ISO)")
  .refine((val) => !isNaN(Date.parse(val)), "Must be a valid calendar date")
  .nullable()
  .optional();

export const updateTitleStatusSchema = z.object({
  titleExternalSource: z.enum(["tmdb", "anilist"]),
  titleExternalId: z.string().min(1, "titleExternalId is required"),
  status: z.enum(["WATCHED", "WATCHING", "PLAN_TO_WATCH", "ON_HOLD", "DROPPED"]).nullable(),
  titleName: z.string().optional(),
  mediaType: z.enum(["MOVIE", "TV", "ANIME"]).optional(),
  rating: z.number().min(0).max(10).optional().nullable(),
  startedAt: dateStringSchema,
  watchedAt: dateStringSchema,
  year: z.number().int().optional().nullable(),
  overview: z.string().optional().nullable(),
  posterUrl: z.string().optional().nullable(),
  backdropUrl: z.string().optional().nullable(),
  genres: z.array(z.string()).optional(),
  seasons: z.array(seasonSummaryInputSchema).optional(),
});

export type UpdateTitleStatusInput = z.infer<typeof updateTitleStatusSchema>;

export const updateTitleRatingSchema = z.object({
  titleExternalSource: z.enum(["tmdb", "anilist"]),
  titleExternalId: z.string().min(1, "titleExternalId is required"),
  rating: z
    .number()
    .min(1, "Rating must be between 1 and 10")
    .max(10, "Rating must be between 1 and 10")
    .nullable(),
  titleName: z.string().optional(),
  mediaType: z.enum(["MOVIE", "TV", "ANIME"]).optional(),
  year: z.number().int().optional().nullable(),
  overview: z.string().optional().nullable(),
  posterUrl: z.string().optional().nullable(),
  backdropUrl: z.string().optional().nullable(),
  genres: z.array(z.string()).optional(),
});

export type UpdateTitleRatingInput = z.infer<typeof updateTitleRatingSchema>;

export const updateTitleDatesSchema = z.object({
  titleExternalSource: z.enum(["tmdb", "anilist"]),
  titleExternalId: z.string().min(1, "titleExternalId is required"),
  startedAt: dateStringSchema,
  watchedAt: dateStringSchema,
  titleName: z.string().optional(),
  mediaType: z.enum(["MOVIE", "TV", "ANIME"]).optional(),
  year: z.number().int().optional().nullable(),
  overview: z.string().optional().nullable(),
  posterUrl: z.string().optional().nullable(),
  backdropUrl: z.string().optional().nullable(),
  genres: z.array(z.string()).optional(),
});

export type UpdateTitleDatesInput = z.infer<typeof updateTitleDatesSchema>;
