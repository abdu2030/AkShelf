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
