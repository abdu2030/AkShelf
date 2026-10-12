"use client";

import React, { useState, useRef, useCallback } from "react";
import { Star, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { updateTitleRatingAction } from "@/actions/tracking";

export interface RatingControlProps {
  currentRating?: number | null;
  titleExternalSource?: "tmdb" | "anilist";
  titleExternalId?: string;
  titleName?: string;
  mediaType?: "MOVIE" | "TV" | "ANIME";
  onRatingChange?: (newRating: number | null) => void;
  className?: string;
}

const RATING_SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function RatingControl({
  currentRating = null,
  titleExternalSource,
  titleExternalId,
  titleName,
  mediaType,
  onRatingChange,
  className,
}: RatingControlProps) {
  const [prevPropRating, setPrevPropRating] = useState(currentRating);
  const [rating, setRating] = useState<number | null>(currentRating);
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Sync state during render when prop changes externally (React 19 pattern)
  if (prevPropRating !== currentRating) {
    setPrevPropRating(currentRating);
    setRating(currentRating);
  }

  const handleRate = useCallback(
    async (newScore: number | null) => {
      if (newScore === rating && newScore !== null) return;

      const previousRating = rating;
      setRating(newScore);
      setErrorMsg(null);
      onRatingChange?.(newScore);

      if (!titleExternalSource || !titleExternalId) {
        return;
      }

      setIsPending(true);
      try {
        const result = await updateTitleRatingAction({
          titleExternalSource,
          titleExternalId,
          rating: newScore,
          titleName,
          mediaType,
        });

        if (!result.success) {
          setRating(previousRating);
          onRatingChange?.(previousRating);
          setErrorMsg(result.error || "Failed to update rating. Must be between 1 and 10.");
        }
      } catch (err) {
        setRating(previousRating);
        onRatingChange?.(previousRating);
        setErrorMsg(err instanceof Error ? err.message : "Failed to update rating");
      } finally {
        setIsPending(false);
      }
    },
    [rating, titleExternalSource, titleExternalId, titleName, mediaType, onRatingChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        const nextScore = rating ? Math.max(1, rating - 1) : 10;
        handleRate(nextScore);
        buttonRefs.current[nextScore - 1]?.focus();
      } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault();
        const nextScore = rating ? Math.min(10, rating + 1) : 1;
        handleRate(nextScore);
        buttonRefs.current[nextScore - 1]?.focus();
      } else if (e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        const score = parseInt(e.key, 10);
        handleRate(score);
        buttonRefs.current[score - 1]?.focus();
      } else if (e.key === "0") {
        e.preventDefault();
        handleRate(10);
        buttonRefs.current[9]?.focus();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (rating !== null) {
          e.preventDefault();
          handleRate(null);
        }
      }
    },
    [rating, handleRate],
  );

  return (
    <div className={cn("space-y-2 select-none", className)}>
      {/* Header with status label and optional clear button */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-medium">
          {rating ? (
            <>
              <Star
                className="w-4 h-4 fill-amber-500 text-amber-500 dark:text-amber-400 shrink-0"
                aria-hidden="true"
              />
              <span className="font-bold text-ink-base">
                Your rating:{" "}
                <span className="text-amber-500 dark:text-amber-400 font-extrabold">{rating}</span>
                /10
              </span>
            </>
          ) : (
            <span className="text-ink-muted">Rate this title:</span>
          )}

          {isPending && (
            <Loader2 className="w-3 h-3 text-accent animate-spin ml-1" aria-hidden="true" />
          )}
        </div>

        {rating !== null && (
          <button
            type="button"
            onClick={() => handleRate(null)}
            disabled={isPending}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-muted hover:text-danger hover:underline transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Clear rating"
          >
            <X className="w-3 h-3" aria-hidden="true" />
            Clear rating
          </button>
        )}
      </div>

      {/* 10-Button Rating Radiogroup */}
      <div
        role="radiogroup"
        aria-label="Your rating"
        onKeyDown={handleKeyDown}
        className="grid grid-cols-5 sm:flex sm:items-center gap-1.5 sm:gap-2"
      >
        {RATING_SCORES.map((score, index) => {
          const isSelected = rating === score;
          const isHovered = hoveredScore !== null && score <= hoveredScore;

          return (
            <button
              key={score}
              ref={(el) => {
                buttonRefs.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`Rate ${score} out of 10`}
              tabIndex={isSelected || (!rating && score === 1) ? 0 : -1}
              disabled={isPending}
              onMouseEnter={() => setHoveredScore(score)}
              onMouseLeave={() => setHoveredScore(null)}
              onClick={() => handleRate(score)}
              className={cn(
                "h-10 sm:h-9 w-full sm:w-9 rounded-xl flex items-center justify-center text-xs font-semibold transition-all duration-150 cursor-pointer disabled:cursor-not-allowed",
                isSelected
                  ? "bg-accent-fill text-white border border-accent-fill font-bold shadow-md ring-2 ring-accent/30 scale-105"
                  : isHovered
                    ? "bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/30 scale-105"
                    : "glass-1 text-ink-muted hover:text-ink-base border border-white/10 hover:border-white/20",
              )}
            >
              {score}
            </button>
          );
        })}
      </div>

      {errorMsg && (
        <p className="text-[11px] text-danger font-medium pt-0.5" role="alert">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
