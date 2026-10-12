"use client";

import React from "react";
import { History, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface RecentSearchesListProps {
  searches: string[];
  onSelectSearch: (term: string) => void;
  onRemoveSearch: (term: string) => void;
  onClearAll: () => void;
  className?: string;
}

export function RecentSearchesList({
  searches,
  onSelectSearch,
  onRemoveSearch,
  onClearAll,
  className,
}: RecentSearchesListProps) {
  if (searches.length === 0) return null;

  return (
    <div className={cn("space-y-3 select-none", className)}>
      <div className="flex items-center justify-between text-xs font-semibold text-ink-muted px-1">
        <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
          <History className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
          Recent searches
        </span>
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-ink-muted hover:text-accent transition-colors cursor-pointer"
        >
          Clear all
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {searches.map((term) => (
          <div
            key={term}
            className={cn(
              "group inline-flex items-center h-8 pl-3 pr-1.5 rounded-full text-xs font-medium",
              "glass-1 border border-white/10 text-ink-soft hover:text-ink hover:bg-white/10 transition-colors",
            )}
          >
            <button
              type="button"
              onClick={() => onSelectSearch(term)}
              className="cursor-pointer mr-1.5 truncate max-w-[200px]"
            >
              {term}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveSearch(term);
              }}
              aria-label={`Remove ${term} from recent searches`}
              className="w-5 h-5 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-white/15 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
