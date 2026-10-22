import React from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, Film, Sparkles, Star, Tv } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { RecentlyWatchedItem } from "@/lib/dashboard";
import { formatRating } from "@/lib/utils/format";
import { Skeleton } from "@/components/ui/skeleton";

export interface RecentlyWatchedCardProps {
  item: RecentlyWatchedItem;
  className?: string;
}

export function RecentlyWatchedCard({ item, className }: RecentlyWatchedCardProps) {
  const { id, externalSource, externalId, title, type, posterUrl, year, rating, watchedAt } = item;

  // Prefer direct database record route if available (e.g. "db-cuid..."), else fallback to provider slug
  const isDbId = Boolean(id && !id.startsWith("demo-") && !id.startsWith("rw-"));
  const targetId = isDbId
    ? id.startsWith("db-")
      ? id
      : `db-${id}`
    : `${externalSource}-${externalId}`;

  const href = `/title/${targetId}${type ? `?type=${type}` : ""}`;

  const formattedDate = watchedAt
    ? new Date(watchedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <Link
      href={href}
      data-testid={`recently-watched-card-${externalId}`}
      className={cn(
        "glass-1 rounded-2xl p-3 sm:p-3.5 border border-white/10 hover:border-white/20 transition-all duration-200 group flex flex-col justify-between block relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        className,
      )}
    >
      <div className="space-y-3">
        {/* Poster Container */}
        <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-white/5 border border-white/5">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-muted">
              {type === "MOVIE" ? (
                <Film className="w-8 h-8" />
              ) : type === "ANIME" ? (
                <Sparkles className="w-8 h-8" />
              ) : (
                <Tv className="w-8 h-8" />
              )}
            </div>
          )}

          {/* Type Pill */}
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-black/60 backdrop-blur-md text-white border border-white/10">
            {type}
          </div>

          {/* Watched Status Indicator */}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/20 backdrop-blur-md text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shadow-sm">
            <CheckCircle className="w-3 h-3 fill-emerald-400/20 text-emerald-400" />
            <span>Watched</span>
          </div>

          {/* User Rating Badge (if rated) */}
          {rating !== null && rating !== undefined && (
            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-black/70 backdrop-blur-md text-amber-300 border border-amber-500/30 flex items-center gap-1 shadow-sm font-mono tabular-nums">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{formatRating(rating)}</span>
            </div>
          )}
        </div>

        {/* Title & Metadata */}
        <div className="space-y-1">
          <h3 className="font-bold text-sm font-display text-ink group-hover:text-white transition-colors truncate">
            {title}
          </h3>
          <div className="flex items-center justify-between text-xs text-ink-muted">
            {year && <span>{year}</span>}
            {formattedDate && (
              <span className="text-[11px] font-medium text-ink-muted">{formattedDate}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function RecentlyWatchedCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      data-testid="recently-watched-card-skeleton"
      className={cn(
        "glass-1 rounded-2xl p-3 sm:p-3.5 border border-white/5 flex flex-col justify-between",
        className,
      )}
    >
      <div className="space-y-3">
        <Skeleton aspectRatio="poster" className="w-full rounded-xl" />
        <div className="space-y-1.5 pt-0.5">
          <Skeleton className="h-4 w-4/5 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
      </div>
    </div>
  );
}
