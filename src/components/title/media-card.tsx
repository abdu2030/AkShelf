"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clapperboard, Tv, Sparkles, Star, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  formatMediaType,
  formatEpisodePosition,
  formatRating,
  calculateProgressPercentage,
} from "@/lib/utils/format";
import { StatusBadge, statusConfig, WatchStatusType } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";

export type MediaType = "MOVIE" | "TV" | "ANIME";

export interface MediaProgress {
  currentEpisode?: number | null;
  totalEpisodes?: number | null;
  season?: number | null;
  episode?: number | null;
  percentage?: number | null;
}

export interface MediaCardProps {
  id: string | number;
  title: string;
  mediaType?: MediaType;
  type?: MediaType;
  posterUrl?: string | null;
  posterImage?: string | null;
  year?: number | string | null;
  releaseYear?: number | string | null;
  status?: WatchStatusType | null;
  watchStatus?: WatchStatusType | null;
  rating?: number | null;
  userRating?: number | null;
  addedAt?: string | Date | null;
  currentEpisode?: number | null;
  totalEpisodes?: number | null;
  season?: number | null;
  episode?: number | null;
  progress?: MediaProgress | null;
  href?: string;
  priority?: boolean;
  className?: string;
  onQuickAction?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onStatusClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMenuClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function getMediaTypeIcon(type: MediaType) {
  switch (type) {
    case "MOVIE":
      return Clapperboard;
    case "TV":
      return Tv;
    case "ANIME":
      return Sparkles;
    default:
      return Clapperboard;
  }
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

export function MediaCard({
  id,
  title,
  mediaType,
  type,
  posterUrl,
  posterImage,
  year,
  releaseYear,
  status,
  watchStatus,
  rating,
  userRating,
  currentEpisode,
  totalEpisodes,
  season,
  episode,
  progress,
  href,
  priority = false,
  className,
  onQuickAction,
  onStatusClick,
  onMenuClick,
}: MediaCardProps) {
  const [imageError, setImageError] = useState(false);

  const resolvedType = mediaType || type || "MOVIE";
  const resolvedPoster = posterUrl !== undefined ? posterUrl : posterImage;
  const resolvedYear = year !== undefined ? year : releaseYear;
  const resolvedStatus = status !== undefined ? status : watchStatus;
  const resolvedRating = rating !== undefined ? rating : userRating;
  const resolvedHref = href || `/title/${id}`;

  const typeLabel = formatMediaType(resolvedType);

  // Calculate progress percentage for WATCHING titles
  const isWatching = resolvedStatus === "WATCHING";
  const resolvedCurEp =
    currentEpisode ?? progress?.currentEpisode ?? episode ?? progress?.episode ?? 0;
  const resolvedTotEp = totalEpisodes ?? progress?.totalEpisodes ?? 0;

  const progressPercent =
    progress?.percentage !== undefined && progress?.percentage !== null
      ? progress.percentage
      : calculateProgressPercentage(resolvedCurEp, resolvedTotEp);

  // Format episode detail for Caption Line 2
  const resolvedSeasonNum = season ?? progress?.season;
  const resolvedEpNum = episode ?? progress?.episode ?? currentEpisode ?? progress?.currentEpisode;
  const episodePos = formatEpisodePosition(resolvedSeasonNum, resolvedEpNum);

  const statusLabel = resolvedStatus ? statusConfig[resolvedStatus].label : null;
  const statusCaption =
    resolvedStatus && statusLabel
      ? episodePos
        ? `${statusLabel} • ${episodePos}`
        : statusLabel
      : null;

  // Build composite accessible card label
  const accessibleLabel = [
    title,
    resolvedYear ? String(resolvedYear) : null,
    typeLabel,
    statusLabel,
    resolvedRating !== null && resolvedRating !== undefined
      ? `rated ${resolvedRating} out of 10`
      : null,
  ]
    .filter(Boolean)
    .join(", ");

  const handleQuickAction = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const actionHandler = onQuickAction || onStatusClick || onMenuClick;
    actionHandler?.(e);
  };

  const hasPoster = Boolean(resolvedPoster) && !imageError;

  return (
    <article
      className={cn("group relative flex flex-col w-full select-none", className)}
      data-testid="media-card"
    >
      {/* 2:3 Poster Frame */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[16px] border border-white/12 bg-white/4 shadow-md transition-all duration-200 ease-out group-hover:-translate-y-1 group-hover:shadow-xl focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-canvas">
        {/* Full frame clickable link to title */}
        <Link
          href={resolvedHref}
          aria-label={accessibleLabel}
          className="absolute inset-0 z-0 block focus:outline-none"
          tabIndex={0}
        >
          {hasPoster ? (
            <Image
              src={resolvedPoster as string}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
              priority={priority}
              onError={() => setImageError(true)}
            />
          ) : (
            /* Spec 8.4 Missing image fallback */
            <div
              data-testid="poster-fallback"
              className="flex h-full w-full flex-col items-center justify-center p-4 text-center glass-inset rounded-[16px] bg-white/6 border border-white/8"
            >
              <MediaTypeIcon type={resolvedType} className="h-12 w-12 text-ink-muted shrink-0" />
              <p className="mt-3 line-clamp-3 text-xs font-medium text-ink-soft">{title}</p>
            </div>
          )}
        </Link>

        {/* 1. Top-left: 28px status dot badge (tracked only) */}
        {resolvedStatus ? (
          <div
            data-testid="status-dot-overlay"
            className="absolute top-2.5 left-2.5 z-10 pointer-events-none"
          >
            <StatusBadge status={resolvedStatus} variant="dot" />
          </div>
        ) : null}

        {/* 2. Top-right: 44px hit-target glass-2 quick action icon button */}
        <button
          type="button"
          onClick={handleQuickAction}
          aria-label={`Change status for ${title}`}
          data-testid="quick-action-button"
          className="absolute top-2.5 right-2.5 z-20 flex h-9 w-9 items-center justify-center rounded-full glass-2 text-ink shadow-sm border border-white/16 transition-all duration-150 active:scale-95 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* 3. Bottom-right: Solid 85% navy rating chip with gold star (rated only) */}
        {resolvedRating !== null && resolvedRating !== undefined ? (
          <div
            data-testid="rating-chip-overlay"
            className="absolute bottom-2.5 right-2.5 z-10 inline-flex items-center gap-1 h-6 px-2 rounded-full bg-[#0b0d1a]/85 backdrop-blur-none text-white text-xs font-semibold shadow-md select-none border border-white/10 pointer-events-none"
            aria-label={`Rated ${resolvedRating} out of 10`}
          >
            <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" aria-hidden="true" />
            <span>{formatRating(resolvedRating).replace("/10", "")}</span>
          </div>
        ) : null}

        {/* 4. Bottom edge: 4px progress bar for WATCHING titles */}
        {isWatching ? (
          <div
            role="progressbar"
            data-testid="watching-progress-bar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progress: ${progressPercent}%`}
            className="absolute bottom-0 left-0 right-0 z-10 h-1 bg-black/40 overflow-hidden"
          >
            <div
              className="h-full bg-gradient-to-r from-[#6366F1] to-[#A855F7] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        ) : null}
      </div>

      {/* Below poster metadata */}
      <div className="mt-2.5 space-y-1">
        {/* 2-line clamped title */}
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-[20px] text-ink group-hover:text-accent transition-colors">
          <Link
            href={resolvedHref}
            className="focus:outline-none hover:underline focus-visible:underline"
          >
            {title}
          </Link>
        </h3>

        {/* Caption Line 1: year • media icon + label */}
        <div className="flex items-center gap-1.5 text-xs text-ink-muted font-medium">
          {resolvedYear ? (
            <>
              <span>{resolvedYear}</span>
              <span aria-hidden="true">•</span>
            </>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <MediaTypeIcon type={resolvedType} className="h-3.5 w-3.5 shrink-0" />
            <span>{typeLabel}</span>
          </span>
        </div>

        {/* Caption Line 2: status in words e.g. 'Watching • S1 E14' */}
        {resolvedStatus && statusCaption ? (
          <p
            data-testid="status-caption"
            className={cn("text-xs font-semibold truncate", statusConfig[resolvedStatus].textClass)}
          >
            {statusCaption}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function MediaCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      data-testid="media-card-skeleton"
      className={cn("flex flex-col w-full space-y-2.5", className)}
    >
      <Skeleton aspectRatio="poster" className="w-full rounded-[16px]" />
      <div className="space-y-1.5 pt-0.5">
        <Skeleton className="h-4 w-5/6 rounded-md" />
        <Skeleton className="h-3 w-1/2 rounded-md" />
      </div>
    </div>
  );
}

// Re-exports for convenience
export const TitleCard = MediaCard;
export const TitleCardSkeleton = MediaCardSkeleton;
