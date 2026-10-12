"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  batchSeasonSchema,
  toggleEpisodeSchema,
  ToggleEpisodeInput,
  BatchSeasonInput,
} from "@/lib/validation/tracking";

export type TrackingActionResult = {
  success: boolean;
  error?: string;
  watched?: boolean;
  seasonNumber?: number;
  episodeNumber?: number;
  count?: number;
  isDemo?: boolean;
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

        // 5. Update parent UserTitle relationship (move to WATCHING if not already tracked)
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

    return {
      success: true,
      watched,
      seasonNumber,
      episodeNumber,
    };
  } catch (error) {
    console.error("[TrackingAction] Failed to update episode progress:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Database mutation failed",
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
    console.error("[TrackingAction] Failed to batch update season:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Database batch mutation failed",
    };
  }
}
