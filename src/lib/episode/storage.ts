import { Episode, Prisma, PrismaClient, Season } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ensureSeasonRecord } from "@/lib/season/storage";

export interface EpisodeInput {
  episodeNumber: number;
  name?: string | null;
  airDate?: string | null;
  runtime?: number | null;
  externalId?: string | null;
}

export interface PersistEpisodesOptions {
  /**
   * If provided, only persists the specified episode numbers (e.g. [1, 2, 3]).
   * This prevents importing unnecessary episodes until requested.
   */
  selectiveEpisodeNumbers?: number[];

  /**
   * If true, updates the parent Season's episodeCount to match total episodes count.
   */
  updateSeasonCount?: boolean;
}

/**
 * Persists episodes for a selected season in PostgreSQL (Day 31).
 * Strictly respects Day 31 architecture:
 * - Upserts episode metadata (episodeNumber, name, airDate, runtime, externalId).
 * - Avoids importing unnecessary seasons or episodes until selected.
 * - Idempotent across multiple syncs.
 */
export async function persistSeasonEpisodes(
  client: Prisma.TransactionClient | PrismaClient,
  seasonId: string,
  episodes: EpisodeInput[],
  options: PersistEpisodesOptions = {},
): Promise<Episode[]> {
  if (!episodes || episodes.length === 0) return [];

  const targetEpisodes = options.selectiveEpisodeNumbers
    ? episodes.filter((ep) => options.selectiveEpisodeNumbers!.includes(ep.episodeNumber))
    : episodes;

  const results: Episode[] = [];

  for (const ep of targetEpisodes) {
    const defaultName = ep.name?.trim() || `Episode ${ep.episodeNumber}`;

    const persisted = await client.episode.upsert({
      where: {
        seasonId_episodeNumber: {
          seasonId,
          episodeNumber: ep.episodeNumber,
        },
      },
      create: {
        seasonId,
        episodeNumber: ep.episodeNumber,
        name: defaultName,
        airDate: ep.airDate ?? null,
        runtime: ep.runtime ?? null,
        externalId: ep.externalId ?? null,
      },
      update: {
        name: defaultName,
        ...(ep.airDate !== undefined ? { airDate: ep.airDate ?? null } : {}),
        ...(ep.runtime !== undefined ? { runtime: ep.runtime ?? null } : {}),
        ...(ep.externalId !== undefined ? { externalId: ep.externalId ?? null } : {}),
      },
    });

    results.push(persisted);
  }

  if (options.updateSeasonCount && episodes.length > 0) {
    await client.season.update({
      where: { id: seasonId },
      data: { episodeCount: episodes.length },
    });
  }

  return results;
}

/**
 * Fetches all persisted episodes for a season from PostgreSQL, ordered by episodeNumber ascending.
 */
export async function getPersistedEpisodesForSeason(
  seasonId: string,
  client: Prisma.TransactionClient | PrismaClient = prisma,
): Promise<Episode[]> {
  return client.episode.findMany({
    where: { seasonId },
    orderBy: { episodeNumber: "asc" },
  });
}

/**
 * Fetches all persisted episodes for a title and season number from PostgreSQL, ordered by episodeNumber ascending.
 */
export async function getPersistedEpisodesForTitleAndSeason(
  titleId: string,
  seasonNumber: number,
  client: Prisma.TransactionClient | PrismaClient = prisma,
): Promise<Episode[]> {
  const season = await client.season.findUnique({
    where: {
      titleId_seasonNumber: {
        titleId,
        seasonNumber,
      },
    },
    select: { id: true },
  });

  if (!season) return [];

  return client.episode.findMany({
    where: { seasonId: season.id },
    orderBy: { episodeNumber: "asc" },
  });
}

/**
 * Atomically ensures a single episode record exists for a season.
 */
export async function ensureEpisodeRecord(
  client: Prisma.TransactionClient | PrismaClient,
  seasonId: string,
  episodeNumber: number,
  metadata?: Partial<EpisodeInput>,
): Promise<Episode> {
  const defaultName = metadata?.name?.trim() || `Episode ${episodeNumber}`;

  return client.episode.upsert({
    where: {
      seasonId_episodeNumber: {
        seasonId,
        episodeNumber,
      },
    },
    create: {
      seasonId,
      episodeNumber,
      name: defaultName,
      airDate: metadata?.airDate ?? null,
      runtime: metadata?.runtime ?? null,
      externalId: metadata?.externalId ?? null,
    },
    update: {
      name: defaultName,
      ...(metadata?.airDate !== undefined ? { airDate: metadata.airDate ?? null } : {}),
      ...(metadata?.runtime !== undefined ? { runtime: metadata.runtime ?? null } : {}),
      ...(metadata?.externalId !== undefined ? { externalId: metadata.externalId ?? null } : {}),
    },
  });
}

/**
 * Composite helper to ensure parent season exists and persist all its episodes.
 */
export async function persistTitleSeasonEpisodes(
  client: Prisma.TransactionClient | PrismaClient,
  titleId: string,
  seasonNumber: number,
  episodes: EpisodeInput[],
  seasonMetadata?: { name?: string | null; episodeCount?: number },
  options: PersistEpisodesOptions = {},
): Promise<{ season: Season; episodes: Episode[] }> {
  const season = await ensureSeasonRecord(client, titleId, seasonNumber, {
    name: seasonMetadata?.name,
    episodeCount: seasonMetadata?.episodeCount ?? episodes.length,
  });

  const persistedEpisodes = await persistSeasonEpisodes(client, season.id, episodes, options);

  return {
    season,
    episodes: persistedEpisodes,
  };
}
