import React from "react";
import { cn } from "@/lib/utils/cn";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  eyebrow = "Your private archive",
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "archive-header flex flex-col sm:flex-row sm:items-end justify-between gap-5",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h1 className="page-heading text-ink">{title}</h1>
        {subtitle && (
          <p className="text-sm text-ink-soft mt-3 max-w-2xl leading-relaxed">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
