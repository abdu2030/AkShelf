import { prisma } from "@/lib/db";
import { computeSeriesProgress, type ProgressSeasonItem } from "./service";

/** Heal legacy WATCHING records only after verifying the full provider catalog. */
export async function repairCompletedTitle(
  userId: string,
  titleId: string,
  verifiedSeasons: ProgressSeasonItem[] | null,
  watchedMap: Record<string, boolean>,
) {
  if (!verifiedSeasons || !computeSeriesProgress(verifiedSeasons, watchedMap).isCompleted)
    return null;
  const where = { userId_titleId: { userId, titleId } };
  const current = await prisma.userTitle.findUnique({ where });
  // Keep deliberate On Hold, Dropped, Planned and already-Watched decisions.
  if (!current || current.status !== "WATCHING") return current;
  const episodes = await prisma.userEpisode.findMany({
    where: { userId, episode: { season: { titleId } } },
    select: {
      watchedAt: true,
      episode: { select: { episodeNumber: true, season: { select: { seasonNumber: true } } } },
    },
  });
  const currentMap = Object.fromEntries(
    episodes.map(({ episode }) => [
      `${episode.season.seasonNumber}:${episode.episodeNumber}`,
      true,
    ]),
  );
  if (!computeSeriesProgress(verifiedSeasons, currentMap).isCompleted) return current;
  const watchedAt =
    current.watchedAt ??
    new Date(Math.max(...episodes.map((episode) => episode.watchedAt.getTime())));
  const updated = await prisma.userTitle.updateMany({
    where: { id: current.id, userId, status: "WATCHING", updatedAt: current.updatedAt },
    data: { status: "WATCHED", watchedAt },
  });
  // A concurrent episode/status edit wins; never present an unpersisted status.
  return updated.count === 1
    ? { ...current, status: "WATCHED" as const, watchedAt }
    : prisma.userTitle.findUnique({ where });
}
