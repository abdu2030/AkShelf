"use client";

import React from "react";
import { Check, Clapperboard, Tv, Sparkles, Layers } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { MediaType } from "@/lib/metadata/types";

export type SearchFilterType = MediaType | "ALL";

interface FilterOption {
  key: SearchFilterType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FILTER_OPTIONS: FilterOption[] = [
  { key: "ALL", label: "All", icon: Layers },
  { key: "MOVIE", label: "Movies", icon: Clapperboard },
  { key: "TV", label: "TV", icon: Tv },
  { key: "ANIME", label: "Anime", icon: Sparkles },
];

export interface SearchFilterChipsProps {
  selected: SearchFilterType;
  onSelect: (type: SearchFilterType) => void;
  className?: string;
}

export function SearchFilterChips({ selected, onSelect, className }: SearchFilterChipsProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Filter search results by media type"
      className={cn(
        "flex items-center gap-2 overflow-x-auto py-1 no-scrollbar select-none",
        className,
      )}
    >
      {FILTER_OPTIONS.map((option) => {
        const isSelected = selected === option.key;
        const Icon = option.icon;

        return (
          <button
            key={option.key}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(option.key)}
            className={cn(
              "h-10 px-4 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer",
              "flex items-center gap-2 shrink-0 border",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              isSelected
                ? "bg-accent-fill text-white border-transparent shadow-sm"
                : "glass-1 border-white/10 text-ink-muted hover:text-ink hover:bg-white/10 dark:hover:bg-white/8",
            )}
          >
            {isSelected ? (
              <Check className="w-3.5 h-3.5 stroke-[3] text-white shrink-0" aria-hidden="true" />
            ) : (
              <Icon className="w-4 h-4 text-ink-muted shrink-0" aria-hidden="true" />
            )}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
