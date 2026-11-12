import type { Prisma, WatchStatus } from "@prisma/client";
import { metadataService } from "@/lib/metadata/service";
import type { ExternalSource, MediaType, NormalizedSeason } from "@/lib/metadata/types";
import { computeSeriesProgress } from "./service";

export async function loadCompletionSeasons(
  source: ExternalSource,
  id: string,
  type?: MediaType,
): Promise<NormalizedSeason[] | null> {
  try {
    return await metadataService.getTitleSeasons(source, id, type);
  } catch {
    // Recording progress must still work during a provider outage. Unknown
    // season totals cannot establish that a whole series is complete.
    return null;
  }
}

/** Reconcile the parent status after writing this user's episode progress. */
export async function reconcileEpisodeStatus(
  tx: Prisma.TransactionClient,
  userId: string,
  titleId: string,
  watched: boolean,
  seasons: NormalizedSeason[] | null,
  revertStatus?: WatchStatus | null,
) {
  const previous = await tx.userTitle.findUnique({
    where: { userId_titleId: { userId, titleId } },
  });
  const progress = await tx.userEpisode.findMany({
    where: { userId, episode: { season: { titleId } } },
    select: {
      episode: { select: { episodeNumber: true, season: { select: { seasonNumber: true } } } },
    },
  });
  const watchedMap = Object.fromEntries(
    progress.map(({ episode }) => [
      `${episode.season.seasonNumber}:${episode.episodeNumber}`,
      true,
    ]),
  );
  const completed = computeSeriesProgress(
    seasons?.filter((season) => season.seasonNumber > 0) ?? [],
    watchedMap,
  ).isCompleted;
  const status: WatchStatus =
    revertStatus ??
    (watched
      ? previous?.status === "WATCHED" || completed
        ? "WATCHED"
        : "WATCHING"
      : progress.length > 0
        ? "WATCHING"
        : "PLAN_TO_WATCH");
  const now = new Date();
  const watchedAt = status === "WATCHED" ? (previous?.watchedAt ?? now) : null;
  await tx.userTitle.upsert({
    where: { userId_titleId: { userId, titleId } },
    update: { status, watchedAt },
    create: { userId, titleId, status, watchedAt, startedAt: watched ? now : null },
  });
  return {
    status,
    previousStatus: previous?.status ?? null,
    statusTransitioned: previous?.status !== status,
  };
}
