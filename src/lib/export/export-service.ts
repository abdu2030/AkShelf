import { prisma } from "@/lib/db";
import {
  ExportDataJson,
  exportBackupSchema,
  ExportTitleItem,
  ExportEpisodeItem,
  ExportHistoryItem,
  RestoreResult,
} from "./types";

/**
 * Escapes a cell value for RFC 4180 compliant CSV formatting.
 */
export function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates a full structured JSON backup of the user's personal shelf,
 * including tracking state, episode progress, and audit history.
 */
export async function generateJsonExport(userId: string): Promise<ExportDataJson> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!user) {
    throw new Error(`User with ID ${userId} not found.`);
  }

  // 1. Fetch tracked titles
  const userTitles = await prisma.userTitle.findMany({
    where: { userId },
    include: { title: true },
    orderBy: { createdAt: "asc" },
  });

  const exportTitles: ExportTitleItem[] = userTitles.map((ut) => ({
    title: ut.title.title,
    type: ut.title.type,
    year: ut.title.year,
    overview: ut.title.overview,
    posterUrl: ut.title.posterUrl,
    backdropUrl: ut.title.backdropUrl,
    genres: ut.title.genres,
    externalSource: ut.title.externalSource,
    externalId: ut.title.externalId,
    status: ut.status,
    rating: ut.rating,
    startedAt: ut.startedAt ? ut.startedAt.toISOString() : null,
    watchedAt: ut.watchedAt ? ut.watchedAt.toISOString() : null,
    createdAt: ut.createdAt.toISOString(),
    updatedAt: ut.updatedAt.toISOString(),
  }));

  // 2. Fetch episode progress
  const userEpisodes = await prisma.userEpisode.findMany({
    where: { userId },
    include: {
      episode: {
        include: {
          season: {
            include: {
              title: true,
            },
          },
        },
      },
    },
    orderBy: { watchedAt: "asc" },
  });

  const exportEpisodes: ExportEpisodeItem[] = userEpisodes.map((ue) => ({
    externalSource: ue.episode.season.title.externalSource,
    externalId: ue.episode.season.title.externalId,
    titleName: ue.episode.season.title.title,
    seasonNumber: ue.episode.season.seasonNumber,
    episodeNumber: ue.episode.episodeNumber,
    episodeName: ue.episode.name,
    watchedAt: ue.watchedAt.toISOString(),
  }));

  // 3. Fetch watch history audit log
  const historyEntries = await prisma.watchHistory.findMany({
    where: { userId },
    include: {
      title: true,
      episode: {
        include: {
          season: true,
        },
      },
    },
    orderBy: { occurredAt: "asc" },
  });

  const exportHistory: ExportHistoryItem[] = historyEntries.map((h) => ({
    externalSource: h.title.externalSource,
    externalId: h.title.externalId,
    titleName: h.title.title,
    action: h.action,
    occurredAt: h.occurredAt.toISOString(),
    seasonNumber: h.episode?.season?.seasonNumber ?? null,
    episodeNumber: h.episode?.episodeNumber ?? null,
  }));

  return {
    app: "AkShelf",
    version: "1.0.0",
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
    },
    stats: {
      totalTitles: exportTitles.length,
      totalEpisodes: exportEpisodes.length,
      totalHistory: exportHistory.length,
    },
    titles: exportTitles,
    episodes: exportEpisodes,
    history: exportHistory,
  };
}

/**
 * Generates an RFC 4180 compliant CSV export of the user's library,
 * ideal for spreadsheets (Excel, Google Sheets) or external tracker migrations.
 */
export async function generateCsvExport(userId: string): Promise<string> {
  const userTitles = await prisma.userTitle.findMany({
    where: { userId },
    include: { title: true },
    orderBy: { createdAt: "asc" },
  });

  const headers = [
    "Title",
    "Type",
    "Status",
    "Rating",
    "StartedAt",
    "WatchedAt",
    "ReleaseYear",
    "ExternalSource",
    "ExternalId",
    "AddedAt",
  ];

  const rows = userTitles.map((ut) => [
    escapeCsv(ut.title.title),
    escapeCsv(ut.title.type),
    escapeCsv(ut.status),
    escapeCsv(ut.rating !== null ? ut.rating : ""),
    escapeCsv(ut.startedAt ? ut.startedAt.toISOString().split("T")[0] : ""),
    escapeCsv(ut.watchedAt ? ut.watchedAt.toISOString().split("T")[0] : ""),
    escapeCsv(ut.title.year ?? ""),
    escapeCsv(ut.title.externalSource),
    escapeCsv(ut.title.externalId),
    escapeCsv(ut.createdAt.toISOString().split("T")[0]),
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
}

/**
 * Validates a backup payload against the AkShelf export schema.
 */
export function verifySchemaConsistency(rawData: unknown): {
  valid: boolean;
  errors: string[];
} {
  const result = exportBackupSchema.safeParse(rawData);
  if (!result.success) {
    const errors = result.error.issues.map(
      (issue) => `${issue.path.join(".") || "root"}: ${issue.message}`,
    );
    return { valid: false, errors };
  }
  return { valid: true, errors: [] };
}

/**
 * Restores a user's library, episode progress, and watch history from a validated JSON backup.
 */
export async function restoreFromJson(userId: string, rawData: unknown): Promise<RestoreResult> {
  const validation = verifySchemaConsistency(rawData);
  if (!validation.valid) {
    return {
      success: false,
      titlesRestored: 0,
      episodesRestored: 0,
      historyRestored: 0,
      errors: validation.errors,
    };
  }

  const data = rawData as ExportDataJson;

  let titlesRestored = 0;
  let episodesRestored = 0;
  let historyRestored = 0;
  const errors: string[] = [];

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Restore titles and userTitles
      for (const t of data.titles) {
        // Upsert metadata Title
        const titleRecord = await tx.title.upsert({
          where: {
            externalSource_externalId: {
              externalSource: t.externalSource,
              externalId: t.externalId,
            },
          },
          create: {
            title: t.title,
            type: t.type,
            year: t.year ?? null,
            overview: t.overview ?? null,
            posterUrl: t.posterUrl ?? null,
            backdropUrl: t.backdropUrl ?? null,
            genres: t.genres ?? [],
            externalSource: t.externalSource,
            externalId: t.externalId,
          },
          update: {
            title: t.title,
            type: t.type,
            year: t.year ?? null,
            posterUrl: t.posterUrl ?? null,
            backdropUrl: t.backdropUrl ?? null,
          },
        });

        // Upsert UserTitle tracking state
        await tx.userTitle.upsert({
          where: {
            userId_titleId: {
              userId,
              titleId: titleRecord.id,
            },
          },
          create: {
            userId,
            titleId: titleRecord.id,
            status: t.status,
            rating: t.rating ?? null,
            startedAt: t.startedAt ? new Date(t.startedAt) : null,
            watchedAt: t.watchedAt ? new Date(t.watchedAt) : null,
            createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
          },
          update: {
            status: t.status,
            rating: t.rating ?? null,
            startedAt: t.startedAt ? new Date(t.startedAt) : null,
            watchedAt: t.watchedAt ? new Date(t.watchedAt) : null,
          },
        });

        titlesRestored++;
      }

      // 2. Restore user episodes
      for (const ep of data.episodes) {
        const titleRecord = await tx.title.findUnique({
          where: {
            externalSource_externalId: {
              externalSource: ep.externalSource,
              externalId: ep.externalId,
            },
          },
        });

        if (!titleRecord) continue;

        // Ensure Season exists
        const season = await tx.season.upsert({
          where: {
            titleId_seasonNumber: {
              titleId: titleRecord.id,
              seasonNumber: ep.seasonNumber,
            },
          },
          create: {
            titleId: titleRecord.id,
            seasonNumber: ep.seasonNumber,
            name: `Season ${ep.seasonNumber}`,
          },
          update: {},
        });

        // Ensure Episode exists
        const episodeRecord = await tx.episode.upsert({
          where: {
            seasonId_episodeNumber: {
              seasonId: season.id,
              episodeNumber: ep.episodeNumber,
            },
          },
          create: {
            seasonId: season.id,
            episodeNumber: ep.episodeNumber,
            name: ep.episodeName ?? `Episode ${ep.episodeNumber}`,
          },
          update: {},
        });

        // Upsert UserEpisode progress
        await tx.userEpisode.upsert({
          where: {
            userId_episodeId: {
              userId,
              episodeId: episodeRecord.id,
            },
          },
          create: {
            userId,
            episodeId: episodeRecord.id,
            watchedAt: new Date(ep.watchedAt),
          },
          update: {
            watchedAt: new Date(ep.watchedAt),
          },
        });

        episodesRestored++;
      }

      // 3. Restore watch history audit log
      for (const h of data.history) {
        const titleRecord = await tx.title.findUnique({
          where: {
            externalSource_externalId: {
              externalSource: h.externalSource,
              externalId: h.externalId,
            },
          },
        });

        if (!titleRecord) continue;

        let episodeId: string | null = null;
        if (h.seasonNumber !== null && h.seasonNumber !== undefined && h.episodeNumber) {
          const season = await tx.season.findUnique({
            where: {
              titleId_seasonNumber: {
                titleId: titleRecord.id,
                seasonNumber: h.seasonNumber,
              },
            },
          });
          if (season) {
            const ep = await tx.episode.findUnique({
              where: {
                seasonId_episodeNumber: {
                  seasonId: season.id,
                  episodeNumber: h.episodeNumber,
                },
              },
            });
            if (ep) episodeId = ep.id;
          }
        }

        await tx.watchHistory.create({
          data: {
            userId,
            titleId: titleRecord.id,
            episodeId,
            action: h.action,
            occurredAt: new Date(h.occurredAt),
          },
        });

        historyRestored++;
      }
    });

    return {
      success: true,
      titlesRestored,
      episodesRestored,
      historyRestored,
      errors: [],
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to restore database backup";
    errors.push(message);
    return {
      success: false,
      titlesRestored,
      episodesRestored,
      historyRestored,
      errors,
    };
  }
}
