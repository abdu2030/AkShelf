import React from "react";
import { Check, Clock, Play } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface EpisodeRowProps {
  episodeNumber: number;
  seasonNumber?: number;
  name: string;
  airDate?: string | null;
  runtime?: number | null;
  overview?: string | null;
  isWatched?: boolean;
  isNextUp?: boolean;
  isAired?: boolean;
  onToggleWatched?: (episodeNumber: number) => void;
  className?: string;
}

/**
 * EpisodeRow implements UI spec section 9.14:
 * Inset surface inside a level 1 panel (rounded-xl, 72px tall on mobile, 64px on desktop):
 * - Checkbox: 28px circle with a 44px hit area, filled watched green with a check
 * - Number: Tabular numerals, fixed width so titles align
 * - Title and meta: Title (one line); Caption below with air date and runtime
 * - Next-up marker: 'Continue' accent chip and a 3px accent bar on left edge
 * - Not yet aired: Checkbox disabled, caption 'Airs <date>'
 */
export function EpisodeRow({
  episodeNumber,
  name,
  airDate,
  runtime,
  isWatched = false,
  isNextUp = false,
  isAired = true,
  onToggleWatched,
  className,
}: EpisodeRowProps) {
  // Format caption string: e.g. "Oct 2, 2023 • 24 min"
  const metaParts: string[] = [];
  if (!isAired && airDate) {
    metaParts.push(`Airs ${airDate}`);
  } else {
    if (airDate) metaParts.push(airDate);
    if (runtime) metaParts.push(`${runtime}m`);
  }
  const captionText = metaParts.join(" • ");

  return (
    <div
      className={cn(
        "group relative flex items-center justify-between gap-3 px-3.5 py-2.5 sm:py-3 rounded-xl transition-all select-none min-h-[64px] sm:min-h-[60px]",
        "glass-1 border border-white/5 hover:border-white/15",
        // Next-up marker: 3px accent bar on left edge
        isNextUp && "border-l-[3px] border-l-accent bg-accent/5",
        isWatched && "opacity-90",
        className,
      )}
    >
      {/* Left side: Checkbox + Number + Title & Meta */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Checkbox: 28px circle inside 44px accessible hit area */}
        <button
          type="button"
          role="checkbox"
          aria-checked={isWatched}
          aria-label={
            isWatched
              ? `Mark Episode ${episodeNumber} as unwatched`
              : `Mark Episode ${episodeNumber} as watched`
          }
          disabled={!isAired}
          onClick={() => onToggleWatched?.(episodeNumber)}
          className={cn(
            "w-11 h-11 shrink-0 flex items-center justify-center -ml-2 rounded-full cursor-pointer transition-transform active:scale-95",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            !isAired && "cursor-not-allowed opacity-40",
          )}
        >
          <div
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center transition-all",
              isWatched
                ? "bg-emerald-500 text-white shadow-sm"
                : "border-2 border-white/20 hover:border-accent text-transparent group-hover:border-white/40",
              !isAired && "border-dashed border-white/20",
            )}
          >
            {isWatched ? (
              <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
            ) : !isAired ? (
              <Clock className="w-3.5 h-3.5 text-ink-muted/50" aria-hidden="true" />
            ) : null}
          </div>
        </button>

        {/* Tabular Episode Number */}
        <span
          className={cn(
            "w-7 shrink-0 text-center font-mono text-xs sm:text-sm font-bold text-ink-muted",
            isNextUp && "text-accent",
          )}
        >
          {episodeNumber}
        </span>

        {/* Title and Metadata Caption */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-xs sm:text-sm font-semibold truncate transition-colors",
                isWatched ? "text-ink-soft line-through decoration-white/20" : "text-ink",
                isNextUp && "text-ink font-bold",
              )}
              title={name}
            >
              {name}
            </span>

            {/* Next-up marker chip */}
            {isNextUp && (
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/15 text-accent border border-accent/20">
                <Play className="w-2.5 h-2.5 fill-current" aria-hidden="true" />
                Continue
              </span>
            )}
          </div>

          {captionText && (
            <p className="text-[11px] sm:text-xs text-ink-muted font-medium truncate">
              {captionText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
