import React from "react";
import Link from "next/link";
import { PlayCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ContinueWatchingItem } from "@/lib/dashboard";
import { ContinueWatchingCard, ContinueWatchingCardSkeleton } from "./continue-watching-card";
import { Skeleton } from "@/components/ui/skeleton";

export interface ContinueWatchingShelfProps {
  items: ContinueWatchingItem[];
  className?: string;
}

export function ContinueWatchingShelf({ items, className }: ContinueWatchingShelfProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Continue Watching"
      data-testid="continue-watching-shelf"
      className={cn("space-y-4", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <PlayCircle className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-xl font-bold font-display text-ink tracking-tight">
              Continue Watching
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-ink-muted">
              {items.length} in progress
            </span>
          </div>
        </div>

        <Link
          href="/library?status=WATCHING"
          className="text-xs font-semibold text-accent hover:text-white transition-colors inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>

      {/* Grid of Continue Watching Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {items.map((item) => (
          <ContinueWatchingCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

export function ContinueWatchingShelfSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      data-testid="continue-watching-shelf-skeleton"
      className={cn("space-y-4", className)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-44 h-6 rounded-md" />
        </div>
        <Skeleton className="w-16 h-4 rounded-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        <ContinueWatchingCardSkeleton />
        <ContinueWatchingCardSkeleton />
      </div>
    </div>
  );
}
