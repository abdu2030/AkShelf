import React from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./button";

export interface EmptyStateProps {
  icon: React.ReactNode;
  headline: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  icon,
  headline,
  body,
  actionLabel,
  onAction,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-4 max-w-md mx-auto select-none",
        className,
      )}
    >
      <div className="relative mb-6 flex items-center justify-center">
        {/* 96px glass-2 circle with faint indigo glow */}
        <div className="h-24 w-24 rounded-full glass-2 flex items-center justify-center shadow-[0_0_24px_rgba(99,102,241,0.18)] border border-white/16 text-accent">
          <span className="[&_svg]:h-12 [&_svg]:w-12 text-accent" aria-hidden="true">
            {icon}
          </span>
        </div>
      </div>

      <h3 className="text-lg md:text-xl font-semibold text-ink tracking-tight mb-2">{headline}</h3>

      {body && <p className="text-sm md:text-base text-ink-soft leading-relaxed mb-6">{body}</p>}

      {actionLabel && (
        <div>
          {actionHref ? (
            <a href={actionHref}>
              <Button variant="primary" size="large">
                {actionLabel}
              </Button>
            </a>
          ) : (
            <Button variant="primary" size="large" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
