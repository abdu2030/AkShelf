"use client";

import React, { useState, useTransition } from "react";
import { History, Loader2, Sparkles, Film, Tv, Trash2 } from "lucide-react";
import { HistoryItem } from "@/lib/history/types";
import { groupHistoryByDay } from "@/lib/history/format";
import { HistoryRow } from "./history-row";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { fetchMoreHistoryAction, clearWatchHistoryAction } from "@/actions/history";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";

export interface HistoryListProps {
  initialItems: HistoryItem[];
  totalCount: number;
  initialHasMore: boolean;
  className?: string;
}

type MediaTypeFilter = "ALL" | "MOVIE" | "TV" | "ANIME";

export function HistoryList({ initialItems, initialHasMore, className }: HistoryListProps) {
  const [items, setItems] = useState<HistoryItem[]>(initialItems);
  const [activeFilter, setActiveFilter] = useState<MediaTypeFilter>("ALL");
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const { showToast } = useToast();

  const handleClearHistory = async () => {
    setIsClearing(true);
    try {
      const result = await clearWatchHistoryAction();
      if (result.success) {
        setItems([]);
        setHasMore(false);
        setShowClearModal(false);
        showToast({
          type: "success",
          message: "Watch history cleared successfully.",
        });
      } else {
        showToast({
          type: "error",
          message: result.error || "Failed to clear watch history.",
        });
      }
    } catch {
      showToast({
        type: "error",
        message: "An unexpected error occurred while clearing history.",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleFilterChange = (filter: MediaTypeFilter) => {
    setActiveFilter(filter);
    startTransition(async () => {
      const result = await fetchMoreHistoryAction({
        typeFilter: filter,
        limit: 50,
        offset: 0,
      });
      setItems(result.items);
      setHasMore(result.hasMore);
    });
  };

  const handleLoadMore = () => {
    startTransition(async () => {
      const result = await fetchMoreHistoryAction({
        typeFilter: activeFilter,
        limit: 50,
        offset: items.length,
      });
      setItems((prev) => [...prev, ...result.items]);
      setHasMore(result.hasMore);
    });
  };

  const dayGroups = groupHistoryByDay(items);

  return (
    <div className={cn("space-y-6", className)}>
      {/* 1. Media Type Filter Chips & Clear Action */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filter history by media type"
        >
          <Chip
            selected={activeFilter === "ALL"}
            onClick={() => handleFilterChange("ALL")}
            aria-label="Show all history"
          >
            All
          </Chip>
          <Chip
            selected={activeFilter === "MOVIE"}
            onClick={() => handleFilterChange("MOVIE")}
            icon={<Film className="w-4 h-4" />}
            aria-label="Filter movies only"
          >
            Movies
          </Chip>
          <Chip
            selected={activeFilter === "TV"}
            onClick={() => handleFilterChange("TV")}
            icon={<Tv className="w-4 h-4" />}
            aria-label="Filter TV shows only"
          >
            TV
          </Chip>
          <Chip
            selected={activeFilter === "ANIME"}
            onClick={() => handleFilterChange("ANIME")}
            icon={<Sparkles className="w-4 h-4" />}
            aria-label="Filter anime only"
          >
            Anime
          </Chip>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={() => setShowClearModal(true)}
            disabled={isPending || isClearing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50"
            aria-label="Clear history"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Clear history</span>
          </button>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showClearModal} onOpenChange={setShowClearModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear watch history?</DialogTitle>
            <DialogDescription>
              This will permanently remove all activity entries from your history timeline. Your
              library titles, statuses, ratings, and episode progress will remain untouched.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              disabled={isClearing}
              className="px-4 py-2 rounded-xl text-xs font-semibold glass-1 hover:glass-2 border border-white/10 text-ink-muted hover:text-ink cursor-pointer disabled:opacity-50"
            >
              Cancel
            </DialogClose>
            <button
              type="button"
              onClick={handleClearHistory}
              disabled={isClearing}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 cursor-pointer disabled:opacity-50"
            >
              {isClearing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Clear history</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Activity List or Empty State */}
      {items.length === 0 ? (
        <EmptyState
          icon={<History className="w-8 h-8 text-ink-muted" />}
          headline="Nothing here yet"
          body="Your activity will appear as you track titles."
          actionLabel="Search titles"
          actionHref="/search"
        />
      ) : (
        <div className="space-y-6">
          {/* Main List Panel: Level 1 Glass with Day Groups */}
          <div className="glass-1 rounded-[24px] overflow-hidden border border-white/10 shadow-lg">
            {dayGroups.map((group) => (
              <div key={group.dateKey} className="divide-y divide-white/5">
                {/* Sticky Day Heading */}
                <div className="px-4 py-2.5 bg-surface/80 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-accent border-b border-white/5 sticky top-0 z-10 flex items-center justify-between">
                  <span>{group.dayLabel}</span>
                  <span className="text-[10px] text-ink-muted font-mono font-medium">
                    {group.items.length} {group.items.length === 1 ? "event" : "events"}
                  </span>
                </div>

                {/* Day's Inset Rows */}
                <div className="divide-y divide-white/5">
                  {group.items.map((item) => (
                    <HistoryRow key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 3. Pagination: Show Earlier Activity Button (Spec Page 41) */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold glass-1 hover:glass-2 border border-white/12 text-ink-base transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />}
                Show earlier activity
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
