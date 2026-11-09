import React from "react";
import { ArchiveImage } from "@/components/ui/archive-image";
import Link from "next/link";
import { ArrowUpRight, Sparkles, Tv, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ContinueWatchingItem } from "@/lib/dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export interface ContinueWatchingCardProps {
  item: ContinueWatchingItem;
  className?: string;
}

export function ContinueWatchingCard({ item, className }: ContinueWatchingCardProps) {
  const {
    id,
    externalSource,
    externalId,
    title,
    type,
    posterUrl,
    totalEpisodes,
    watchedEpisodes,
    percentage,
    nextUp: rawNextUp,
    isCompleted,
  } = item;

  const nextUp = totalEpisodes > 0 ? rawNextUp : null;

  // Prefer direct database record route if available (e.g. "db-cuid..."), else fallback to provider slug
  const isDbId = Boolean(id && !id.startsWith("demo-") && !id.startsWith("cw-"));
  const targetId = isDbId
    ? id.startsWith("db-")
      ? id
      : `db-${id}`
    : `${externalSource}-${externalId}`;

  const typeParam = type ? `type=${type}` : "";
  const titleHref = `/title/${targetId}${typeParam ? `?${typeParam}` : ""}`;
  const continueHref = nextUp
    ? `/title/${targetId}?season=${nextUp.seasonNumber}${typeParam ? `&${typeParam}` : ""}`
    : titleHref;

  const isAnime = type === "ANIME";

  return (
    <article
      data-testid={`continue-watching-card-${externalId}`}
      className={cn(
        "glass-1 rounded-2xl p-4 sm:p-5 border border-divider hover:border-divider transition-all duration-200 group flex flex-row gap-4 relative overflow-hidden",
        className,
      )}
    >
      {/* 1. Poster Thumbnail with Type Badge */}
      <div className="relative w-20 h-28 sm:w-24 sm:h-36 rounded-md overflow-hidden shrink-0 bg-surface-elevated border border-divider">
        {posterUrl ? (
          <ArchiveImage
            src={posterUrl}
            alt={title}
            sizes="(max-width: 640px) 80px, 96px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-muted">
            {isAnime ? <Sparkles className="w-6 h-6" /> : <Tv className="w-6 h-6" />}
          </div>
        )}

        {/* Media type pill */}
        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-black/60 backdrop-blur-md text-white border border-divider">
          {type}
        </div>
      </div>

      {/* 2. Metadata & Progress Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <Link
            href={titleHref}
            className="text-base sm:text-lg font-bold font-display text-ink group-hover:text-ink transition-colors truncate block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
          >
            {title}
          </Link>

          {/* Next Up / Completion Indicator */}
          {isCompleted ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-status-watched-text border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>All Episodes Watched</span>
            </div>
          ) : nextUp ? (
            <div className="space-y-0.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
                <span className="px-2 py-0.5 rounded-md bg-accent/15 border border-accent/25">
                  Next: S{nextUp.seasonNumber} E{nextUp.episodeNumber}
                </span>
              </div>
              {nextUp.name && (
                <p className="text-xs text-ink-muted truncate max-w-sm">{nextUp.name}</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-ink-muted">
              {totalEpisodes > 0 ? "Ready to continue" : "Episode information unavailable"}
            </p>
          )}
        </div>

        {/* Progress Bar & Counters */}
        {totalEpisodes > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-ink-muted font-mono tabular-nums">
              <span>
                {watchedEpisodes} / {totalEpisodes} eps
              </span>
              <span className="font-semibold text-ink">{percentage}%</span>
            </div>

            <div
              className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden"
              role="progressbar"
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${title} progress`}
            >
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
              />
            </div>
          </div>
        )}

        {/* Quick Action Resume Button */}
        <div className="pt-1 flex items-center gap-3">
          <Link
            href={continueHref}
            className="archive-action"
            aria-label={
              nextUp
                ? `Continue ${title} Season ${nextUp.seasonNumber} Episode ${nextUp.episodeNumber}`
                : `View ${title}`
            }
          >
            <ArrowUpRight className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
            <span>
              {nextUp
                ? `Continue S${nextUp.seasonNumber} E${nextUp.episodeNumber}`
                : totalEpisodes > 0
                  ? "View Title"
                  : "View progress"}
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ContinueWatchingCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      data-testid="continue-watching-card-skeleton"
      className={cn(
        "glass-1 rounded-2xl p-4 sm:p-5 border border-divider flex flex-col sm:flex-row gap-4",
        className,
      )}
    >
      <div className="w-20 h-28 sm:w-24 sm:h-36 rounded-xl shrink-0 bg-white/5 animate-pulse" />
      <div className="flex-1 min-w-0 flex flex-col justify-between space-y-3 py-1">
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4 rounded-md" />
          <Skeleton className="h-4 w-1/3 rounded-md" />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-3 w-10 rounded" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>
    </div>
  );
}
