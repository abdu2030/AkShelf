import { AniListMedia } from "@/lib/anilist";
import { MediaResult, NormalizedEpisode, NormalizedSeason } from "../types";

/**
 * Normalizes AniList anime episodes into standard NormalizedEpisode models.
 * Combines available streamingEpisodes metadata with total episode counts and runtimes.
 */
export function aniListMediaToNormalizedEpisodes(media: AniListMedia): NormalizedEpisode[] {
  const count =
    media.episodes && media.episodes > 0
      ? media.episodes
      : media.streamingEpisodes?.length
        ? media.streamingEpisodes.length
        : 1;

  const episodes: NormalizedEpisode[] = [];
  const streaming = media.streamingEpisodes || [];

  for (let i = 1; i <= count; i++) {
    const stream = streaming[i - 1];
    let title = `Episode ${i}`;
    let thumbnail: string | null = null;
    let externalId: string | null = `${media.id}-ep-${i}`;

    if (stream) {
      if (stream.title && stream.title.trim()) {
        title = stream.title.trim();
      }
      if (stream.thumbnail) {
        thumbnail = stream.thumbnail;
      }
      if (stream.url) {
        externalId = stream.url;
      }
    }

    episodes.push({
      externalId,
      episodeNumber: i,
      seasonNumber: 1,
      name: title,
      airDate: i === 1 ? formatFuzzyDate(media.startDate) : null,
      runtime: media.duration ?? null,
      overview: null,
      stillUrl: thumbnail,
    });
  }

  return episodes;
}

/**
 * Normalizes AniList anime series into standard NormalizedSeason breakdown.
 * Movies do not receive episodic season structures; TV/ONA/OVA series receive Season 1.
 */
export function aniListMediaToNormalizedSeasons(media: AniListMedia): NormalizedSeason[] {
  if (media.format === "MOVIE") {
    return [];
  }

  const episodes = aniListMediaToNormalizedEpisodes(media);

  return [
    {
      seasonNumber: 1,
      name: "Season 1",
      episodeCount: episodes.length,
      overview: cleanAniListDescription(media.description),
      posterUrl:
        media.coverImage?.extraLarge || media.coverImage?.large || media.coverImage?.medium || null,
      airDate: formatFuzzyDate(media.startDate),
      episodes,
    },
  ];
}

/**
 * Strips HTML formatting tags from AniList descriptions.
 */
export function cleanAniListDescription(description?: string | null): string | null {
  if (!description) return null;

  return description
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<p>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Formats AniList status string to title-cased display status.
 */
export function formatAniListStatus(status?: string | null): string | null {
  if (!status) return null;
  switch (status.toUpperCase()) {
    case "FINISHED":
      return "Finished";
    case "RELEASING":
      return "Releasing";
    case "NOT_YET_RELEASED":
      return "Not Yet Released";
    case "CANCELLED":
      return "Cancelled";
    case "HIATUS":
      return "On Hiatus";
    default:
      return status;
  }
}

/**
 * Constructs an ISO date string (YYYY-MM-DD or YYYY) from AniList fuzzy date.
 */
export function formatFuzzyDate(
  date?: {
    year?: number | null;
    month?: number | null;
    day?: number | null;
  } | null,
): string | null {
  if (!date || !date.year) return null;
  const year = String(date.year);
  if (!date.month) return year;
  const month = String(date.month).padStart(2, "0");
  if (!date.day) return `${year}-${month}`;
  const day = String(date.day).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Resolves trailer URL from AniList trailer metadata.
 */
function extractAniListTrailer(
  trailer?: { id?: string | null; site?: string | null } | null,
): string | null {
  if (!trailer || !trailer.id || !trailer.site) return null;
  const site = trailer.site.toLowerCase();
  if (site === "youtube") {
    return `https://www.youtube.com/watch?v=${trailer.id}`;
  }
  if (site === "dailymotion") {
    return `https://www.dailymotion.com/video/${trailer.id}`;
  }
  return null;
}

export type TitleLanguagePreference = "english" | "romaji" | "native";

/**
 * Maps an AniList media item to the unified MediaResult model.
 */
export function aniListMediaToMediaResult(
  media: AniListMedia,
  preferredTitleLang: TitleLanguagePreference = "english",
): MediaResult {
  const english = media.title?.english?.trim() || null;
  const romaji = media.title?.romaji?.trim() || null;
  const native = media.title?.native?.trim() || null;

  let primaryTitle: string;
  if (preferredTitleLang === "romaji") {
    primaryTitle = romaji || english || native || "Untitled Anime";
  } else if (preferredTitleLang === "native") {
    primaryTitle = native || english || romaji || "Untitled Anime";
  } else {
    // Default English preferred with graceful fallback
    primaryTitle = english || romaji || native || "Untitled Anime";
  }

  const originalTitle = romaji || native || null;
  const year = media.startDate?.year ?? null;
  const releaseDate = formatFuzzyDate(media.startDate);

  const posterUrl =
    media.coverImage?.extraLarge || media.coverImage?.large || media.coverImage?.medium || null;

  const backdropUrl = media.bannerImage || null;

  // Convert AniList 0-100 averageScore to 0-10 scale (e.g. 85 -> 8.5)
  const voteAverage =
    typeof media.averageScore === "number" && media.averageScore > 0
      ? Math.round(media.averageScore) / 10
      : null;

  // Filter animation studios first, fallback to all studios
  const studioNodes = media.studios?.nodes || [];
  const animationStudios = studioNodes.filter((s) => s.isAnimationStudio).map((s) => s.name);
  const studios = animationStudios.length > 0 ? animationStudios : studioNodes.map((s) => s.name);

  const trailerUrl = extractAniListTrailer(media.trailer);
  const seasons = aniListMediaToNormalizedSeasons(media);

  return {
    id: `anilist:${media.id}`,
    externalSource: "anilist",
    externalId: String(media.id),
    type: "ANIME",
    title: primaryTitle,
    originalTitle,
    overview: cleanAniListDescription(media.description),
    year,
    releaseDate,
    posterUrl,
    backdropUrl,
    genres: media.genres || [],
    runtime: media.duration ?? null,
    status: formatAniListStatus(media.status),
    voteAverage,
    voteCount: null,
    popularity: media.popularity ?? null,
    totalEpisodes: media.episodes ?? (seasons.length > 0 ? seasons[0].episodeCount : null),
    totalSeasons: seasons.length > 0 ? seasons.length : 1,
    studios: studios.length > 0 ? studios : undefined,
    trailerUrl,
    seasons: seasons.length > 0 ? seasons : undefined,
  };
}
