"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
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
  const [customInput, setCustomInput] = useState<string>(
    currentRating != null ? String(currentRating) : "",
  );
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Concurrency and race condition guards
  const lastCommittedScoreRef = useRef<number | null>(currentRating);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    lastCommittedScoreRef.current = currentRating;
  }, [currentRating]);

  // Sync state during render when prop changes externally (React 19 pattern)
  if (prevPropRating !== currentRating) {
    setPrevPropRating(currentRating);
    setRating(currentRating);
    setCustomInput(currentRating != null ? String(currentRating) : "");
  }

  const handleRate = useCallback(
    async (newScore: number | null) => {
      if (newScore === lastCommittedScoreRef.current) return;
      if (isSubmittingRef.current) return;

      const previousRating = rating;
      lastCommittedScoreRef.current = newScore;
      isSubmittingRef.current = true;
      setRating(newScore);
      setCustomInput(newScore != null ? String(newScore) : "");
      setErrorMsg(null);
      onRatingChange?.(newScore);

      if (!titleExternalSource || !titleExternalId) {
        isSubmittingRef.current = false;
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
          lastCommittedScoreRef.current = previousRating;
          setRating(previousRating);
          setCustomInput(previousRating != null ? String(previousRating) : "");
          onRatingChange?.(previousRating);
          setErrorMsg(result.error || "Failed to update rating. Must be between 1 and 10.");
        }
      } catch (err) {
        lastCommittedScoreRef.current = previousRating;
        setRating(previousRating);
        setCustomInput(previousRating != null ? String(previousRating) : "");
        onRatingChange?.(previousRating);
        setErrorMsg(err instanceof Error ? err.message : "Failed to update rating");
      } finally {
        isSubmittingRef.current = false;
        setIsPending(false);
      }
    },
    [rating, titleExternalSource, titleExternalId, titleName, mediaType, onRatingChange],
  );

  const commitCustomInput = useCallback(() => {
    if (isSubmittingRef.current) return;

    const trimmed = customInput.trim();
    if (!trimmed) {
      if (lastCommittedScoreRef.current !== null) {
        handleRate(null);
      }
      return;
    }

    const parsed = parseFloat(trimmed);
    if (isNaN(parsed) || parsed < 1 || parsed > 10) {
      setErrorMsg("Rating must be between 1 and 10");
      setCustomInput(rating != null ? String(rating) : "");
      return;
    }

    // Round to at most 2 decimal places to avoid floating-point display quirks
    const rounded = Math.round(parsed * 100) / 100;
    if (rounded === lastCommittedScoreRef.current) {
      return;
    }

    setCustomInput(String(rounded));
    handleRate(rounded);
  }, [customInput, rating, handleRate]);

  const handleCustomKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitCustomInput();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setCustomInput(rating != null ? String(rating) : "");
        setErrorMsg(null);
      }
    },
    [commitCustomInput, rating],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        const nextScore = rating ? Math.max(1, Math.floor(rating) - 1) : 10;
        handleRate(nextScore);
        buttonRefs.current[nextScore - 1]?.focus();
      } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault();
        const nextScore = rating ? Math.min(10, Math.floor(rating) + 1) : 1;
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
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-muted hover:text-danger hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md px-1 py-0.5 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Clear rating"
          >
            <X className="w-3 h-3" aria-hidden="true" />
            Clear rating
          </button>
        )}
      </div>

      {/* 10-Button Rating Radiogroup + Inline Decimal Input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div
          role="radiogroup"
          aria-label="Your rating"
          onKeyDown={handleKeyDown}
          className="grid grid-cols-5 sm:flex sm:items-center gap-1.5 sm:gap-1.5 flex-1"
        >
          {RATING_SCORES.map((score, index) => {
            const isSelected = rating === score;
            const isHovered = hoveredScore !== null && score <= hoveredScore;
            const isBase = rating !== null && Math.floor(rating) === score && !isSelected;

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
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
                  isSelected
                    ? "bg-accent-fill text-white border border-accent-fill font-bold shadow-md ring-2 ring-accent/30 scale-105"
                    : isBase
                      ? "bg-amber-500/15 text-amber-500 dark:text-amber-300 border border-amber-500/30 font-bold"
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

        {/* Inline Decimal / Custom Input */}
        <div className="flex items-center justify-end sm:justify-start gap-1.5 shrink-0 pt-1 sm:pt-0">
          <div className="relative flex items-center">
            <input
              type="number"
              step="0.1"
              min="1"
              max="10"
              value={customInput}
              onChange={(e) => {
                setCustomInput(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              onKeyDown={handleCustomKeyDown}
              onBlur={commitCustomInput}
              placeholder="e.g. 8.5"
              aria-label="Custom decimal rating from 1 to 10"
              readOnly={isPending}
              className={cn(
                "w-20 sm:w-16 h-10 sm:h-9 text-center text-xs font-bold rounded-xl glass-1 border px-2 transition-all",
                "text-ink placeholder:text-ink-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                rating !== null && rating % 1 !== 0
                  ? "border-amber-500/50 bg-amber-500/10 text-amber-500 dark:text-amber-300 font-extrabold ring-1 ring-amber-500/30"
                  : "border-white/10 hover:border-white/20",
              )}
            />
            <span className="text-[11px] font-semibold text-ink-muted ml-1.5 select-none">
              / 10
            </span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <p className="text-[11px] text-danger font-medium pt-0.5" role="alert">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
