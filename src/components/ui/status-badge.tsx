import React from "react";
import { CheckCircle, PlayCircle, Bookmark, PauseCircle, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type WatchStatusType = "WATCHED" | "WATCHING" | "PLAN_TO_WATCH" | "ON_HOLD" | "DROPPED";

export interface StatusBadgeProps {
  status: WatchStatusType;
  variant?: "full" | "dot" | "inline";
  detail?: string; // e.g. "9/10" or "S2 E4"
  className?: string;
}

export const statusConfig: Record<
  WatchStatusType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
    badgeClass: string;
    textClass: string;
    dotClass: string;
  }
> = {
  WATCHED: {
    label: "Watched",
    icon: CheckCircle,
    badgeClass: "bg-status-watched-bg text-status-watched-text border border-status-watched-dot/25",
    textClass: "text-status-watched-text",
    dotClass: "text-status-watched-dot",
  },
  WATCHING: {
    label: "Watching",
    icon: PlayCircle,
    badgeClass:
      "bg-status-watching-bg text-status-watching-text border border-status-watching-dot/25",
    textClass: "text-status-watching-text",
    dotClass: "text-status-watching-dot",
  },
  PLAN_TO_WATCH: {
    label: "Plan to Watch",
    icon: Bookmark,
    badgeClass: "bg-status-plan-bg text-status-plan-text border border-status-plan-dot/25",
    textClass: "text-status-plan-text",
    dotClass: "text-status-plan-dot",
  },
  ON_HOLD: {
    label: "On Hold",
    icon: PauseCircle,
    badgeClass: "bg-status-hold-bg text-status-hold-text border border-status-hold-dot/25",
    textClass: "text-status-hold-text",
    dotClass: "text-status-hold-dot",
  },
  DROPPED: {
    label: "Dropped",
    icon: MinusCircle,
    badgeClass: "bg-status-dropped-bg text-status-dropped-text border border-status-dropped-dot/25",
    textClass: "text-status-dropped-text",
    dotClass: "text-status-dropped-dot",
  },
};

export function StatusBadge({ status, variant = "full", detail, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const fullText = detail ? `${config.label} - ${detail}` : config.label;

  if (variant === "dot") {
    return (
      <div
        className={cn(
          "h-7 w-7 rounded-full bg-[#0b0d1a]/85 backdrop-blur-none flex items-center justify-center shadow-md",
          className,
        )}
        aria-label={fullText}
        title={fullText}
      >
        <Icon className={cn("h-4 w-4", config.dotClass)} aria-hidden="true" />
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <span className={cn("text-xs font-semibold", config.textClass, className)}>{fullText}</span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-semibold tracking-wide select-none",
        config.badgeClass,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{fullText}</span>
    </span>
  );
}
