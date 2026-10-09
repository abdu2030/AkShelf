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
    badgeClass:
      "bg-[rgba(52,211,153,0.22)] text-[#a7f3d0] dark:bg-[rgba(52,211,153,0.22)] dark:text-[#a7f3d0] light:bg-[rgba(16,185,129,0.14)] light:text-[#065f46]",
    textClass: "text-[#a7f3d0] dark:text-[#a7f3d0] light:text-[#065f46]",
    dotClass: "text-[#34d399] dark:text-[#34d399] light:text-[#065f46]",
  },
  WATCHING: {
    label: "Watching",
    icon: PlayCircle,
    badgeClass:
      "bg-[rgba(56,189,248,0.22)] text-[#bae6fd] dark:bg-[rgba(56,189,248,0.22)] dark:text-[#bae6fd] light:bg-[rgba(14,165,233,0.14)] light:text-[#075985]",
    textClass: "text-[#bae6fd] dark:text-[#bae6fd] light:text-[#075985]",
    dotClass: "text-[#38bdf8] dark:text-[#38bdf8] light:text-[#075985]",
  },
  PLAN_TO_WATCH: {
    label: "Plan to Watch",
    icon: Bookmark,
    badgeClass:
      "bg-[rgba(167,139,250,0.22)] text-[#ddd6fe] dark:bg-[rgba(167,139,250,0.22)] dark:text-[#ddd6fe] light:bg-[rgba(139,92,246,0.14)] light:text-[#5b21b6]",
    textClass: "text-[#ddd6fe] dark:text-[#ddd6fe] light:text-[#5b21b6]",
    dotClass: "text-[#a78bfa] dark:text-[#a78bfa] light:text-[#5b21b6]",
  },
  ON_HOLD: {
    label: "On Hold",
    icon: PauseCircle,
    badgeClass:
      "bg-[rgba(251,191,36,0.22)] text-[#fde68a] dark:bg-[rgba(251,191,36,0.22)] dark:text-[#fde68a] light:bg-[rgba(245,158,11,0.14)] light:text-[#78350f]",
    textClass: "text-[#fde68a] dark:text-[#fde68a] light:text-[#78350f]",
    dotClass: "text-[#fbbf24] dark:text-[#fbbf24] light:text-[#78350f]",
  },
  DROPPED: {
    label: "Dropped",
    icon: MinusCircle,
    badgeClass:
      "bg-[rgba(148,163,184,0.22)] text-[#e2e8f0] dark:bg-[rgba(148,163,184,0.22)] dark:text-[#e2e8f0] light:bg-[rgba(100,116,139,0.14)] light:text-[#334155]",
    textClass: "text-[#e2e8f0] dark:text-[#e2e8f0] light:text-[#334155]",
    dotClass: "text-[#94a3b8] dark:text-[#94a3b8] light:text-[#334155]",
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
