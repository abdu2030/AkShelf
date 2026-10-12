"use client";

import React, { forwardRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface SearchFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onValueChange: (value: string) => void;
  onClear?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  (
    {
      value,
      onValueChange,
      onClear,
      isLoading = false,
      placeholder = "Search movies, shows, anime...",
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        className={cn(
          "relative flex items-center h-12 w-full rounded-full transition-all duration-200 select-none",
          "glass-2 border border-white/12 dark:border-white/10 shadow-sm",
          "focus-within:ring-2 focus-within:ring-accent focus-within:border-accent",
          className,
        )}
      >
        {/* Leading Search Icon */}
        <div className="pl-4 pr-2 flex items-center justify-center text-ink-muted pointer-events-none">
          <Search className="w-5 h-5 text-ink-soft shrink-0" aria-hidden="true" />
        </div>

        {/* Search Input */}
        <input
          ref={ref}
          type="text"
          role="searchbox"
          aria-label="Search titles"
          aria-busy={isLoading}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "flex-1 h-full bg-transparent text-sm sm:text-base text-ink placeholder:text-ink-muted",
            "outline-none border-none px-1",
          )}
          {...props}
        />

        {/* Trailing Controls: Loading Spinner, Clear Button, Keyboard Hint */}
        <div className="pr-3 flex items-center gap-2">
          {isLoading ? (
            <div
              data-testid="search-spinner"
              className="w-7 h-7 flex items-center justify-center text-accent animate-spin"
            >
              <Loader2 className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">Searching...</span>
            </div>
          ) : value ? (
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear search input"
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer",
                "text-ink-muted hover:text-ink hover:bg-white/12 dark:hover:bg-white/10",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              )}
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1 pointer-events-none">
              <kbd className="px-2 py-0.5 text-[11px] font-mono font-medium rounded-md glass-1 border border-white/10 text-ink-muted shadow-sm">
                /
              </kbd>
            </div>
          )}
        </div>
      </div>
    );
  },
);

SearchField.displayName = "SearchField";
