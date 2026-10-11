import { Prisma, Title, Season, Episode } from "@prisma/client";
import { MediaResult, NormalizedSeason, NormalizedEpisode } from "./types";

export type PrismaTitleWithRelations = Title & {
  seasons?: Array<
    Season & {
      episodes?: Episode[];
    }
  >;
};

/**
 * Maps normalized MediaResult to Prisma Title create input.
 */
export function mediaResultToPrismaCreateInput(media: MediaResult): Prisma.TitleCreateInput {
  return {
    externalSource: media.externalSource,
    externalId: media.externalId,
    title: media.title,
    type: media.type,
    year: media.year,
    overview: media.overview,
    posterUrl: media.posterUrl,
    backdropUrl: media.backdropUrl,
    genres: media.genres,
  };
}

/**
 * Builds Prisma upsert arguments for storing or updating external title metadata.
 */
export function mediaResultToPrismaUpsertArgs(media: MediaResult): Prisma.TitleUpsertArgs {
  const createData = mediaResultToPrismaCreateInput(media);
  return {
    where: {
      externalSource_externalId: {
        externalSource: media.externalSource,
        externalId: media.externalId,
      },
    },
    create: createData,
    update: {
      title: media.title,
      type: media.type,
      year: media.year,
      overview: media.overview,
      posterUrl: media.posterUrl,
      backdropUrl: media.backdropUrl,
      genres: media.genres,
    },
  };
}

/**
 * Converts a database Title record (and optional related seasons/episodes)
 * into the unified MediaResult model.
 */
export function prismaTitleToMediaResult(record: PrismaTitleWithRelations): MediaResult {
  const seasons: NormalizedSeason[] | undefined = record.seasons?.map((season) => {
    const episodes: NormalizedEpisode[] | undefined = season.episodes?.map((ep) => ({
      episodeNumber: ep.episodeNumber,
      seasonNumber: season.seasonNumber,
      name: ep.name || `Episode ${ep.episodeNumber}`,
      airDate: ep.airDate,
      runtime: ep.runtime,
    }));

    return {
      seasonNumber: season.seasonNumber,
      name: season.name || `Season ${season.seasonNumber}`,
      episodeCount: season.episodeCount,
      episodes,
    };
  });

  return {
    id: record.id,
    externalSource: record.externalSource as "tmdb" | "anilist",
    externalId: record.externalId,
    type: record.type,
    title: record.title,
    year: record.year,
    overview: record.overview,
    posterUrl: record.posterUrl,
    backdropUrl: record.backdropUrl,
    genres: record.genres,
    totalEpisodes:
      record.type === "MOVIE" ? 1 : seasons?.reduce((acc, s) => acc + s.episodeCount, 0) || null,
    totalSeasons: seasons ? seasons.length : null,
    seasons,
  };
}
