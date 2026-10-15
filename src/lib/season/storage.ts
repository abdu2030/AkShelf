import { Prisma, PrismaClient, Season } from "@prisma/client";
import { prisma } from "@/lib/db";

export interface SeasonSummary {
  seasonNumber: number;
  name?: string | null;
  episodeCount: number;
}

export interface PersistSeasonsOptions {
  /**
   * If provided, only persists the specified seasons (e.g. [1]).
   * This prevents importing unnecessary seasons until requested.
   */
  selectiveSeasonNumbers?: number[];
}

/**
 * Persists seasons for a selected TV/anime title in PostgreSQL (Day 30).
 * Strictly respects Day 30 architecture:
 * - Upserts season summary records (seasonNumber, name, episodeCount).
 * - Avoids importing unnecessary seasons/episodes until needed (does NOT insert Episode records).
 */
export async function persistTitleSeasons(
  client: Prisma.TransactionClient | PrismaClient,
  titleId: string,
  seasons: SeasonSummary[],
  options: PersistSeasonsOptions = {},
): Promise<Season[]> {
  if (!seasons || seasons.length === 0) return [];

  const targetSeasons = options.selectiveSeasonNumbers
    ? seasons.filter((s) => options.selectiveSeasonNumbers!.includes(s.seasonNumber))
    : seasons;

  const results: Season[] = [];

  for (const s of targetSeasons) {
    const defaultName = s.name?.trim() || `Season ${s.seasonNumber}`;
    const epCount = s.episodeCount ?? 0;

    const persisted = await client.season.upsert({
      where: {
        titleId_seasonNumber: {
          titleId,
          seasonNumber: s.seasonNumber,
        },
      },
      create: {
        titleId,
        seasonNumber: s.seasonNumber,
        name: defaultName,
        episodeCount: epCount,
      },
      update: {
        name: defaultName,
        episodeCount: epCount,
      },
    });

    results.push(persisted);
  }

  return results;
}

/**
 * Fetches all persisted seasons for a title from PostgreSQL, ordered by seasonNumber ascending.
 */
export async function getPersistedSeasonsForTitle(
  titleId: string,
  client: Prisma.TransactionClient | PrismaClient = prisma,
): Promise<Season[]> {
  return client.season.findMany({
    where: { titleId },
    orderBy: { seasonNumber: "asc" },
  });
}

/**
 * Atomically ensures a single season record exists for a title.
 */
export async function ensureSeasonRecord(
  client: Prisma.TransactionClient | PrismaClient,
  titleId: string,
  seasonNumber: number,
  metadata?: { name?: string | null; episodeCount?: number },
): Promise<Season> {
  const defaultName = metadata?.name?.trim() || `Season ${seasonNumber}`;
  const epCount = metadata?.episodeCount ?? 0;

  return client.season.upsert({
    where: {
      titleId_seasonNumber: {
        titleId,
        seasonNumber,
      },
    },
    create: {
      titleId,
      seasonNumber,
      name: defaultName,
      episodeCount: epCount,
    },
    update: {
      name: defaultName,
      ...(epCount > 0 ? { episodeCount: epCount } : {}),
    },
  });
}
