import React from "react";
import { Clock, Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { StatusBadge, WatchStatusType } from "@/components/ui/status-badge";
import { MediaType } from "./media-card";
import { ArchiveImage } from "@/components/ui/archive-image";
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
  const formattedRuntime = runtime
    ? runtime >= 60
      ? `${Math.floor(runtime / 60)}h ${runtime % 60 ? `${runtime % 60}m` : ""}`.trim()
      : `${runtime}m`
    : null;
  return (
    <section className={cn("artwork-stage", className)} aria-label="The story record">
      <ArchiveImage
        src={backdropUrl}
        alt=""
        sizes="(max-width: 767px) 100vw, 80vw"
        decorative
        priority
      />
      <div className="artwork-scrim" aria-hidden="true" />
      <div className="relative z-10 p-6 sm:p-8 lg:p-10 flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
        <div className="relative aspect-[2/3] w-24 sm:w-40 lg:w-48 shrink-0 rounded-lg overflow-hidden border border-white/20 shadow-xl">
          <ArchiveImage
            src={posterUrl}
            alt={title}
            sizes="(max-width: 639px) 96px, (max-width: 1023px) 160px, 192px"
          />
        </div>
        <div className="flex-1 min-w-0 space-y-4">
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#dfa16f]">
            The story record
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#c5c9cb]">
            <span>{formatMediaType(type)}</span>
            {year && <span>{year}</span>}
            {formattedRuntime && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {formattedRuntime}
              </span>
            )}
            {type !== "MOVIE" && totalEpisodes != null && totalEpisodes > 1 && (
              <span>{totalEpisodes} Episodes</span>
            )}
          </div>
          <h1 className="editorial text-[clamp(2rem,3.8vw,3.8rem)]">
            {title} {year ? <span className="sr-only">({year})</span> : null}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            {status && <StatusBadge status={status} />}
            {rating != null && rating > 0 && (
              <span className="inline-flex items-center gap-1.5 text-sm text-[#dfa16f] tabular-nums">
                <Star className="h-4 w-4" aria-hidden="true" />
                Your Rating: {formatRating(rating)}
              </span>
            )}
          </div>
          {genres.length > 0 && (
            <p className="text-xs text-[#c5c9cb] leading-relaxed">{genres.join(" / ")}</p>
          )}
          {overview && (
            <div className="max-w-[65ch] pt-1">
              <h2 className="sr-only">Synopsis</h2>
              <p className="text-sm text-[#d7d8d5] leading-relaxed line-clamp-3">{overview}</p>
              <details className="mt-2 text-xs text-[#c5c9cb]">
                <summary className="cursor-pointer py-2 w-fit">Read full synopsis</summary>
                <p className="text-sm leading-relaxed pt-2">{overview}</p>
              </details>
            </div>
          )}
          {voteAverage != null && voteAverage > 0 && (
            <p className="text-xs text-[#c5c9cb] tabular-nums">
              Provider score: {voteAverage.toFixed(1)}/10
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
