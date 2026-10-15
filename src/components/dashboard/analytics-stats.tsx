import React from "react";
import Link from "next/link";
import { Clapperboard, Tv, Sparkles, Star, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { DashboardAnalytics } from "@/lib/dashboard";

export interface AnalyticsStatsProps {
  analytics: DashboardAnalytics;
  className?: string;
}

export function AnalyticsStats({ analytics, className }: AnalyticsStatsProps) {
  const { countsByType, averageRating, ratedCount, totalWatchedEpisodes } = analytics;

  return (
    <section
      aria-label="Shelf Analytics"
      data-testid="shelf-analytics"
      className={cn("space-y-4", className)}
    >
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold font-display text-ink tracking-tight">Shelf Analytics</h2>
        <p className="text-xs text-ink-muted">
          Collection breakdown, personal rating average, and episode tracking count.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* 1. Format Breakdown Card */}
        <div className="glass-1 rounded-2xl p-5 border border-white/10 flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Collection by Format
            </h3>
            <p className="text-xs text-ink-muted">Direct links to format shelves</p>
          </div>

          <div className="space-y-2">
            <Link
              href="/library?type=MOVIE"
              className="flex items-center justify-between p-2.5 rounded-xl glass-inset hover:bg-white/[0.06] transition-all text-xs font-medium text-ink group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={`View ${countsByType.movies} Movies in library`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-ink-muted group-hover:text-white transition-colors">
                  <Clapperboard className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
                <span>Movies</span>
              </div>
              <span className="font-mono tabular-nums font-bold text-ink group-hover:text-white transition-colors">
                {countsByType.movies}
              </span>
            </Link>

            <Link
              href="/library?type=TV"
              className="flex items-center justify-between p-2.5 rounded-xl glass-inset hover:bg-white/[0.06] transition-all text-xs font-medium text-ink group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={`View ${countsByType.tv} TV Shows in library`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-ink-muted group-hover:text-white transition-colors">
                  <Tv className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
                <span>TV Shows</span>
              </div>
              <span className="font-mono tabular-nums font-bold text-ink group-hover:text-white transition-colors">
                {countsByType.tv}
              </span>
            </Link>

            <Link
              href="/library?type=ANIME"
              className="flex items-center justify-between p-2.5 rounded-xl glass-inset hover:bg-white/[0.06] transition-all text-xs font-medium text-ink group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={`View ${countsByType.anime} Anime in library`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-ink-muted group-hover:text-white transition-colors">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
                <span>Anime</span>
              </div>
              <span className="font-mono tabular-nums font-bold text-ink group-hover:text-white transition-colors">
                {countsByType.anime}
              </span>
            </Link>
          </div>
        </div>

        {/* 2. Average Personal Rating Card */}
        <div className="glass-1 rounded-2xl p-5 border border-white/10 flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Average Personal Rating
            </h3>
            <p className="text-xs text-ink-muted">Mean rating across your rated titles</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <Star
                className="w-6 h-6 fill-amber-400 text-amber-400 self-center"
                aria-hidden="true"
              />
              <span className="font-mono tabular-nums text-3xl sm:text-4xl font-bold text-ink">
                {averageRating !== null ? averageRating.toFixed(1) : "—"}
              </span>
              {averageRating !== null && (
                <span className="text-sm font-semibold text-ink-muted">/ 10</span>
              )}
            </div>
            <p className="text-xs text-ink-muted font-medium">
              {ratedCount > 0
                ? `${ratedCount} ${ratedCount === 1 ? "title" : "titles"} rated`
                : "No titles rated yet"}
            </p>
          </div>

          <div className="pt-2 border-t border-white/5">
            <Link
              href="/library?sort=rating-desc"
              className="text-xs font-semibold text-accent hover:text-white transition-colors inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
            >
              <span>View highest rated</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* 3. Total Watched Episodes Card */}
        <div className="glass-1 rounded-2xl p-5 border border-white/10 flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Total Watched Episodes
            </h3>
            <p className="text-xs text-ink-muted">Logged across TV and anime series</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 self-center" aria-hidden="true" />
              <span className="font-mono tabular-nums text-3xl sm:text-4xl font-bold text-ink">
                {totalWatchedEpisodes}
              </span>
              <span className="text-sm font-semibold text-ink-muted">episodes</span>
            </div>
            <p className="text-xs text-ink-muted font-medium">Recorded in your episode watch log</p>
          </div>

          <div className="pt-2 border-t border-white/5">
            <Link
              href="/history"
              className="text-xs font-semibold text-accent hover:text-white transition-colors inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
            >
              <span>View watch history</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
