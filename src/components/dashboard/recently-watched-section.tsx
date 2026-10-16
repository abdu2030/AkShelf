import React from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { RecentlyWatchedItem } from "@/lib/dashboard";
import { RecentlyWatchedCard, RecentlyWatchedCardSkeleton } from "./recently-watched-card";
import { Skeleton } from "@/components/ui/skeleton";

export interface RecentlyWatchedSectionProps {
  items: RecentlyWatchedItem[];
  className?: string;
}

export function RecentlyWatchedSection({ items, className }: RecentlyWatchedSectionProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Recently Watched"
      data-testid="recently-watched-section"
      className={cn("space-y-4", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-xl font-bold font-display text-ink tracking-tight">
              Recently Watched
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-ink-muted">
              {items.length} titles
            </span>
          </div>
        </div>

        <Link
          href="/history"
          className="text-xs font-semibold text-accent hover:text-white transition-colors inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
        >
          <span>View all history</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>

      {/* Grid of Recently Watched Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
        {items.map((item) => (
          <RecentlyWatchedCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

export function RecentlyWatchedSectionSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      data-testid="recently-watched-section-skeleton"
      className={cn("space-y-4", className)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-40 h-6 rounded-md" />
        </div>
        <Skeleton className="w-16 h-4 rounded-md" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
        <RecentlyWatchedCardSkeleton />
        <RecentlyWatchedCardSkeleton />
        <RecentlyWatchedCardSkeleton />
        <RecentlyWatchedCardSkeleton />
      </div>
    </div>
  );
}
