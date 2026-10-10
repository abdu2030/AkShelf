"use client";

import React from "react";
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { SortField, SortDirection, sortOptions } from "@/lib/utils/sort";

export interface LibrarySortProps {
  sortField: SortField;
  onSortFieldChange: (field: SortField) => void;
  sortDirection: SortDirection;
  onSortDirectionChange: (direction: SortDirection) => void;
  className?: string;
}

/**
 * Library sorting control (Day 11).
 * Allows sorting by Date Added, Title, Rating, and Release Year with direction toggle.
 */
export function LibrarySort({
  sortField,
  onSortFieldChange,
  sortDirection,
  onSortDirectionChange,
  className,
}: LibrarySortProps) {
  const toggleDirection = () => {
    onSortDirectionChange(sortDirection === "asc" ? "desc" : "asc");
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextField = e.target.value as SortField;
    onSortFieldChange(nextField);
    // Switch to the default recommended direction for that field
    const option = sortOptions.find((opt) => opt.field === nextField);
    if (option) {
      onSortDirectionChange(option.defaultDirection);
    }
  };

  return (
    <div data-testid="library-sort" className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="text-xs font-semibold text-ink-muted hidden sm:inline select-none">
        Sort:
      </span>

      {/* Field Selector */}
      <div className="relative inline-flex items-center">
        <select
          value={sortField}
          onChange={handleFieldChange}
          aria-label="Sort library titles by"
          data-testid="sort-field-select"
          className={cn(
            "h-8 pl-3 pr-7 rounded-full text-xs font-semibold cursor-pointer appearance-none select-none",
            "bg-white/6 hover:bg-white/10 text-ink border border-white/12 transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
            "dark:bg-white/6 dark:hover:bg-white/10",
          )}
        >
          {sortOptions.map((opt) => (
            <option
              key={opt.field}
              value={opt.field}
              className="bg-[#171a31] text-white dark:bg-[#171a31] dark:text-white"
            >
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom Chevron Indicator */}
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted text-[10px]">
          ▼
        </span>
      </div>

      {/* Direction Toggle Button */}
      <button
        type="button"
        onClick={toggleDirection}
        data-testid="sort-direction-button"
        aria-label={
          sortDirection === "asc"
            ? "Sort ascending (switch to descending)"
            : "Sort descending (switch to ascending)"
        }
        title={sortDirection === "asc" ? "Ascending order" : "Descending order"}
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center cursor-pointer select-none",
          "bg-white/6 hover:bg-white/10 text-ink border border-white/12 transition-all active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        )}
      >
        {sortDirection === "asc" ? (
          <ArrowUpNarrowWide className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
        ) : (
          <ArrowDownWideNarrow className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
