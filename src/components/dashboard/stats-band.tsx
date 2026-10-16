import React from "react";
import { cn } from "@/lib/utils/cn";
import { StatTile, StatTileSkeleton } from "./stat-tile";
import { DashboardStats } from "@/lib/dashboard";

export interface StatsBandProps {
  stats: DashboardStats;
  className?: string;
}

export function StatsBand({ stats, className }: StatsBandProps) {
  return (
    <div
      data-testid="stats-band"
      className={cn("grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4", className)}
    >
      <StatTile
        label="Total tracked"
        count={stats.totalTracked}
        href="/library"
        variant="total"
        testId="stat-tile-total"
      />
      <StatTile
        label="Watched"
        count={stats.watched}
        href="/library?status=WATCHED"
        variant="watched"
        testId="stat-tile-watched"
      />
      <StatTile
        label="Watching"
        count={stats.watching}
        href="/library?status=WATCHING"
        variant="watching"
        testId="stat-tile-watching"
      />
      <StatTile
        label="Plan to Watch"
        count={stats.planToWatch}
        href="/library?status=PLAN_TO_WATCH"
        variant="plan_to_watch"
        testId="stat-tile-plan-to-watch"
      />
    </div>
  );
}

export function StatsBandSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      data-testid="stats-band-skeleton"
      className={cn("grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4", className)}
    >
      <StatTileSkeleton />
      <StatTileSkeleton />
      <StatTileSkeleton />
      <StatTileSkeleton />
    </div>
  );
}
