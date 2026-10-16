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
  const buttonRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      nextIndex = (index + 1) % FILTER_OPTIONS.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      nextIndex = (index - 1 + FILTER_OPTIONS.length) % FILTER_OPTIONS.length;
    }

    if (nextIndex !== null) {
      const nextOption = FILTER_OPTIONS[nextIndex];
      onSelect(nextOption.key);
      buttonRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Filter search results by media type"
      className={cn(
        "flex items-center gap-2 overflow-x-auto py-1 no-scrollbar select-none",
        className,
      )}
    >
      {FILTER_OPTIONS.map((option, index) => {
        const isSelected = selected === option.key;
        const Icon = option.icon;

        return (
          <button
            key={option.key}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelect(option.key)}
            onKeyDown={(e) => handleKeyDown(e, index)}
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
