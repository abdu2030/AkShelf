"use client";

import React, { useState } from "react";
import { Check, CheckCheck, Clapperboard, RotateCcw, Calendar, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { WatchStatusType } from "@/components/ui/status-badge";
import { MediaType } from "@/components/title/media-card";
import { updateTitleStatusAction } from "@/actions/tracking";
import { formatDate } from "@/lib/utils/format";

export interface MovieWatchSectionProps {
  titleExternalSource: "tmdb" | "anilist";
  titleExternalId: string;
  titleName: string;
  mediaType: MediaType;
  year?: number | null;
  runtime?: number | null;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  overview?: string | null;
  currentStatus?: WatchStatusType | null;
  watchedAt?: string | null;
  onStatusChange?: (newStatus: WatchStatusType | null) => void;
  className?: string;
}

/**
 * MovieWatchSection provides a one-click watch completion mechanism for movies and anime films,
 * matching the episode-checking experience available for TV and multi-episode series.
 *
 * Features:
 * - 32px accessible circular checkbox with instant visual feedback
 * - Runtime, release year, and watched date indicators
 * - One-click "Mark as Watched" / "Watched" toggle
 * - 6-second Undo toast notification
 * - Optimistic UI updates with rollback on error
 */
export function MovieWatchSection({
  titleExternalSource,
  titleExternalId,
  titleName,
  mediaType,
  year,
  runtime,
  posterUrl,
  backdropUrl,
  overview,
  currentStatus,
  watchedAt,
  onStatusChange,
  className,
}: MovieWatchSectionProps) {
  const [prevPropStatus, setPrevPropStatus] = useState(currentStatus ?? null);
  const [prevPropWatchedAt, setPrevPropWatchedAt] = useState(watchedAt ?? null);
  const [status, setStatus] = useState<WatchStatusType | null>(currentStatus ?? null);
  const [localWatchedAt, setLocalWatchedAt] = useState<string | null>(watchedAt ?? null);
  const [isPending, setIsPending] = useState(false);
  const [activeToast, setActiveToast] = useState<{
    type: "success" | "error" | "info" | "warning";
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);

  // Sync state if external props update without triggering cascading effect renders
  if (prevPropStatus !== (currentStatus ?? null)) {
    setPrevPropStatus(currentStatus ?? null);
    setStatus(currentStatus ?? null);
  }

  if (prevPropWatchedAt !== (watchedAt ?? null)) {
    setPrevPropWatchedAt(watchedAt ?? null);
    setLocalWatchedAt(watchedAt ?? null);
  }

  const isWatched = status === "WATCHED";

  // Format runtime: e.g. "2h 10m" or "116m"
  const formattedRuntime = runtime
    ? runtime >= 60
      ? `${Math.floor(runtime / 60)}h ${runtime % 60 > 0 ? `${runtime % 60}m` : ""}`.trim()
      : `${runtime}m`
    : null;

  const toggleWatchStatus = async () => {
    const prevStatus = status;
    const prevWatchedAt = localWatchedAt;
    const nextStatus: WatchStatusType = isWatched ? "PLAN_TO_WATCH" : "WATCHED";
    const nextWatchedAt = isWatched ? null : new Date().toISOString();

    // 1. Optimistic Update
    setStatus(nextStatus);
    setLocalWatchedAt(nextWatchedAt);
    onStatusChange?.(nextStatus);
    setIsPending(true);

    try {
      const result = await updateTitleStatusAction({
        titleExternalSource,
        titleExternalId,
        status: nextStatus,
        watchedAt: nextWatchedAt,
        titleName,
        mediaType,
        posterUrl,
        backdropUrl,
        year,
        overview,
      });

      if (!result.success) {
        // Rollback on failure
        setStatus(prevStatus);
        setLocalWatchedAt(prevWatchedAt);
        onStatusChange?.(prevStatus);
        setActiveToast({
          type: "error",
          message: result.error || "Failed to update watch status",
        });
      } else {
        // Trigger 6-second undo toast
        setActiveToast({
          type: "success",
          message: isWatched
            ? `Marked "${titleName}" as unwatched`
            : `Marked "${titleName}" as watched!`,
          actionLabel: "Undo",
          onAction: () => {
            // Revert action
            setStatus(prevStatus);
            setLocalWatchedAt(prevWatchedAt);
            onStatusChange?.(prevStatus);
            void updateTitleStatusAction({
              titleExternalSource,
              titleExternalId,
              status: prevStatus,
              watchedAt: prevWatchedAt,
              titleName,
              mediaType,
              posterUrl,
              backdropUrl,
              year,
              overview,
            });
          },
        });
      }
    } catch {
      setStatus(prevStatus);
      setLocalWatchedAt(prevWatchedAt);
      onStatusChange?.(prevStatus);
      setActiveToast({
        type: "error",
        message: "Network error while updating watch status",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <section
      aria-labelledby="movie-watch-heading"
      className={cn(
        "glass-1 rounded-[24px] p-5 sm:p-6 border border-white/10 shadow-lg space-y-4",
        className,
      )}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2
          id="movie-watch-heading"
          className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5"
        >
          <Clapperboard className="w-3.5 h-3.5" aria-hidden="true" />
          Feature Film Watch Progress
        </h2>
        <span className="text-xs text-ink-muted font-medium">
          {isWatched ? (
            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
              Completed
            </span>
          ) : (
            "Single Episode / Movie"
          )}
        </span>
      </div>

      {/* Main Interactive Row (matching EpisodeRow tactile design) */}
      <div
        className={cn(
          "group relative flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl transition-all select-none min-h-[72px]",
          "glass-2 border transition-all duration-200",
          isWatched
            ? "border-emerald-500/30 bg-emerald-500/5 shadow-inner"
            : "border-white/10 hover:border-white/20 bg-white/5",
        )}
      >
        {/* Left Side: Checkbox + Title + Metadata */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Accessible Checkbox: 32px circle inside 48px hit area */}
          <button
            type="button"
            role="checkbox"
            aria-checked={isWatched}
            aria-label={
              isWatched ? `Mark ${titleName} as unwatched` : `Mark ${titleName} as watched`
            }
            disabled={isPending}
            onClick={toggleWatchStatus}
            className={cn(
              "relative flex items-center justify-center shrink-0 w-8 h-8 rounded-full border-2 transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
              isWatched
                ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-600 hover:border-emerald-600 cursor-pointer"
                : "border-white/30 hover:border-accent hover:bg-accent/10 text-transparent hover:text-accent/60 cursor-pointer",
              isPending && "opacity-60 cursor-wait",
            )}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin text-ink" aria-hidden="true" />
            ) : (
              <Check
                className={cn(
                  "w-4 h-4 transition-transform duration-150",
                  isWatched
                    ? "scale-100 opacity-100"
                    : "scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-100",
                )}
                strokeWidth={3}
                aria-hidden="true"
              />
            )}
          </button>

          {/* Film Title and Metadata */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-display font-semibold text-ink truncate">
                {titleName}
              </h3>
              {isWatched && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  <CheckCheck className="w-3 h-3" aria-hidden="true" />
                  Watched
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-ink-muted flex-wrap">
              {year && <span>{year}</span>}
              {year && formattedRuntime && <span>•</span>}
              {formattedRuntime && <span>{formattedRuntime}</span>}
              {localWatchedAt && isWatched && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-ink-soft">
                    <Calendar className="w-3 h-3 text-accent" aria-hidden="true" />
                    Watched on {formatDate(localWatchedAt)}
                  </span>
                </>
              )}
              {!isWatched && (
                <>
                  <span>•</span>
                  <span className="text-ink-soft">Click checkbox to mark as completed</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Primary Quick Action Button */}
        <div className="shrink-0 flex items-center gap-2">
          <Button
            type="button"
            variant={isWatched ? "secondary" : "primary"}
            size="small"
            disabled={isPending}
            onClick={toggleWatchStatus}
            className={cn(
              "font-semibold text-xs transition-all",
              isWatched
                ? "border-white/20 hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/10"
                : "bg-accent hover:opacity-95 text-white shadow-sm",
            )}
          >
            {isWatched ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                Mark Unwatched
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                Mark as Watched
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 6-Second Undo Toast */}
      {activeToast && (
        <Toast
          type={activeToast.type}
          message={activeToast.message}
          actionLabel={activeToast.actionLabel}
          onAction={activeToast.onAction}
          onClose={() => setActiveToast(null)}
          duration={6000}
        />
      )}
    </section>
  );
}

export interface MovieQuickCheckButtonProps {
  titleExternalSource: "tmdb" | "anilist";
  titleExternalId: string;
  titleName: string;
  mediaType: MediaType;
  year?: number | null;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  overview?: string | null;
  currentStatus?: WatchStatusType | null;
  onStatusChange?: (newStatus: WatchStatusType | null) => void;
  className?: string;
}

/**
 * MovieQuickCheckButton is a compact pill-sized toggle button designed for the
 * "Your Shelf" panel to give one-click "Watched" completion for movies right beside StatusSelector.
 */
export function MovieQuickCheckButton({
  titleExternalSource,
  titleExternalId,
  titleName,
  mediaType,
  year,
  posterUrl,
  backdropUrl,
  overview,
  currentStatus,
  onStatusChange,
  className,
}: MovieQuickCheckButtonProps) {
  const [prevPropStatus, setPrevPropStatus] = useState(currentStatus ?? null);
  const [status, setStatus] = useState<WatchStatusType | null>(currentStatus ?? null);
  const [isPending, setIsPending] = useState(false);

  if (prevPropStatus !== (currentStatus ?? null)) {
    setPrevPropStatus(currentStatus ?? null);
    setStatus(currentStatus ?? null);
  }

  const isWatched = status === "WATCHED";

  const handleToggle = async () => {
    const prevStatus = status;
    const nextStatus: WatchStatusType = isWatched ? "PLAN_TO_WATCH" : "WATCHED";
    const nextWatchedAt = isWatched ? null : new Date().toISOString();

    setStatus(nextStatus);
    onStatusChange?.(nextStatus);
    setIsPending(true);

    try {
      const result = await updateTitleStatusAction({
        titleExternalSource,
        titleExternalId,
        status: nextStatus,
        watchedAt: nextWatchedAt,
        titleName,
        mediaType,
        posterUrl,
        backdropUrl,
        year,
        overview,
      });

      if (!result.success) {
        setStatus(prevStatus);
        onStatusChange?.(prevStatus);
      }
    } catch {
      setStatus(prevStatus);
      onStatusChange?.(prevStatus);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      aria-label={isWatched ? `Mark ${titleName} as unwatched` : `Mark ${titleName} as watched`}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all select-none cursor-pointer",
        isWatched
          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
          : "glass-1 hover:glass-2 border border-white/10 hover:border-white/25 text-ink-soft hover:text-ink",
        isPending && "opacity-70 cursor-wait",
        className,
      )}
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" aria-hidden="true" />
      ) : (
        <Check
          className={cn("w-3.5 h-3.5", isWatched ? "text-emerald-400" : "text-ink-muted")}
          strokeWidth={isWatched ? 3 : 2}
          aria-hidden="true"
        />
      )}
      <span>{isWatched ? "Watched" : "Mark Watched"}</span>
    </button>
  );
}
