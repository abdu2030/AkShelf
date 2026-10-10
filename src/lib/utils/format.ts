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
