import React from "react";
import Image from "next/image";
import { Calendar, Clock, Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { StatusBadge, WatchStatusType } from "@/components/ui/status-badge";
import { MediaTypeIcon, MediaType } from "./media-card";
import { formatMediaType, formatRating } from "@/lib/utils/format";

export interface TitleHeroProps {
  title: string;
  type: MediaType;
  year?: number | null;
  releaseDate?: string | null;
  overview?: string | null;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  genres?: string[];
  runtime?: number | null;
  totalEpisodes?: number | null;
  status?: WatchStatusType | null;
  rating?: number | null;
  voteAverage?: number | null;
  className?: string;
}

/**
 * TitleHero renders the ambient backdrop, poster, display title, metadata line,
 * status badge, and narrative synopsis (spec section 8.3 & page 38).
 */
export function TitleHero({
  title,
  type,
  year,
  overview,
  posterUrl,
  backdropUrl,
  genres = [],
  runtime,
  totalEpisodes,
  status,
  rating,
  voteAverage,
  className,
}: TitleHeroProps) {
  // Format runtime minutes to "2h 28m" or "24m"
  const formattedRuntime = runtime
    ? runtime >= 60
      ? `${Math.floor(runtime / 60)}h ${runtime % 60 > 0 ? `${runtime % 60}m` : ""}`.trim()
      : `${runtime}m`
    : null;

  return (
    <div
      className={cn(
        "relative rounded-[28px] overflow-hidden glass-1 border border-white/10 shadow-2xl",
        className,
      )}
    >
      {/* 1. Backdrop Ambience with Scrim (Section 8.3) */}
      {backdropUrl ? (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          {/* Ambient blurred glow (blur 40px, 35% opacity) */}
          <div
            className="absolute inset-0 -inset-x-8 -inset-y-8 bg-cover bg-center filter blur-3xl opacity-35 scale-105"
            style={{ backgroundImage: `url(${backdropUrl})` }}
            aria-hidden="true"
          />

          {/* Sharp backdrop image */}
          <Image
            src={backdropUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-top opacity-30 dark:opacity-25"
            aria-hidden="true"
          />

          {/* Scrim gradient: >= 65% black where text appears */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)]/85 to-[var(--bg-base)]/40 dark:from-black dark:via-black/85 dark:to-black/40"
            aria-hidden="true"
          />
        </div>
      ) : (
        /* Fallback Aurora Ambient Glow */
        <div
          className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-950/20 via-purple-950/10 to-transparent pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* 2. Content Layout: Desktop side-by-side, Mobile stacked */}
      <div className="relative z-10 p-5 sm:p-8 md:p-10 flex flex-col md:flex-row gap-6 sm:gap-8 md:gap-10 items-start">
        {/* 2.1 2:3 Aspect Ratio Poster (240px desktop, 110px mobile) */}
        <div className="relative aspect-[2/3] w-28 sm:w-44 md:w-60 shrink-0 rounded-2xl overflow-hidden glass-2 shadow-2xl border border-white/15 mx-auto md:mx-0">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 112px, (max-width: 768px) 176px, 240px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-indigo-950/60 to-purple-950/60 text-ink-muted">
              <MediaTypeIcon type={type} className="w-10 h-10 mb-2 opacity-60" />
              <span className="text-xs font-semibold line-clamp-3">{title}</span>
            </div>
          )}
        </div>

        {/* 2.2 Title Metadata & Synopsis Details */}
        <div className="flex-1 space-y-4 text-left w-full">
          {/* Badges line: MediaType, StatusBadge, Rating */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-elevated text-ink-muted border border-white/10">
              <MediaTypeIcon type={type} className="w-3.5 h-3.5 text-accent" />
              {formatMediaType(type)}
            </span>

            {status && <StatusBadge status={status} />}

            {rating != null && rating > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/20">
                <Star className="w-3.5 h-3.5 fill-amber-500" aria-hidden="true" />
                Your Rating: {formatRating(rating)}
              </span>
            )}

            {voteAverage != null && voteAverage > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-ink-muted bg-white/5 border border-white/10">
                <Star className="w-3 h-3 text-amber-400" aria-hidden="true" />
                {voteAverage.toFixed(1)}/10
              </span>
            )}
          </div>

          {/* Display Title with Year */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-ink tracking-tight drop-shadow-sm">
            {title} {year ? <span className="font-normal text-ink-muted">({year})</span> : null}
          </h1>

          {/* Quick Info Line */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-ink-muted font-medium">
            {year && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-ink-muted/80" aria-hidden="true" />
                {year}
              </span>
            )}
            {formattedRuntime && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-ink-muted/80" aria-hidden="true" />
                {formattedRuntime}
              </span>
            )}
            {totalEpisodes != null && totalEpisodes > 1 && <span>• {totalEpisodes} Episodes</span>}
          </div>

          {/* Genres Chips */}
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {genres.map((genre) => (
                <span
                  key={genre}
                  className="text-xs px-2.5 py-1 rounded-lg bg-surface-elevated/70 text-ink-soft border border-white/10 font-medium"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* Narrative Synopsis / Overview (max 65 chars wide per spec) */}
          {overview && (
            <div className="pt-2 space-y-1.5 max-w-2xl">
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Synopsis
              </h2>
              <p className="text-sm sm:text-base text-ink-soft leading-relaxed">{overview}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
