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
});

export type BatchSeasonInput = z.infer<typeof batchSeasonSchema>;

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

export const updateTitleStatusSchema = z.object({
  titleExternalSource: z.enum(["tmdb", "anilist"]),
  titleExternalId: z.string().min(1, "titleExternalId is required"),
  status: z.enum(["WATCHED", "WATCHING", "PLAN_TO_WATCH", "ON_HOLD", "DROPPED"]).nullable(),
  titleName: z.string().optional(),
  mediaType: z.enum(["MOVIE", "TV", "ANIME"]).optional(),
  rating: z.number().min(0).max(10).optional().nullable(),
  startedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/, "Must be a valid date string (YYYY-MM-DD or ISO)")
    .nullable()
    .optional(),
  watchedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/, "Must be a valid date string (YYYY-MM-DD or ISO)")
    .nullable()
    .optional(),
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
});

export type UpdateTitleRatingInput = z.infer<typeof updateTitleRatingSchema>;

export const updateTitleDatesSchema = z.object({
  titleExternalSource: z.enum(["tmdb", "anilist"]),
  titleExternalId: z.string().min(1, "titleExternalId is required"),
  startedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/, "Must be a valid date string (YYYY-MM-DD or ISO)")
    .nullable()
    .optional(),
  watchedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/, "Must be a valid date string (YYYY-MM-DD or ISO)")
    .nullable()
    .optional(),
  titleName: z.string().optional(),
  mediaType: z.enum(["MOVIE", "TV", "ANIME"]).optional(),
});

export type UpdateTitleDatesInput = z.infer<typeof updateTitleDatesSchema>;
