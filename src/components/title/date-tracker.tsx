"use client";

import React, { useState, useCallback } from "react";
import {
  Calendar,
  CalendarCheck,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatDate, toDateInputValue } from "@/lib/utils/format";
import { updateTitleDatesAction } from "@/actions/tracking";
import { WatchStatusType } from "@/components/ui/status-badge";

export interface DateTrackerProps {
  startedAt?: string | null;
  watchedAt?: string | null;
  titleExternalSource?: "tmdb" | "anilist";
  titleExternalId?: string;
  titleName?: string;
  mediaType?: "MOVIE" | "TV" | "ANIME";
  status?: WatchStatusType | null;
  onDatesChange?: (dates: { startedAt?: string | null; watchedAt?: string | null }) => void;
  className?: string;
}

export function DateTracker({
  startedAt: propStartedAt = null,
  watchedAt: propWatchedAt = null,
  titleExternalSource,
  titleExternalId,
  titleName,
  mediaType,
  onDatesChange,
  className,
}: DateTrackerProps) {
  const [prevStarted, setPrevStarted] = useState(propStartedAt);
  const [prevWatched, setPrevWatched] = useState(propWatchedAt);
  const [startedAt, setStartedAt] = useState<string | null>(propStartedAt);
  const [watchedAt, setWatchedAt] = useState<string | null>(propWatchedAt);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state during render when props change externally (React 19 pattern)
  if (prevStarted !== propStartedAt || prevWatched !== propWatchedAt) {
    setPrevStarted(propStartedAt);
    setPrevWatched(propWatchedAt);
    setStartedAt(propStartedAt);
    setWatchedAt(propWatchedAt);
  }

  const handleSaveDates = useCallback(
    async (newStarted: string | null, newWatched: string | null) => {
      const oldStarted = startedAt;
      const oldWatched = watchedAt;
      setStartedAt(newStarted);
      setWatchedAt(newWatched);
      setErrorMsg(null);
      onDatesChange?.({ startedAt: newStarted, watchedAt: newWatched });

      if (!titleExternalSource || !titleExternalId) {
        return;
      }

      setIsPending(true);
      try {
        const result = await updateTitleDatesAction({
          titleExternalSource,
          titleExternalId,
          startedAt: newStarted,
          watchedAt: newWatched,
          titleName,
          mediaType,
        });

        if (!result.success) {
          setStartedAt(oldStarted);
          setWatchedAt(oldWatched);
          onDatesChange?.({ startedAt: oldStarted, watchedAt: oldWatched });
          setErrorMsg(result.error || "Failed to update dates");
        }
      } catch (err) {
        setStartedAt(oldStarted);
        setWatchedAt(oldWatched);
        onDatesChange?.({ startedAt: oldStarted, watchedAt: oldWatched });
        setErrorMsg(err instanceof Error ? err.message : "Network error updating dates");
      } finally {
        setIsPending(false);
      }
    },
    [
      startedAt,
      watchedAt,
      titleExternalSource,
      titleExternalId,
      titleName,
      mediaType,
      onDatesChange,
    ],
  );

  const setStartedToday = () => {
    const today = new Date().toISOString().split("T")[0];
    handleSaveDates(today, watchedAt);
  };

  const setWatchedToday = () => {
    const today = new Date().toISOString().split("T")[0];
    handleSaveDates(startedAt, today);
  };

  const hasDates = Boolean(startedAt || watchedAt);

  return (
    <div className={cn("space-y-2 select-none", className)}>
      {/* Overview / Header row */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-ink-muted flex items-center gap-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
            Watch Dates:
          </span>

          {hasDates ? (
            <div className="flex flex-wrap items-center gap-2 tabular-nums">
              {startedAt && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/5 border border-white/10 text-ink-base">
                  <CalendarClock className="w-3 h-3 text-sky-400" aria-hidden="true" />
                  Started: {formatDate(startedAt)}
                </span>
              )}
              {watchedAt && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/5 border border-white/10 text-ink-base">
                  <CalendarCheck className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                  Finished: {formatDate(watchedAt)}
                </span>
              )}
            </div>
          ) : (
            <span className="text-ink-muted italic text-[11px]">No dates logged</span>
          )}

          {isPending && <Loader2 className="w-3 h-3 text-accent animate-spin" aria-hidden="true" />}
        </div>

        <button
          type="button"
          onClick={() => setIsEditing((prev) => !prev)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline cursor-pointer"
          aria-expanded={isEditing}
          aria-label={isEditing ? "Close date editor" : "Edit watch dates"}
        >
          {isEditing ? (
            <>
              Hide <ChevronUp className="w-3 h-3" aria-hidden="true" />
            </>
          ) : (
            <>
              {hasDates ? "Edit dates" : "+ Add dates"}{" "}
              <ChevronDown className="w-3 h-3" aria-hidden="true" />
            </>
          )}
        </button>
      </div>

      {/* Expandable Date Inputs Panel */}
      {isEditing && (
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Started At input */}
            <div className="space-y-1.5">
              <label
                htmlFor="started-at-input"
                className="block text-ink-muted text-[11px] font-medium"
              >
                Started Watching
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="started-at-input"
                  type="date"
                  value={startedAt ? toDateInputValue(startedAt) : ""}
                  onChange={(e) => handleSaveDates(e.target.value || null, watchedAt)}
                  disabled={isPending}
                  className="w-full h-8 px-2.5 rounded-lg bg-surface border border-white/15 text-xs text-ink-base tabular-nums focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <button
                  type="button"
                  onClick={setStartedToday}
                  disabled={isPending}
                  className="h-8 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-ink-base shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                  aria-label="Set started date to today"
                >
                  Today
                </button>
                {startedAt && (
                  <button
                    type="button"
                    onClick={() => handleSaveDates(null, watchedAt)}
                    disabled={isPending}
                    className="h-8 px-1.5 rounded-lg text-ink-muted hover:text-danger shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                    title="Clear started date"
                    aria-label="Clear started date"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {/* Watched At input */}
            <div className="space-y-1.5">
              <label
                htmlFor="watched-at-input"
                className="block text-ink-muted text-[11px] font-medium"
              >
                Completed / Finished
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="watched-at-input"
                  type="date"
                  value={watchedAt ? toDateInputValue(watchedAt) : ""}
                  onChange={(e) => handleSaveDates(startedAt, e.target.value || null)}
                  disabled={isPending}
                  className="w-full h-8 px-2.5 rounded-lg bg-surface border border-white/15 text-xs text-ink-base tabular-nums focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <button
                  type="button"
                  onClick={setWatchedToday}
                  disabled={isPending}
                  className="h-8 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-ink-base shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                  aria-label="Set finished date to today"
                >
                  Today
                </button>
                {watchedAt && (
                  <button
                    type="button"
                    onClick={() => handleSaveDates(startedAt, null)}
                    disabled={isPending}
                    className="h-8 px-1.5 rounded-lg text-ink-muted hover:text-danger shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                    title="Clear finished date"
                    aria-label="Clear finished date"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {errorMsg && (
            <p className="text-[11px] text-danger font-medium" role="alert">
              {errorMsg}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
