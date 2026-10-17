"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Clapperboard, Tv, Sparkles, ImageOff, Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { StatusBadge, WatchStatusType } from "@/components/ui/status-badge";
import { MediaType } from "@/lib/metadata/types";
import { SearchResultItem } from "@/app/api/search/route";

export interface SearchResultRowProps {
  item: SearchResultItem;
  isHighlighted?: boolean;
  onQuickTrack?: (item: SearchResultItem, e: React.MouseEvent) => void;
  className?: string;
}

export function MediaTypeIcon({ type, className }: { type: MediaType; className?: string }) {
  switch (type) {
    case "MOVIE":
      return <Clapperboard className={className} aria-hidden="true" />;
    case "TV":
      return <Tv className={className} aria-hidden="true" />;
    case "ANIME":
      return <Sparkles className={className} aria-hidden="true" />;
    default:
      return <Clapperboard className={className} aria-hidden="true" />;
  }
}

export function formatMediaTypeLabel(type: MediaType): string {
  switch (type) {
    case "MOVIE":
      return "Movie";
    case "TV":
      return "TV";
    case "ANIME":
      return "Anime";
    default:
      return type;
  }
}

export function SearchResultRow({
  item,
  isHighlighted = false,
  onQuickTrack,
  className,
}: SearchResultRowProps) {
  const [imageError, setImageError] = React.useState(false);
  const typeLabel = formatMediaTypeLabel(item.type);

  // Direct link target to title details page
  const titleHref = `/title/${item.id}`;

  // Format badge detail: score for Watched ("9.5/10"), episode position for Watching ("S2 E4")
  let badgeDetail: string | undefined = undefined;
  if (item.status === "WATCHED" && item.rating) {
    badgeDetail = `${item.rating}/10`;
  } else if (item.status === "WATCHING" && item.type !== "MOVIE") {
    const epNum = item.episode ?? item.currentEpisode;
    if (item.season && epNum && epNum > 0) {
      badgeDetail = `S${item.season} E${epNum}`;
    } else if (epNum && epNum > 0) {
      badgeDetail = `Ep ${epNum}`;
    }
  }

  return (
    <div
      role="row"
      aria-selected={isHighlighted}
      data-highlighted={isHighlighted}
      className={cn(
        "relative flex items-center justify-between gap-3 p-3 sm:px-4 rounded-xl transition-all duration-150 select-none",
        "border-l-[3px] group cursor-pointer",
        isHighlighted
          ? "border-accent bg-accent/8 dark:bg-accent/12 shadow-sm"
          : "border-transparent hover:bg-white/8 dark:hover:bg-white/5",
        className,
      )}
    >
      {/* Clickable Card Content */}
      <Link href={titleHref} className="flex items-center gap-3.5 flex-1 min-w-0">
        {/* Poster Thumbnail (64x96px) */}
        <div className="relative w-16 h-24 min-w-[64px] min-h-[96px] rounded-md overflow-hidden bg-white/5 dark:bg-white/5 border border-white/10 shrink-0">
          {item.posterUrl && !imageError ? (
            <Image
              src={item.posterUrl}
              alt={item.title}
              fill
              sizes="64px"
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-1 text-ink-muted bg-white/5">
              <ImageOff className="w-4 h-4 mb-1 stroke-1" aria-hidden="true" />
              <span className="text-[9px] font-medium text-center line-clamp-2 leading-tight">
                {item.title}
              </span>
            </div>
          )}

          {/* Status Indicator Pill / Dot on Poster */}
          {item.isOnShelf && item.status && (
            <div data-testid="poster-status-indicator" className="absolute top-1 left-1 z-10">
              <StatusBadge
                status={item.status as WatchStatusType}
                variant="dot"
                detail={badgeDetail}
                className="h-6 w-6 shadow-md border border-white/20 bg-[#0b0d1a]/85 backdrop-blur-sm [&>svg]:h-3.5 [&>svg]:w-3.5"
              />
            </div>
          )}
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Title */}
          <h3 className="font-display font-semibold text-sm sm:text-base text-ink truncate group-hover:text-accent transition-colors">
            {item.title}
          </h3>

          {/* Subtitle: Year, Media Type Icon + Label, Personal Rating / Score, Watching Progress, Genres */}
          <div className="flex items-center flex-wrap gap-2 text-xs text-ink-muted">
            {item.year && <span>{item.year}</span>}
            {item.year && <span className="text-white/20 dark:text-white/20">•</span>}

            <span className="inline-flex items-center gap-1 font-medium text-ink-soft">
              <MediaTypeIcon type={item.type} className="w-3.5 h-3.5 text-accent shrink-0" />
              <span>{typeLabel}</span>
            </span>

            {/* User Personal Rating (Gold Star + font-mono tabular-nums) */}
            {item.rating != null ? (
              <>
                <span className="text-white/20 dark:text-white/20">•</span>
                <span
                  data-testid="search-personal-rating"
                  className="inline-flex items-center gap-1 font-semibold text-amber-400 font-mono tabular-nums"
                  title={`Your Rating: ${item.rating}/10`}
                >
                  <Star
                    className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{item.rating}</span>
                  <span className="text-[10px] text-ink-muted font-normal font-sans">/10</span>
                </span>
              </>
            ) : item.voteAverage != null && item.voteAverage > 0 ? (
              <>
                <span className="text-white/20 dark:text-white/20">•</span>
                <span
                  data-testid="search-public-rating"
                  className="inline-flex items-center gap-1 text-ink-soft font-mono tabular-nums"
                  title={`Community Score: ${item.voteAverage.toFixed(1)}/10`}
                >
                  <Star
                    className="w-3.5 h-3.5 fill-amber-400/70 text-amber-400/70 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{item.voteAverage.toFixed(1)}</span>
                </span>
              </>
            ) : null}

            {/* Watching Progress in Subtitle */}
            {item.status === "WATCHING" && badgeDetail && (
              <>
                <span className="text-white/20 dark:text-white/20">•</span>
                <span
                  data-testid="search-watching-progress"
                  className="inline-flex items-center gap-1 font-semibold text-sky-400 text-xs"
                >
                  <span>{badgeDetail}</span>
                </span>
              </>
            )}

            {item.genres && item.genres.length > 0 && (
              <>
                <span className="text-white/20 dark:text-white/20">•</span>
                <span className="truncate">{item.genres.slice(0, 2).join(", ")}</span>
              </>
            )}
          </div>

          {/* Overview Synopsis (One line, hidden on mobile) */}
          {item.overview && (
            <p className="hidden md:block text-xs text-ink-muted line-clamp-1 max-w-xl">
              {item.overview}
            </p>
          )}
        </div>
      </Link>

      {/* Right Side: Tracked Status Badge vs "+ Plan to Watch" Action */}
      <div className="shrink-0 pl-2 flex items-center">
        {item.isOnShelf && item.status ? (
          <StatusBadge status={item.status as WatchStatusType} detail={badgeDetail} />
        ) : (
          <button
            type="button"
            onClick={(e) => onQuickTrack?.(item, e)}
            aria-label={`Add ${item.title} to Plan to Watch`}
            className={cn(
              "h-8 px-3 rounded-full text-xs font-semibold cursor-pointer transition-all",
              "flex items-center gap-1.5 shrink-0",
              "glass-2 border border-white/12 text-ink-soft hover:text-ink hover:bg-white/12",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            )}
          >
            <Plus className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
            <span className="hidden sm:inline">Plan to Watch</span>
            <span className="sm:hidden">Add</span>
          </button>
        )}
      </div>
    </div>
  );
}
