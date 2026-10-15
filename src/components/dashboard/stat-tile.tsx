import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { ArrowUpRight } from "lucide-react";

export type StatTileVariant = "total" | "watched" | "watching" | "plan_to_watch";

export interface StatTileProps {
  label: string;
  count: number;
  href: string;
  variant?: StatTileVariant;
  className?: string;
  testId?: string;
}

const variantStyles: Record<
  StatTileVariant,
  {
    dotColor: string;
    glowColor: string;
    numberHoverColor: string;
  }
> = {
  total: {
    dotColor: "bg-accent",
    glowColor: "group-hover:bg-accent/10",
    numberHoverColor: "group-hover:text-accent",
  },
  watched: {
    dotColor: "bg-emerald-400",
    glowColor: "group-hover:bg-emerald-500/10",
    numberHoverColor: "group-hover:text-emerald-400",
  },
  watching: {
    dotColor: "bg-amber-400",
    glowColor: "group-hover:bg-amber-500/10",
    numberHoverColor: "group-hover:text-amber-400",
  },
  plan_to_watch: {
    dotColor: "bg-sky-400",
    glowColor: "group-hover:bg-sky-500/10",
    numberHoverColor: "group-hover:text-sky-400",
  },
};

export function StatTile({
  label,
  count,
  href,
  variant = "total",
  className,
  testId,
}: StatTileProps) {
  const styles = variantStyles[variant];

  return (
    <Link
      href={href}
      data-testid={testId}
      aria-label={`${label}: ${count} titles. Click to view in library.`}
      className={cn(
        "group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl",
        "glass-1 border border-white/10 hover:border-white/20 transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        "active:scale-[0.98] select-none min-h-[96px]",
        className,
      )}
    >
      {/* Top row: Status indicator dot + Label + Arrow */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "w-2 h-2 rounded-full shrink-0 transition-transform group-hover:scale-125",
              styles.dotColor,
            )}
            aria-hidden="true"
          />
          <span className="text-xs sm:text-sm font-medium text-ink-muted truncate">{label}</span>
        </div>

        <ArrowUpRight
          className="w-3.5 h-3.5 text-ink-muted/50 group-hover:text-ink transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0"
          aria-hidden="true"
        />
      </div>

      {/* Bottom row: Large bold count numeral */}
      <div className="mt-3">
        <span
          className={cn(
            "font-mono tabular-nums text-2xl sm:text-3xl font-bold text-ink transition-colors",
            styles.numberHoverColor,
          )}
        >
          {count}
        </span>
      </div>
    </Link>
  );
}
