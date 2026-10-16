"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureSeasonRecord, persistTitleSeasons } from "@/lib/season/storage";
import { persistSeasonEpisodes } from "@/lib/episode/storage";
import { metadataService } from "@/lib/metadata/service";
import { safeLogger, sanitizeErrorMessage } from "@/lib/security/sanitizer";
import {
  batchSeasonSchema,
  fetchSeasonEpisodesSchema,
  syncSeasonEpisodesSchema,
  syncTitleSeasonsSchema,
  toggleEpisodeSchema,
  updateTitleDatesSchema,
  updateTitleRatingSchema,
  updateTitleStatusSchema,
  BatchSeasonInput,
  FetchSeasonEpisodesInput,
  SyncSeasonEpisodesInput,
  SyncTitleSeasonsInput,
  ToggleEpisodeInput,
  UpdateTitleDatesInput,
  UpdateTitleRatingInput,
  UpdateTitleStatusInput,
} from "@/lib/validation/tracking";

export type TrackingActionResult = {
  success: boolean;
  error?: string;
  watched?: boolean;
  seasonNumber?: number;
  episodeNumber?: number;
  count?: number;
  status?: string | null;
  statusTransitioned?: boolean;
  previousStatus?: string | null;
  rating?: number | null;
  startedAt?: Date | null;
  watchedAt?: Date | null;
  isDemo?: boolean;
  seasons?: Array<{
    seasonNumber: number;
    name: string | null;
    episodeCount: number;
  }>;
  episodes?: Array<{
    episodeNumber: number;
    name: string | null;
    airDate?: string | null;
    runtime?: number | null;
  }>;
};

/**
 * Server action to toggle progress for a single episode (Day 20)
 * Validates input, verifies authenticated user, updates UserEpisode,
 * updates UserTitle status to WATCHING if needed, and writes an audit log in WatchHistory.
 */
export async function toggleEpisodeProgressAction(
  rawInput: ToggleEpisodeInput,
): Promise<TrackingActionResult> {
  const parsed = toggleEpisodeSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error:
        "Invalid episode tracking input: " + parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const {
    titleExternalSource,
    titleExternalId,
    seasonNumber,
    episodeNumber,
    watched,
    titleName,
    mediaType,
    episodeName,
    revertStatus,
  } = parsed.data;

  // Derive authenticated user ID securely from server session
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    // If running in demo mode or without authentication, return simulated success
    return {
      success: true,
      watched,
      seasonNumber,
      episodeNumber,
      isDemo: true,
      statusTransitioned: false,
      status: "WATCHING",
    };
  }

  try {
    let statusTransitioned = false;
    let previousStatus: string | null = null;
    let currentStatus: string | null = null;

    await prisma.$transaction(async (tx) => {
      // 1. Ensure Title exists in database
      const title = await tx.title.upsert({
        where: {
          externalSource_externalId: {
            externalSource: titleExternalSource,
            externalId: titleExternalId,
          },
        },
        update: {},
        create: {
          externalSource: titleExternalSource,
          externalId: titleExternalId,
          title: titleName || `${titleExternalSource}:${titleExternalId}`,
          type: mediaType || "TV",
        },
      });

      // 2. Ensure Season exists in database
      const season = await tx.season.upsert({
        where: {
          titleId_seasonNumber: {
            titleId: title.id,
            seasonNumber,
          },
        },
        update: {},
        create: {
          titleId: title.id,
          seasonNumber,
          name: `Season ${seasonNumber}`,
        },
      });

      // 3. Ensure Episode exists in database
      const episode = await tx.episode.upsert({
        where: {
          seasonId_episodeNumber: {
            seasonId: season.id,
            episodeNumber,
          },
        },
        update: {},
        create: {
          seasonId: season.id,
          episodeNumber,
          name: episodeName || `Episode ${episodeNumber}`,
        },
      });

      // Check existing user title status if supported by tx mock/client
      let existingUserTitle: {
        id: string;
        status: "WATCHED" | "WATCHING" | "PLAN_TO_WATCH" | "ON_HOLD" | "DROPPED";
      } | null = null;
      if (typeof tx.userTitle?.findUnique === "function") {
        existingUserTitle = (await tx.userTitle.findUnique({
          where: {
            userId_titleId: {
              userId,
              titleId: title.id,
            },
          },
        })) as {
          id: string;
          status: "WATCHED" | "WATCHING" | "PLAN_TO_WATCH" | "ON_HOLD" | "DROPPED";
        } | null;
      }

      // 4. Update episode progress record
      if (watched) {
        await tx.userEpisode.upsert({
          where: {
            userId_episodeId: {
              userId,
              episodeId: episode.id,
            },
          },
          update: {
            watchedAt: new Date(),
          },
          create: {
            userId,
            episodeId: episode.id,
            watchedAt: new Date(),
          },
        });

        // 5. Update parent UserTitle relationship (move to WATCHING if untracked or PLAN_TO_WATCH)
        if (!existingUserTitle) {
          statusTransitioned = true;
          previousStatus = null;
        } else if (existingUserTitle.status === "PLAN_TO_WATCH") {
          statusTransitioned = true;
          previousStatus = "PLAN_TO_WATCH";
        } else {
          statusTransitioned = false;
          previousStatus = existingUserTitle.status;
        }

        const targetStatus = revertStatus ?? "WATCHING";
        currentStatus = targetStatus;

        await tx.userTitle.upsert({
          where: {
            userId_titleId: {
              userId,
              titleId: title.id,
            },
          },
          update: {
            status: targetStatus,
            updatedAt: new Date(),
          },
          create: {
            userId,
            titleId: title.id,
            status: targetStatus,
            startedAt: new Date(),
          },
        });

        // 6. Record audit action in WatchHistory
        await tx.watchHistory.create({
          data: {
            userId,
            titleId: title.id,
            episodeId: episode.id,
            action: "EPISODE_WATCHED",
            occurredAt: new Date(),
          },
        });
      } else {
        await tx.userEpisode.deleteMany({
          where: {
            userId,
            episodeId: episode.id,
          },
        });

        if (revertStatus) {
          await tx.userTitle.upsert({
            where: {
              userId_titleId: {
                userId,
                titleId: title.id,
              },
            },
            update: {
              status: revertStatus,
              updatedAt: new Date(),
            },
            create: {
              userId,
              titleId: title.id,
              status: revertStatus,
              startedAt: new Date(),
            },
          });
          currentStatus = revertStatus;
        } else if (existingUserTitle) {
          currentStatus = existingUserTitle.status;
        }

        await tx.watchHistory.create({
          data: {
            userId,
            titleId: title.id,
            episodeId: episode.id,
            action: "EPISODE_UNWATCHED",
            occurredAt: new Date(),
          },
        });
      }
    });

    // Revalidate affected routes
    revalidatePath(`/title/${titleExternalSource}:${titleExternalId}`);
    revalidatePath(`/title/demo-${titleExternalSource}-${titleExternalId}`);
    revalidatePath("/");
    revalidatePath("/library");
    revalidatePath("/history");

    return {
      success: true,
      watched,
      seasonNumber,
      episodeNumber,
      statusTransitioned,
      previousStatus,
      status: currentStatus,
    };
  } catch (error) {
    safeLogger.error("[TrackingAction] Failed to update episode progress:", error);
    return {
      success: false,
      error: sanitizeErrorMessage(
        error instanceof Error ? error.message : "Database mutation failed",
      ),
    };
  }
}

/**
 * Server action to batch-update progress for an entire season (Day 20)
 */
export async function batchSeasonProgressAction(
  rawInput: BatchSeasonInput,
): Promise<TrackingActionResult> {
  const parsed = batchSeasonSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid batch season input: " + parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const {
    titleExternalSource,
    titleExternalId,
    seasonNumber,
    watched,
    episodeNumbers,
    titleName,
    mediaType,
  } = parsed.data;

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      success: true,
      watched,
      seasonNumber,
      count: episodeNumbers.length,
      isDemo: true,
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Ensure Title exists
      const title = await tx.title.upsert({
        where: {
          externalSource_externalId: {
            externalSource: titleExternalSource,
            externalId: titleExternalId,
          },
        },
        update: {},
        create: {
          externalSource: titleExternalSource,
          externalId: titleExternalId,
          title: titleName || `${titleExternalSource}:${titleExternalId}`,
          type: mediaType || "TV",
        },
      });

      // 2. Ensure Season exists
      const season = await tx.season.upsert({
        where: {
          titleId_seasonNumber: {
            titleId: title.id,
            seasonNumber,
          },
        },
        update: {},
        create: {
          titleId: title.id,
          seasonNumber,
          name: `Season ${seasonNumber}`,
          episodeCount: episodeNumbers.length,
        },
      });

      // 3. Upsert all episodes in this season
      const episodeIds: string[] = [];
      for (const epNum of episodeNumbers) {
        const ep = await tx.episode.upsert({
          where: {
            seasonId_episodeNumber: {
              seasonId: season.id,
              episodeNumber: epNum,
            },
          },
          update: {},
          create: {
            seasonId: season.id,
            episodeNumber: epNum,
            name: `Episode ${epNum}`,
          },
        });
        episodeIds.push(ep.id);
      }

      // 4. Batch update UserEpisode records
      if (watched) {
        for (const epId of episodeIds) {
          await tx.userEpisode.upsert({
            where: {
              userId_episodeId: {
                userId,
                episodeId: epId,
              },
            },
            update: {
              watchedAt: new Date(),
            },
            create: {
              userId,
              episodeId: epId,
              watchedAt: new Date(),
            },
          });
        }

        await tx.userTitle.upsert({
          where: {
            userId_titleId: {
              userId,
              titleId: title.id,
            },
          },
          update: {
            status: "WATCHING",
            updatedAt: new Date(),
          },
          create: {
            userId,
            titleId: title.id,
            status: "WATCHING",
            startedAt: new Date(),
          },
        });

        await tx.watchHistory.create({
          data: {
            userId,
            titleId: title.id,
            action: `SEASON_${seasonNumber}_WATCHED`,
            occurredAt: new Date(),
          },
        });
      } else {
        await tx.userEpisode.deleteMany({
          where: {
            userId,
            episodeId: { in: episodeIds },
          },
        });

        await tx.watchHistory.create({
          data: {
            userId,
            titleId: title.id,
            action: `SEASON_${seasonNumber}_UNWATCHED`,
            occurredAt: new Date(),
          },
        });
      }
    });

    revalidatePath(`/title/${titleExternalSource}:${titleExternalId}`);
    revalidatePath(`/title/demo-${titleExternalSource}-${titleExternalId}`);
    revalidatePath("/");
    revalidatePath("/library");

    return {
      success: true,
      watched,
      seasonNumber,
      count: episodeNumbers.length,
    };
  } catch (error) {
    safeLogger.error("[TrackingAction] Failed to batch update season:", error);
    return {
      success: false,
      error: sanitizeErrorMessage(
        error instanceof Error ? error.message : "Database batch mutation failed",
      ),
    };
  }
}

/**
 * Server action to update watch status for a title on the user's shelf (Day 22)
 * Supports: WATCHED, WATCHING, PLAN_TO_WATCH, ON_HOLD, DROPPED, or null (remove from shelf).
 * Atomic transaction ensures Title exists, updates UserTitle with appropriate timestamps,
 * logs action in WatchHistory, and revalidates relevant routes.
 */
export async function updateTitleStatusAction(
  rawInput: UpdateTitleStatusInput,
): Promise<TrackingActionResult> {
  const parsed = updateTitleStatusSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid status update input: " + parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const {
    titleExternalSource,
    titleExternalId,
    status,
    titleName,
    mediaType,
    rating,
    startedAt,
    watchedAt,
    seasons,
  } = parsed.data;

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      success: true,
      status,
      isDemo: true,
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Ensure Title exists in database
      const title = await tx.title.upsert({
        where: {
          externalSource_externalId: {
            externalSource: titleExternalSource,
            externalId: titleExternalId,
          },
        },
        update: {},
        create: {
          externalSource: titleExternalSource,
          externalId: titleExternalId,
          title: titleName || `${titleExternalSource}:${titleExternalId}`,
          type: mediaType || "TV",
        },
      });

      // 1.5. Persist season summaries for episodic TV/anime titles (Day 30)
      if (status !== null && seasons && seasons.length > 0) {
        await persistTitleSeasons(tx, title.id, seasons);
      }

      // 2. If status is null, untrack / remove title from shelf
      if (status === null) {
        await tx.userTitle.deleteMany({
          where: {
            userId,
            titleId: title.id,
          },
        });

        await tx.watchHistory.create({
          data: {
            userId,
            titleId: title.id,
            action: "TITLE_REMOVED",
            occurredAt: new Date(),
          },
        });
      } else {
        // 3. Status is being set or updated
        const existing = await tx.userTitle.findUnique({
          where: {
            userId_titleId: {
              userId,
              titleId: title.id,
            },
          },
        });

        const now = new Date();
        const explicitWatchedAt = watchedAt
          ? new Date(watchedAt)
          : watchedAt === null
            ? null
            : undefined;
        const explicitStartedAt = startedAt
          ? new Date(startedAt)
          : startedAt === null
            ? null
            : undefined;

        const finalWatchedAt =
          explicitWatchedAt !== undefined
            ? explicitWatchedAt
            : status === "WATCHED"
              ? existing?.watchedAt || now
              : existing?.watchedAt;

        const finalStartedAt =
          explicitStartedAt !== undefined
            ? explicitStartedAt
            : status === "WATCHING"
              ? existing?.startedAt || now
              : existing?.startedAt;

        await tx.userTitle.upsert({
          where: {
            userId_titleId: {
              userId,
              titleId: title.id,
            },
          },
          update: {
            status,
            ...(rating !== undefined ? { rating } : {}),
            watchedAt: finalWatchedAt,
            startedAt: finalStartedAt,
            updatedAt: now,
          },
          create: {
            userId,
            titleId: title.id,
            status,
            rating: rating ?? null,
            watchedAt:
              explicitWatchedAt !== undefined
                ? explicitWatchedAt
                : status === "WATCHED"
                  ? now
                  : null,
            startedAt:
              explicitStartedAt !== undefined
                ? explicitStartedAt
                : status === "WATCHING"
                  ? now
                  : null,
          },
        });

        await tx.watchHistory.create({
          data: {
            userId,
            titleId: title.id,
            action: `STATUS_${status}`,
            occurredAt: now,
          },
        });
      }
    });

    revalidatePath(`/title/${titleExternalSource}:${titleExternalId}`);
    revalidatePath(`/title/demo-${titleExternalSource}-${titleExternalId}`);
    revalidatePath("/");
    revalidatePath("/library");
    revalidatePath("/watchlist");
    revalidatePath("/history");

    return {
      success: true,
      status,
    };
  } catch (error) {
    safeLogger.error("[TrackingAction] Failed to update title status:", error);
    return {
      success: false,
      error: sanitizeErrorMessage(
        error instanceof Error ? error.message : "Database status mutation failed",
      ),
    };
  }
}

/**
 * Server action to update personal 1–10 rating for a title on the user's shelf (Day 24)
 * Supports: rating 1 to 10, or null (clear rating).
 * Atomically ensures Title exists, updates UserTitle rating (creating UserTitle if not tracked yet),
 * logs action in WatchHistory, and revalidates relevant routes.
 */
export async function updateTitleRatingAction(
  rawInput: UpdateTitleRatingInput,
): Promise<TrackingActionResult> {
  const parsed = updateTitleRatingSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid rating input: " + parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { titleExternalSource, titleExternalId, rating, titleName, mediaType } = parsed.data;

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      success: true,
      rating,
      isDemo: true,
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Ensure Title exists in database
      const title = await tx.title.upsert({
        where: {
          externalSource_externalId: {
            externalSource: titleExternalSource,
            externalId: titleExternalId,
          },
        },
        update: {},
        create: {
          externalSource: titleExternalSource,
          externalId: titleExternalId,
          title: titleName || `${titleExternalSource}:${titleExternalId}`,
          type: mediaType || "TV",
        },
      });

      const now = new Date();

      if (rating === null) {
        // Clear rating on existing UserTitle
        await tx.userTitle.updateMany({
          where: {
            userId,
            titleId: title.id,
          },
          data: {
            rating: null,
            updatedAt: now,
          },
        });

        await tx.watchHistory.create({
          data: {
            userId,
            titleId: title.id,
            action: "RATING_CLEARED",
            occurredAt: now,
          },
        });
      } else {
        // Upsert UserTitle with rating. If not tracked yet, default status to WATCHED
        await tx.userTitle.upsert({
          where: {
            userId_titleId: {
              userId,
              titleId: title.id,
            },
          },
          update: {
            rating,
            updatedAt: now,
          },
          create: {
            userId,
            titleId: title.id,
            status: "WATCHED",
            rating,
            watchedAt: now,
            startedAt: now,
          },
        });

        await tx.watchHistory.create({
          data: {
            userId,
            titleId: title.id,
            action: `RATED_${rating}`,
            occurredAt: now,
          },
        });
      }
    });

    revalidatePath(`/title/${titleExternalSource}:${titleExternalId}`);
    revalidatePath(`/title/demo-${titleExternalSource}-${titleExternalId}`);
    revalidatePath("/");
    revalidatePath("/library");
    revalidatePath("/watchlist");
    revalidatePath("/history");

    return {
      success: true,
      rating,
    };
  } catch (error) {
    safeLogger.error("[TrackingAction] Failed to update title rating:", error);
    return {
      success: false,
      error: sanitizeErrorMessage(
        error instanceof Error ? error.message : "Database rating mutation failed",
      ),
    };
  }
}

/**
 * Server action to update optional watchedAt and startedAt dates for a title on the user's shelf (Day 25)
 * Atomically ensures Title exists, updates UserTitle dates,
 * logs action in WatchHistory, and revalidates relevant routes.
 */
export async function updateTitleDatesAction(
  rawInput: UpdateTitleDatesInput,
): Promise<TrackingActionResult> {
  const parsed = updateTitleDatesSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid date input: " + parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { titleExternalSource, titleExternalId, startedAt, watchedAt, titleName, mediaType } =
    parsed.data;

  const session = await auth();
  const userId = session?.user?.id;

  const parsedStartedAt = startedAt ? new Date(startedAt) : startedAt === null ? null : undefined;
  const parsedWatchedAt = watchedAt ? new Date(watchedAt) : watchedAt === null ? null : undefined;

  if (!userId) {
    return {
      success: true,
      startedAt: parsedStartedAt ?? null,
      watchedAt: parsedWatchedAt ?? null,
      isDemo: true,
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Ensure Title exists in database
      const title = await tx.title.upsert({
        where: {
          externalSource_externalId: {
            externalSource: titleExternalSource,
            externalId: titleExternalId,
          },
        },
        update: {},
        create: {
          externalSource: titleExternalSource,
          externalId: titleExternalId,
          title: titleName || `${titleExternalSource}:${titleExternalId}`,
          type: mediaType || "TV",
        },
      });

      const now = new Date();

      await tx.userTitle.upsert({
        where: {
          userId_titleId: {
            userId,
            titleId: title.id,
          },
        },
        update: {
          ...(parsedStartedAt !== undefined ? { startedAt: parsedStartedAt } : {}),
          ...(parsedWatchedAt !== undefined ? { watchedAt: parsedWatchedAt } : {}),
          updatedAt: now,
        },
        create: {
          userId,
          titleId: title.id,
          status: parsedWatchedAt ? "WATCHED" : parsedStartedAt ? "WATCHING" : "PLAN_TO_WATCH",
          startedAt: parsedStartedAt ?? null,
          watchedAt: parsedWatchedAt ?? null,
        },
      });

      await tx.watchHistory.create({
        data: {
          userId,
          titleId: title.id,
          action: "DATES_UPDATED",
          occurredAt: now,
        },
      });
    });

    revalidatePath(`/title/${titleExternalSource}:${titleExternalId}`);
    revalidatePath(`/title/demo-${titleExternalSource}-${titleExternalId}`);
    revalidatePath("/");
    revalidatePath("/library");
    revalidatePath("/watchlist");
    revalidatePath("/history");

    return {
      success: true,
      startedAt: parsedStartedAt ?? null,
      watchedAt: parsedWatchedAt ?? null,
    };
  } catch (error) {
    safeLogger.error("[TrackingAction] Failed to update title dates:", error);
    return {
      success: false,
      error: sanitizeErrorMessage(
        error instanceof Error ? error.message : "Database date mutation failed",
      ),
    };
  }
}

/**
 * Server action to persist season summaries for a TV or anime title (Day 30).
 * Supports selective season persistence to avoid importing unnecessary records upfront.
 */
export async function syncTitleSeasonsAction(
  rawInput: SyncTitleSeasonsInput,
): Promise<TrackingActionResult> {
  const parsed = syncTitleSeasonsSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid season sync input: " + parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const {
    titleExternalSource,
    titleExternalId,
    titleName,
    mediaType,
    seasons,
    selectedSeasonNumber,
  } = parsed.data;

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    const targetSeasons =
      selectedSeasonNumber !== undefined
        ? seasons.filter((s) => s.seasonNumber === selectedSeasonNumber)
        : seasons;

    return {
      success: true,
      count: targetSeasons.length,
      seasons: targetSeasons.map((s) => ({
        seasonNumber: s.seasonNumber,
        name: s.name ?? null,
        episodeCount: s.episodeCount,
      })),
      isDemo: true,
    };
  }

  try {
    const persisted = await prisma.$transaction(async (tx) => {
      // 1. Ensure Title exists in database
      const title = await tx.title.upsert({
        where: {
          externalSource_externalId: {
            externalSource: titleExternalSource,
            externalId: titleExternalId,
          },
        },
        update: {},
        create: {
          externalSource: titleExternalSource,
          externalId: titleExternalId,
          title: titleName || `${titleExternalSource}:${titleExternalId}`,
          type: mediaType || "TV",
        },
      });

      // 2. Persist season summaries (selectively if selectedSeasonNumber provided)
      return persistTitleSeasons(tx, title.id, seasons, {
        selectiveSeasonNumbers:
          selectedSeasonNumber !== undefined ? [selectedSeasonNumber] : undefined,
      });
    });

    revalidatePath(`/title/${titleExternalSource}:${titleExternalId}`);
    revalidatePath(`/title/demo-${titleExternalSource}-${titleExternalId}`);

    return {
      success: true,
      count: persisted.length,
      seasons: persisted.map((s) => ({
        seasonNumber: s.seasonNumber,
        name: s.name,
        episodeCount: s.episodeCount,
      })),
    };
  } catch (error) {
    safeLogger.error("[TrackingAction] Failed to sync seasons:", error);
    return {
      success: false,
      error: sanitizeErrorMessage(
        error instanceof Error ? error.message : "Database season mutation failed",
      ),
    };
  }
}

/**
 * Server action to persist episode details for a selected season of a TV or anime title (Day 31).
 * Supports selective episode persistence to avoid importing unnecessary records upfront.
 */
export async function syncSeasonEpisodesAction(
  rawInput: SyncSeasonEpisodesInput,
): Promise<TrackingActionResult> {
  const parsed = syncSeasonEpisodesSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid episode sync input: " + parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const {
    titleExternalSource,
    titleExternalId,
    seasonNumber,
    seasonName,
    titleName,
    mediaType,
    episodes,
    selectiveEpisodeNumbers,
  } = parsed.data;

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    const targetEpisodes = selectiveEpisodeNumbers
      ? episodes.filter((ep) => selectiveEpisodeNumbers.includes(ep.episodeNumber))
      : episodes;

    return {
      success: true,
      count: targetEpisodes.length,
      seasonNumber,
      episodes: targetEpisodes.map((ep) => ({
        episodeNumber: ep.episodeNumber,
        name: ep.name ?? null,
        airDate: ep.airDate ?? null,
        runtime: ep.runtime ?? null,
      })),
      isDemo: true,
    };
  }

  try {
    const persisted = await prisma.$transaction(async (tx) => {
      // 1. Ensure Title exists in database
      const title = await tx.title.upsert({
        where: {
          externalSource_externalId: {
            externalSource: titleExternalSource,
            externalId: titleExternalId,
          },
        },
        update: {},
        create: {
          externalSource: titleExternalSource,
          externalId: titleExternalId,
          title: titleName || `${titleExternalSource}:${titleExternalId}`,
          type: mediaType || "TV",
        },
      });

      // 2. Ensure Season exists in database
      const season = await ensureSeasonRecord(tx, title.id, seasonNumber, {
        name: seasonName,
        episodeCount: episodes.length,
      });

      // 3. Persist episodes for this season
      return persistSeasonEpisodes(tx, season.id, episodes, {
        selectiveEpisodeNumbers,
        updateSeasonCount: true,
      });
    });

    revalidatePath(`/title/${titleExternalSource}:${titleExternalId}`);
    revalidatePath(`/title/demo-${titleExternalSource}-${titleExternalId}`);

    return {
      success: true,
      count: persisted.length,
      seasonNumber,
      episodes: persisted.map((ep) => ({
        episodeNumber: ep.episodeNumber,
        name: ep.name,
        airDate: ep.airDate,
        runtime: ep.runtime,
      })),
    };
  } catch (error) {
    safeLogger.error("[TrackingAction] Failed to sync season episodes:", error);
    return {
      success: false,
      error: sanitizeErrorMessage(
        error instanceof Error ? error.message : "Database episode mutation failed",
      ),
    };
  }
}

/**
 * Server action to fetch and optionally cache/persist episode details for a specific season (Day 32).
 * Enables lazy-loading of episodes when navigating season tabs.
 */
export async function fetchSeasonEpisodesAction(
  rawInput: FetchSeasonEpisodesInput,
): Promise<TrackingActionResult> {
  const parsed = fetchSeasonEpisodesSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid fetch season input: " + parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { titleExternalSource, titleExternalId, seasonNumber, titleName, mediaType } = parsed.data;

  try {
    let episodes: Array<{
      episodeNumber: number;
      name: string | null;
      airDate?: string | null;
      runtime?: number | null;
      overview?: string | null;
    }> = [];

    // 1. If TV on TMDB, fetch using metadataService.getTvSeason
    if (titleExternalSource === "tmdb") {
      try {
        const seasonData = await metadataService.getTvSeason(titleExternalId, seasonNumber);
        if (seasonData?.episodes) {
          episodes = seasonData.episodes.map((ep) => ({
            episodeNumber: ep.episodeNumber,
            name: ep.name ?? `Episode ${ep.episodeNumber}`,
            airDate: ep.airDate ?? null,
            runtime: ep.runtime ?? null,
            overview: ep.overview ?? null,
          }));
        }
      } catch (err) {
        console.warn("[TrackingAction] Failed to fetch season from TMDB:", err);
      }
    } else if (titleExternalSource === "anilist") {
      try {
        const titleData = await metadataService.getAnimeDetails(titleExternalId);
        const targetSeason =
          titleData?.seasons?.find((s) => s.seasonNumber === seasonNumber) ||
          titleData?.seasons?.[0];
        if (targetSeason?.episodes) {
          episodes = targetSeason.episodes.map((ep) => ({
            episodeNumber: ep.episodeNumber,
            name: ep.name ?? `Episode ${ep.episodeNumber}`,
            airDate: ep.airDate ?? null,
            runtime: ep.runtime ?? null,
            overview: ep.overview ?? null,
          }));
        }
      } catch (err) {
        console.warn("[TrackingAction] Failed to fetch anime details from AniList:", err);
      }
    }

    // 2. If authenticated and episodes found, persist them lazily (Day 31 storage integration)
    const session = await auth();
    const userId = session?.user?.id;

    if (userId && episodes.length > 0) {
      try {
        await prisma.$transaction(async (tx) => {
          const title = await tx.title.upsert({
            where: {
              externalSource_externalId: {
                externalSource: titleExternalSource,
                externalId: titleExternalId,
              },
            },
            update: {},
            create: {
              externalSource: titleExternalSource,
              externalId: titleExternalId,
              title: titleName || `${titleExternalSource}:${titleExternalId}`,
              type: mediaType || "TV",
            },
          });

          const season = await ensureSeasonRecord(tx, title.id, seasonNumber, {
            episodeCount: episodes.length,
          });

          await persistSeasonEpisodes(tx, season.id, episodes, {
            updateSeasonCount: true,
          });
        });
      } catch (dbErr) {
        console.warn("[TrackingAction] Failed to lazily persist fetched episodes:", dbErr);
      }
    }

    return {
      success: true,
      seasonNumber,
      count: episodes.length,
      episodes,
      isDemo: !userId,
    };
  } catch (error) {
    safeLogger.error("[TrackingAction] Failed to fetch season episodes:", error);
    return {
      success: false,
      error: sanitizeErrorMessage(
        error instanceof Error ? error.message : "Failed to fetch season episodes",
      ),
    };
  }
}
