"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import {
  LibraryFilters,
  MediaTypeFilter,
  StatusFilter,
  LibraryFilterCounts,
} from "./library-filters";
import { SortField, SortDirection } from "@/lib/utils/sort";

export interface LibraryHeaderProps {
  title?: string;
  subtitle?: string;
  totalCount?: number;
  selectedType: MediaTypeFilter;
  onTypeChange: (type: MediaTypeFilter) => void;
  selectedStatus: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  counts?: LibraryFilterCounts;
  onResetFilters?: () => void;
  sortField?: SortField;
  onSortFieldChange?: (field: SortField) => void;
  sortDirection?: SortDirection;
  onSortDirectionChange?: (direction: SortDirection) => void;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Combined Library view header and filter controls (Day 10 & Day 11).
 * Integrates title, subtitle, title count indicator, filters, and sorting controls.
 */
export function LibraryHeader({
  title = "My Library",
  subtitle = "All tracked titles filtered by status and media type.",
  totalCount,
  selectedType,
  onTypeChange,
  selectedStatus,
  onStatusChange,
  counts,
  onResetFilters,
  sortField,
  onSortFieldChange,
  sortDirection,
  onSortDirectionChange,
  actions,
  className,
}: LibraryHeaderProps) {
  const displayTotal = totalCount ?? counts?.total;

  return (
    <div className={cn("w-full space-y-4 mb-6", className)} data-testid="library-header">
      {/* Top Banner / Heading */}
      <header
        className={cn(
          "w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 md:p-6",
          "glass-1 rounded-[20px] border border-white/10 dark:border-white/12 shadow-sm transition-all",
        )}
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-ink drop-shadow-sm">
              {title}
            </h1>
            {displayTotal !== undefined && (
              <span
                data-testid="library-total-count"
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent-fill/15 text-accent border border-accent/20"
              >
                {displayTotal} {displayTotal === 1 ? "title" : "titles"}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm md:text-base text-ink-soft font-medium mt-1 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            {actions}
          </div>
        )}
      </header>

      {/* Filter and Sort bar */}
      <LibraryFilters
        selectedType={selectedType}
        onTypeChange={onTypeChange}
        selectedStatus={selectedStatus}
        onStatusChange={onStatusChange}
        counts={counts}
        onResetFilters={onResetFilters}
        sortField={sortField}
        onSortFieldChange={onSortFieldChange}
        sortDirection={sortDirection}
        onSortDirectionChange={onSortDirectionChange}
      />
    </div>
  );
}
