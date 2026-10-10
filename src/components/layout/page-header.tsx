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
        "w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 md:p-6 mb-6",
        "glass-1 rounded-[20px] border border-white/10 dark:border-white/12 shadow-sm transition-all",
        className,
      )}
    >
      <div className="flex flex-col">
        <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-ink drop-shadow-sm">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm md:text-base text-ink-soft font-medium mt-1 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">{actions}</div>
      )}
    </header>
  );
}
