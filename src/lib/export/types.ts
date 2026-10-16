import { z } from "zod";

export const mediaTypeEnum = z.enum(["MOVIE", "TV", "ANIME"]);
export const watchStatusEnum = z.enum([
  "WATCHED",
  "WATCHING",
  "PLAN_TO_WATCH",
  "ON_HOLD",
  "DROPPED",
]);

export const exportTitleItemSchema = z.object({
  title: z.string().min(1),
  type: mediaTypeEnum,
  year: z.number().int().nullable().optional(),
  overview: z.string().nullable().optional(),
  posterUrl: z.string().nullable().optional(),
  backdropUrl: z.string().nullable().optional(),
  genres: z.array(z.string()).default([]),
  externalSource: z.string().min(1),
  externalId: z.string().min(1),
  status: watchStatusEnum,
  rating: z.number().min(0.5).max(10).nullable().optional(),
  startedAt: z.string().nullable().optional(),
  watchedAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type ExportTitleItem = z.infer<typeof exportTitleItemSchema>;

export const exportEpisodeItemSchema = z.object({
  externalSource: z.string().min(1),
  externalId: z.string().min(1),
  titleName: z.string().min(1),
  seasonNumber: z.number().int().min(0),
  episodeNumber: z.number().int().min(1),
  episodeName: z.string().nullable().optional(),
  watchedAt: z.string(),
});

export type ExportEpisodeItem = z.infer<typeof exportEpisodeItemSchema>;

export const exportHistoryItemSchema = z.object({
  externalSource: z.string().min(1),
  externalId: z.string().min(1),
  titleName: z.string().min(1),
  action: z.string().min(1),
  occurredAt: z.string(),
  seasonNumber: z.number().int().nullable().optional(),
  episodeNumber: z.number().int().nullable().optional(),
});

export type ExportHistoryItem = z.infer<typeof exportHistoryItemSchema>;

export const exportBackupSchema = z.object({
  app: z.literal("AkShelf"),
  version: z.string(),
  schemaVersion: z.literal(1),
  exportedAt: z.string(),
  user: z.object({
    id: z.string().optional(),
    email: z.string().email(),
  }),
  stats: z.object({
    totalTitles: z.number().int().min(0),
    totalEpisodes: z.number().int().min(0),
    totalHistory: z.number().int().min(0),
  }),
  titles: z.array(exportTitleItemSchema),
  episodes: z.array(exportEpisodeItemSchema),
  history: z.array(exportHistoryItemSchema),
});

export type ExportDataJson = z.infer<typeof exportBackupSchema>;

export interface RestoreResult {
  success: boolean;
  titlesRestored: number;
  episodesRestored: number;
  historyRestored: number;
  errors: string[];
}
