import { HistoryDayGroup, HistoryItem } from "./types";

/**
 * Maps a stored WatchHistory action string into the human-readable sentence
 * specified in Section 10.7 (Page 41) of the UI/UX Specification.
 */
export function formatHistoryActionSentence(
  action: string,
  meta?: {
    seasonNumber?: number | null;
    episodeNumber?: number | null;
    rating?: number | null;
  },
): string {
  // 1. Status changes
  switch (action) {
    case "STATUS_WATCHED":
      return "Marked as Watched";
    case "STATUS_WATCHING":
      return "Moved to Watching";
    case "STATUS_PLAN_TO_WATCH":
      return "Added to Plan to Watch";
    case "STATUS_ON_HOLD":
      return "Put On Hold";
    case "STATUS_DROPPED":
      return "Dropped";
    case "TITLE_REMOVED":
      return "Removed from shelf";
    case "DATES_UPDATED":
      return "Updated watch dates";
    case "RATING_CLEARED":
      return "Cleared rating";
  }

  // 2. Rating actions: RATED_{x}
  if (action.startsWith("RATED_")) {
    const score = action.replace("RATED_", "");
    return `Rated ${score}/10`;
  }

  // 3. Episode actions: EPISODE_WATCHED, EPISODE_UNWATCHED
  if (action === "EPISODE_WATCHED") {
    if (meta?.seasonNumber && meta?.episodeNumber) {
      return `Watched S${meta.seasonNumber} E${meta.episodeNumber}`;
    }
    if (meta?.episodeNumber) {
      return `Watched Ep ${meta.episodeNumber}`;
    }
    return "Watched episode";
  }

  if (action === "EPISODE_UNWATCHED") {
    if (meta?.seasonNumber && meta?.episodeNumber) {
      return `Unmarked S${meta.seasonNumber} E${meta.episodeNumber}`;
    }
    if (meta?.episodeNumber) {
      return `Unmarked Ep ${meta.episodeNumber}`;
    }
    return "Unmarked episode";
  }

  // 4. Batch season actions: SEASON_{s}_WATCHED, SEASON_{s}_UNWATCHED
  const seasonWatchedMatch = action.match(/^SEASON_(\d+)_WATCHED$/);
  if (seasonWatchedMatch) {
    return `Finished season ${seasonWatchedMatch[1]}`;
  }

  const seasonUnwatchedMatch = action.match(/^SEASON_(\d+)_UNWATCHED$/);
  if (seasonUnwatchedMatch) {
    return `Unmarked season ${seasonUnwatchedMatch[1]}`;
  }

  // Fallback
  return action.replace(/_/g, " ").toLowerCase();
}

/**
 * Formats a Date into local time string: e.g. "7:42 PM".
 */
export function formatHistoryTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Formats a Date into a day group heading: e.g. "TODAY", "YESTERDAY", or "OCT 7, 2026".
 */
export function formatDayGroupHeading(date: Date | string): { dayLabel: string; dateKey: string } {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return { dayLabel: "OLDER", dateKey: "older" };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today.getTime() - targetDay.getTime()) / (1000 * 60 * 60 * 24));

  const yearMonthDayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  if (diffDays === 0) {
    return { dayLabel: "TODAY", dateKey: yearMonthDayKey };
  }
  if (diffDays === 1) {
    return { dayLabel: "YESTERDAY", dateKey: yearMonthDayKey };
  }

  const formattedMonthDay = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });

  return { dayLabel: formattedMonthDay.toUpperCase(), dateKey: yearMonthDayKey };
}

/**
 * Groups an array of history items by calendar day in descending order.
 */
export function groupHistoryByDay(items: HistoryItem[]): HistoryDayGroup[] {
  const groupMap = new Map<string, HistoryDayGroup>();

  for (const item of items) {
    const { dayLabel, dateKey } = formatDayGroupHeading(item.occurredAt);

    if (!groupMap.has(dateKey)) {
      groupMap.set(dateKey, {
        dayLabel,
        dateKey,
        items: [],
      });
    }

    groupMap.get(dateKey)!.items.push(item);
  }

  return Array.from(groupMap.values());
}
