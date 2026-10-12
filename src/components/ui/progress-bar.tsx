import React from "react";
import { cn } from "@/lib/utils/cn";

export interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showPercent?: boolean;
  size?: "sm" | "md"; // sm = 4px (poster edge), md = 6px (inline / title details)
  className?: string;
}

/**
 * ProgressBar implements UI spec section 9.13:
 * - 6px inline or 4px poster edge, radius-full
 * - Track is white 12% (black 8% in light theme)
 * - Fill uses the brand gradient and grows over 300ms with ease-out
 * - Exposed with role="progressbar" and numeric labels
 */
export function ProgressBar({
  value,
  max,
  label,
  showPercent = false,
  size = "md",
  className,
}: ProgressBarProps) {
  const safeMax = max > 0 ? max : 1;
  const safeVal = Math.max(0, Math.min(value, safeMax));
  const percent = Math.round((safeVal / safeMax) * 100);

  const displayLabel =
    label ||
    (showPercent
      ? `${safeVal} / ${safeMax} episodes • ${percent}%`
      : `${safeVal} / ${safeMax} episodes`);

  const heightClass = size === "sm" ? "h-1" : "h-1.5";

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {displayLabel && (
        <div className="flex items-center justify-between text-xs text-ink-muted font-medium">
          <span>{displayLabel}</span>
          {showPercent && !label && <span className="font-mono">{percent}%</span>}
        </div>
      )}

      {/* Progress track */}
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={displayLabel}
        className={cn(
          "w-full rounded-full overflow-hidden bg-black/8 dark:bg-white/12",
          heightClass,
        )}
      >
        {/* Animated fill */}
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-hover transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
