import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { demoTitles } from "@/lib/data/demo-titles";
import { HistoryItem } from "./types";
import { formatHistoryActionSentence, formatHistoryTime } from "./format";

export interface GetWatchHistoryOptions {
  typeFilter?: "ALL" | "MOVIE" | "TV" | "ANIME";
  limit?: number;
  offset?: number;
}

export interface GetWatchHistoryResult {
  items: HistoryItem[];
  totalCount: number;
  hasMore: boolean;
}

/**
 * Generates synthetic history items from demo titles for guest/demo browsing.
 */
function getDemoHistoryItems(): HistoryItem[] {
  const baseDate = new Date();

  // Create demo activity distributed over the last few days
  const demoEvents: Array<{
    titleIndex: number;
    action: string;
    daysAgo: number;
    hoursAgo: number;
    seasonNumber?: number;
    episodeNumber?: number;
    rating?: number;
    status?: string;
  }> = [
    {
      titleIndex: 9, // Breaking Bad
      action: "EPISODE_WATCHED",
      daysAgo: 0,
      hoursAgo: 2,
      seasonNumber: 1,
      episodeNumber: 6,
      status: "WATCHING",
    },
    {
      titleIndex: 0, // Inception
      action: "RATED_9.5",
      daysAgo: 0,
      hoursAgo: 4,
      rating: 9.5,
      status: "WATCHED",
    },
    {
      titleIndex: 0, // Inception
      action: "STATUS_WATCHED",
      daysAgo: 1,
      hoursAgo: 22,
      status: "WATCHED",
      rating: 9.5,
    },
    {
      titleIndex: 18, // Attack on Titan
      action: "EPISODE_WATCHED",
      daysAgo: 1,
      hoursAgo: 26,
      seasonNumber: 1,
      episodeNumber: 4,
      status: "WATCHING",
    },
    {
      titleIndex: 1, // Interstellar
      action: "STATUS_WATCHED",
      daysAgo: 3,
      hoursAgo: 70,
      status: "WATCHED",
      rating: 9.0,
    },
    {
      titleIndex: 1, // Interstellar
      action: "RATED_9",
      daysAgo: 3,
      hoursAgo: 71,
      rating: 9.0,
      status: "WATCHED",
    },
    {
      titleIndex: 10, // Arcane
      action: "SEASON_1_WATCHED",
      daysAgo: 5,
      hoursAgo: 120,
      seasonNumber: 1,
      status: "WATCHING",
    },
    {
      titleIndex: 19, // Spirited Away
      action: "STATUS_WATCHED",
      daysAgo: 7,
      hoursAgo: 168,
      status: "WATCHED",
      rating: 9.5,
    },
    {
      titleIndex: 20, // Demon Slayer
      action: "STATUS_PLAN_TO_WATCH",
      daysAgo: 8,
      hoursAgo: 192,
      status: "PLAN_TO_WATCH",
    },
  ];

  return demoEvents.map((evt, idx) => {
    const title = demoTitles[evt.titleIndex] || demoTitles[0];
    const eventTime = new Date(
      baseDate.getTime() - (evt.daysAgo * 86400000 + evt.hoursAgo * 3600000),
    );

    const actionSentence = formatHistoryActionSentence(evt.action, {
      seasonNumber: evt.seasonNumber,
      episodeNumber: evt.episodeNumber,
      rating: evt.rating,
    });

    return {
      id: `demo-hist-${idx + 1}`,
      titleId: `demo-${title.externalSource}-${title.externalId}`,
      titleName: title.title,
      titleExternalSource: title.externalSource,
      titleExternalId: title.externalId,
      mediaType: title.type,
      posterUrl: title.posterUrl,
      action: evt.action,
      actionSentence,
      status: evt.status || title.status,
      rating: evt.rating ?? title.rating ?? null,
      seasonNumber: evt.seasonNumber ?? null,
      episodeNumber: evt.episodeNumber ?? null,
      occurredAt: eventTime.toISOString(),
      timeFormatted: formatHistoryTime(eventTime),
    };
  });
}

/**
 * Retrieves chronological watch history, newest first.
 * Supports media type filtering and pagination.
 */
export async function getWatchHistory(
  options: GetWatchHistoryOptions = {},
): Promise<GetWatchHistoryResult> {
  const { typeFilter = "ALL", limit = 50, offset = 0 } = options;

  const session = await auth();
  const userId = session?.user?.id;

  // 1. If not authenticated or database has no rows for user, fallback to demo history
  if (!userId) {
    let demoItems = getDemoHistoryItems();

    if (typeFilter && typeFilter !== "ALL") {
      demoItems = demoItems.filter((i) => i.mediaType === typeFilter);
    }

    const totalCount = demoItems.length;
    const paginated = demoItems.slice(offset, offset + limit);

    return {
      items: paginated,
      totalCount,
      hasMore: offset + limit < totalCount,
    };
  }

  // 2. Query real database history for authenticated user
  try {
    const whereClause: {
      userId: string;
      title?: { type: "MOVIE" | "TV" | "ANIME" };
    } = { userId };

    if (typeFilter && typeFilter !== "ALL") {
      whereClause.title = { type: typeFilter };
    }

    const [dbEntries, totalCount] = await Promise.all([
      prisma.watchHistory.findMany({
        where: whereClause,
        orderBy: { occurredAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          title: true,
          episode: {
            include: {
              season: true,
            },
          },
        },
      }),
      prisma.watchHistory.count({ where: whereClause }),
    ]);

    // If authenticated user has no activity yet, return empty list (genuine empty state)
    if (totalCount === 0) {
      return {
        items: [],
        totalCount: 0,
        hasMore: false,
      };
    }

    const items: HistoryItem[] = dbEntries.map((entry) => {
      const seasonNumber = entry.episode?.season?.seasonNumber ?? null;
      const episodeNumber = entry.episode?.episodeNumber ?? null;

      // Extract rating if action is RATED_{x}
      let rating: number | null = null;
      if (entry.action.startsWith("RATED_")) {
        const parsedRating = parseFloat(entry.action.replace("RATED_", ""));
        if (!isNaN(parsedRating)) rating = parsedRating;
      }

      // Extract status if action is STATUS_{s}
      let status: string | null = null;
      if (entry.action.startsWith("STATUS_")) {
        status = entry.action.replace("STATUS_", "");
      }

      const actionSentence = formatHistoryActionSentence(entry.action, {
        seasonNumber,
        episodeNumber,
        rating,
      });

      return {
        id: entry.id,
        titleId: entry.titleId,
        titleName: entry.title.title,
        titleExternalSource: entry.title.externalSource,
        titleExternalId: entry.title.externalId,
        mediaType: entry.title.type as "MOVIE" | "TV" | "ANIME",
        posterUrl: entry.title.posterUrl,
        action: entry.action,
        actionSentence,
        status,
        rating,
        seasonNumber,
        episodeNumber,
        occurredAt: entry.occurredAt.toISOString(),
        timeFormatted: formatHistoryTime(entry.occurredAt),
      };
    });

    return {
      items,
      totalCount,
      hasMore: offset + limit < totalCount,
    };
  } catch (err) {
    console.error("[getWatchHistory] Error fetching watch history:", err);

    // Resilient fallback to demo items if database error occurs
    let demoItems = getDemoHistoryItems();
    if (typeFilter && typeFilter !== "ALL") {
      demoItems = demoItems.filter((i) => i.mediaType === typeFilter);
    }

    return {
      items: demoItems.slice(offset, offset + limit),
      totalCount: demoItems.length,
      hasMore: offset + limit < demoItems.length,
    };
  }
}
