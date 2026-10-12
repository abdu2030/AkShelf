import React from "react";
import { Info, ExternalLink, Play, Star, Calendar, Clock, Film, Building2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface MetadataPanelProps {
  originalTitle?: string | null;
  director?: string | null;
  studios?: string[] | null;
  releaseDate?: string | null;
  runtime?: number | null;
  status?: string | null;
  voteAverage?: number | null;
  voteCount?: number | null;
  externalSource?: "tmdb" | "anilist" | null;
  externalId?: string | null;
  trailerUrl?: string | null;
  className?: string;
}

/**
 * Formats runtime minutes into readable hours and minutes (e.g. 148 -> "2h 28m").
 */
function formatRuntime(minutes?: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (hours > 0 && remainingMins > 0) {
    return `${minutes}m (${hours}h ${remainingMins}m)`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
}

/**
 * Constructs official external link for the provider.
 */
function getExternalUrl(
  source?: "tmdb" | "anilist" | null,
  externalId?: string | null,
): { url: string; label: string } | null {
  if (!source || !externalId) return null;
  if (source === "tmdb") {
    // TMDB numeric ID links to movie or tv show
    return {
      url: `https://www.themoviedb.org/movie/${externalId}`,
      label: "View on TMDB",
    };
  }
  if (source === "anilist") {
    return {
      url: `https://anilist.co/anime/${externalId}`,
      label: "View on AniList",
    };
  }
  return null;
}

/**
 * MetadataPanel renders structured key-value production details, studio/creator,
 * external link, trailer link, and required provider attribution (spec section 8.6, 10.4).
 */
export function MetadataPanel({
  originalTitle,
  director,
  studios,
  releaseDate,
  runtime,
  status,
  voteAverage,
  voteCount,
  externalSource,
  externalId,
  trailerUrl,
  className,
}: MetadataPanelProps) {
  const formattedRuntime = formatRuntime(runtime);
  const externalLink = getExternalUrl(externalSource, externalId);
  const studioNames = studios?.filter(Boolean) || [];

  return (
    <section aria-labelledby="metadata-panel-heading" className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between px-1">
        <h2
          id="metadata-panel-heading"
          className="text-base sm:text-lg font-display font-bold text-ink tracking-tight flex items-center gap-2"
        >
          <Info className="w-4 h-4 text-accent" aria-hidden="true" />
          About &amp; Overview
        </h2>

        {/* Quick action links: Trailer & External Source */}
        <div className="flex items-center gap-2">
          {trailerUrl && (
            <a
              href={trailerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-600/15 text-red-600 dark:text-red-400 border border-red-600/20 hover:bg-red-600/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Play className="w-3 h-3 fill-current" aria-hidden="true" />
              Trailer
            </a>
          )}
          {externalLink && (
            <a
              href={externalLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium glass-2 text-ink-soft hover:text-ink border border-white/10 hover:border-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
              {externalLink.label}
            </a>
          )}
        </div>
      </div>

      {/* Structured Key-Value Grid */}
      <div className="glass-2 rounded-2xl p-5 border border-white/10 shadow-sm">
        <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 text-left">
          {/* 1. Original / Native Title */}
          {originalTitle && (
            <div className="space-y-1">
              <dt className="text-xs font-medium text-ink-muted flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
                Original Title
              </dt>
              <dd className="text-sm font-semibold text-ink line-clamp-2">{originalTitle}</dd>
            </div>
          )}

          {/* 2. Director / Creator */}
          {director && (
            <div className="space-y-1">
              <dt className="text-xs font-medium text-ink-muted flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
                Director / Creator
              </dt>
              <dd className="text-sm font-semibold text-ink">{director}</dd>
            </div>
          )}

          {/* 3. Studios / Networks */}
          {studioNames.length > 0 && (
            <div className="space-y-1">
              <dt className="text-xs font-medium text-ink-muted flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
                Studio / Network
              </dt>
              <dd className="text-sm font-semibold text-ink line-clamp-2">
                {studioNames.join(", ")}
              </dd>
            </div>
          )}

          {/* 4. Release Date */}
          {releaseDate && (
            <div className="space-y-1">
              <dt className="text-xs font-medium text-ink-muted flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
                Release Date
              </dt>
              <dd className="text-sm font-semibold text-ink">{releaseDate}</dd>
            </div>
          )}

          {/* 5. Runtime */}
          {formattedRuntime && (
            <div className="space-y-1">
              <dt className="text-xs font-medium text-ink-muted flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
                Runtime
              </dt>
              <dd className="text-sm font-semibold text-ink">{formattedRuntime}</dd>
            </div>
          )}

          {/* 6. Production / Airing Status */}
          {status && (
            <div className="space-y-1">
              <dt className="text-xs font-medium text-ink-muted flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
                Status
              </dt>
              <dd className="text-sm font-semibold text-ink">{status}</dd>
            </div>
          )}

          {/* 7. Community Rating */}
          {voteAverage != null && voteAverage > 0 && (
            <div className="space-y-1">
              <dt className="text-xs font-medium text-ink-muted flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" aria-hidden="true" />
                Community Score
              </dt>
              <dd className="text-sm font-semibold text-ink flex items-baseline gap-1">
                <span>{voteAverage.toFixed(1)}</span>
                <span className="text-xs text-ink-muted font-normal">/ 10</span>
                {voteCount != null && voteCount > 0 && (
                  <span className="text-[11px] text-ink-muted font-normal ml-1">
                    ({voteCount.toLocaleString()} votes)
                  </span>
                )}
              </dd>
            </div>
          )}
        </dl>

        {/* Quiet attribution footer per section 8.6 */}
        <div className="mt-5 pt-3.5 border-t border-white/5 text-[11px] text-ink-muted/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span>
            {externalSource === "anilist"
              ? "Metadata and anime details powered by AniList GraphQL API."
              : "This product uses the TMDB API but is not endorsed or certified by TMDB."}
          </span>
          <span className="text-ink-muted/50">Personal Data &copy; AkShelf</span>
        </div>
      </div>
    </section>
  );
}
