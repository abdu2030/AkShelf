import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Film, Tv, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { HistoryItem } from "@/lib/history/types";
import { StatusBadge, WatchStatusType } from "@/components/ui/status-badge";
import { formatRating } from "@/lib/utils/format";

export interface HistoryRowProps {
  item: HistoryItem;
  className?: string;
}

export function HistoryRow({ item, className }: HistoryRowProps) {
  const typeParam = item.mediaType ? `?type=${item.mediaType}` : "";
  const titleHref = `/title/${item.titleExternalSource}:${item.titleExternalId}${typeParam}`;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 p-3 sm:px-4 sm:py-3.5 transition-colors hover:bg-white/[0.04]",
        className,
      )}
    >
      {/* Left side: Poster + Details */}
      <div className="flex items-center gap-3.5 min-w-0">
        {/* 48x72px Poster Thumbnail */}
        <Link
          href={titleHref}
          className="relative w-12 h-[72px] rounded-lg overflow-hidden shrink-0 bg-surface-raised border border-white/10 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent group"
          tabIndex={-1}
          aria-hidden="true"
        >
          {item.posterUrl ? (
            <Image
              src={item.posterUrl}
              alt={item.titleName}
              fill
              sizes="48px"
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-muted">
              {item.mediaType === "MOVIE" ? (
                <Film className="w-5 h-5 opacity-60" />
              ) : item.mediaType === "ANIME" ? (
                <Sparkles className="w-5 h-5 opacity-60" />
              ) : (
                <Tv className="w-5 h-5 opacity-60" />
              )}
            </div>
          )}
        </Link>

        {/* Title & Action sentence */}
        <div className="min-w-0 space-y-1">
          <Link
            href={titleHref}
            className="text-sm font-bold text-ink-base hover:text-accent truncate block transition-colors"
          >
            {item.titleName}
          </Link>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Action sentence */}
            <span className="font-medium text-ink-soft">{item.actionSentence}</span>

            {/* Status badge if present and relevant */}
            {item.status && (
              <StatusBadge
                status={item.status as WatchStatusType}
                className="scale-90 origin-left"
              />
            )}

            {/* Rating badge if rated */}
            {item.rating != null && item.rating > 0 && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/20 tabular-nums">
                <Star className="w-3 h-3 fill-amber-500" aria-hidden="true" />
                {formatRating(item.rating)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Local timestamp */}
      <div className="shrink-0 text-right">
        <time
          dateTime={item.occurredAt}
          className="text-xs font-mono font-medium text-ink-muted tabular-nums whitespace-nowrap"
        >
          {item.timeFormatted}
        </time>
      </div>
    </div>
  );
}
