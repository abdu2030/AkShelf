import React from "react";
import { cn } from "@/lib/utils/cn";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "w-full flex items-center justify-between gap-4 py-4 md:py-6 mb-6",
        "border-b border-white/8 dark:border-white/10",
        className,
      )}
    >
      <div className="flex flex-col">
        <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-ink">
          {title}
        </h1>
        {subtitle && <p className="text-sm md:text-base text-ink-soft mt-1">{subtitle}</p>}
      </div>

      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </header>
  );
}
