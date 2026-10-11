import { z } from "zod";

export const AniListTitleSchema = z.object({
  romaji: z.string().nullable().optional(),
  english: z.string().nullable().optional(),
  native: z.string().nullable().optional(),
  userPreferred: z.string().nullable().optional(),
});
export type AniListTitle = z.infer<typeof AniListTitleSchema>;

export const AniListCoverImageSchema = z.object({
  extraLarge: z.string().nullable().optional(),
  large: z.string().nullable().optional(),
  medium: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
});
export type AniListCoverImage = z.infer<typeof AniListCoverImageSchema>;

export const AniListFuzzyDateSchema = z.object({
  year: z.number().nullable().optional(),
  month: z.number().nullable().optional(),
  day: z.number().nullable().optional(),
});
export type AniListFuzzyDate = z.infer<typeof AniListFuzzyDateSchema>;

export const AniListStudioNodeSchema = z.object({
  id: z.number(),
  name: z.string(),
  isAnimationStudio: z.boolean().optional(),
});
export type AniListStudioNode = z.infer<typeof AniListStudioNodeSchema>;

export const AniListStreamingEpisodeSchema = z.object({
  title: z.string().nullable().optional(),
  thumbnail: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  site: z.string().nullable().optional(),
});
export type AniListStreamingEpisode = z.infer<typeof AniListStreamingEpisodeSchema>;

export const AniListMediaSchema = z.object({
  id: z.number(),
  idMal: z.number().nullable().optional(),
  title: AniListTitleSchema,
  coverImage: AniListCoverImageSchema.nullable().optional(),
  bannerImage: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  format: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  episodes: z.number().nullable().optional(),
  duration: z.number().nullable().optional(),
  seasonYear: z.number().nullable().optional(),
  season: z.string().nullable().optional(),
  startDate: AniListFuzzyDateSchema.nullable().optional(),
  genres: z.array(z.string()).default([]),
  averageScore: z.number().nullable().optional(),
  popularity: z.number().nullable().optional(),
  studios: z
    .object({
      nodes: z.array(AniListStudioNodeSchema).default([]),
    })
    .nullable()
    .optional(),
  streamingEpisodes: z.array(AniListStreamingEpisodeSchema).nullable().optional(),
});
export type AniListMedia = z.infer<typeof AniListMediaSchema>;

export const AniListPageInfoSchema = z.object({
  total: z.number().default(0),
  perPage: z.number().default(20),
  currentPage: z.number().default(1),
  lastPage: z.number().default(1),
  hasNextPage: z.boolean().default(false),
});
export type AniListPageInfo = z.infer<typeof AniListPageInfoSchema>;

export interface AniListSearchResponse {
  pageInfo: AniListPageInfo;
  media: AniListMedia[];
}
