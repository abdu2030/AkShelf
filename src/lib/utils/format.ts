/**
 * Formats a 1-10 rating into a display string.
 */
export function formatRating(rating: number | null | undefined): string {
  if (rating === null || rating === undefined) {
    return "Unrated";
  }
  return `${rating.toFixed(1).replace(/\.0$/, "")}/10`;
}

/**
 * Calculates episode completion percentage (0 - 100).
 */
export function calculateProgressPercentage(
  watchedEpisodes: number,
  totalEpisodes: number,
): number {
  if (!totalEpisodes || totalEpisodes <= 0) {
    return 0;
  }
  const clamped = Math.max(0, Math.min(watchedEpisodes, totalEpisodes));
  return Math.round((clamped / totalEpisodes) * 100);
}

/**
 * Formats MediaType enum into human-friendly label.
 */
export function formatMediaType(type: "MOVIE" | "TV" | "ANIME"): string {
  switch (type) {
    case "MOVIE":
      return "Movie";
    case "TV":
      return "TV Show";
    case "ANIME":
      return "Anime";
    default:
      return type;
  }
}

/**
 * Formats season and episode into S1 E4 or Ep 4 display string.
 */
export function formatEpisodePosition(season?: number | null, episode?: number | null): string {
  if (season !== undefined && season !== null && episode !== undefined && episode !== null) {
    return `S${season} E${episode}`;
  }
  if (episode !== undefined && episode !== null) {
    return `Ep ${episode}`;
  }
  return "";
}

/**
 * Formats a Date or date string into human-friendly representation (Spec P14).
 * e.g., 'Oct 9, 2026', 'Today', or 'Yesterday'.
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today.getTime() - targetDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Converts a Date or date string into YYYY-MM-DD format for HTML date inputs.
 */
export function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}
