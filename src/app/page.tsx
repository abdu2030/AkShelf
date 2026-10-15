import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatsBand, ContinueWatchingShelf, RecentlyWatchedSection } from "@/components/dashboard";
import { getDashboardStats, getContinueWatching, getRecentlyWatched } from "@/lib/dashboard";
import { auth } from "@/lib/auth";
import { LayoutDashboard, Film, Bookmark, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();
  const userId = session?.user?.id;

  const [stats, continueWatching, recentlyWatched] = await Promise.all([
    getDashboardStats({ userId }),
    getContinueWatching({ userId, limit: 4 }),
    getRecentlyWatched({ userId, limit: 8 }),
  ]);

  return (
    <AppShell>
      <div className="space-y-10 pb-16 max-w-6xl mx-auto">
        <PageHeader
          title="Your shelf"
          subtitle="Track what you watch, what is next, and your ratings."
        />

        {/* 1. Stat tiles: Live Database Counts (Week 6 Day 36) */}
        <section aria-label="Shelf summary statistics">
          <StatsBand stats={stats} />
        </section>

        {/* 2. Main content: Spec empty state if no tracked titles, or active dashboard shelves */}
        {stats.totalTracked === 0 ? (
          <EmptyState
            icon={<LayoutDashboard />}
            headline="Your shelf is empty"
            body="Search for a movie, show or anime to start."
            actionLabel="Search titles"
            actionHref="/search"
          />
        ) : (
          <div className="space-y-10">
            {/* Continue Watching Shelf (Week 6 Day 37) */}
            {continueWatching.length > 0 && <ContinueWatchingShelf items={continueWatching} />}

            {/* Recently Watched Section (Week 6 Day 37) */}
            {recentlyWatched.length > 0 && <RecentlyWatchedSection items={recentlyWatched} />}

            {/* Active Shelf Overview & Quick Navigation */}
            <section aria-label="Shelf quick actions" className="space-y-4">
              <div className="glass-2 rounded-2xl p-6 sm:p-7 border border-white/10 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold font-display text-ink tracking-tight">
                      Active Shelf Overview
                    </h2>
                    <p className="text-xs text-ink-muted">
                      Quickly navigate to your tracked collection, active watching queue, or
                      watchlist.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Link
                      href="/library"
                      className="px-4 py-2 min-h-[44px] rounded-xl text-xs font-semibold glass-1 border border-white/10 hover:border-white/20 text-ink hover:text-white transition-all inline-flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <span>View Library</span>
                      <ArrowRight className="w-3.5 h-3.5 text-ink-muted" aria-hidden="true" />
                    </Link>
                    <Link
                      href="/search"
                      className="px-4 py-2 min-h-[44px] rounded-xl text-xs font-semibold bg-accent text-white hover:bg-accent/90 transition-all inline-flex items-center justify-center gap-1.5 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <span>Search titles</span>
                    </Link>
                  </div>
                </div>

                {/* Quick Jump Shortcuts */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/5">
                  <Link
                    href="/library?status=WATCHING"
                    className="flex items-center gap-3 p-3.5 rounded-xl glass-1 hover:bg-white/[0.04] border border-white/5 hover:border-white/15 transition-all text-xs font-medium text-ink group min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-ink group-hover:text-amber-400 transition-colors">
                        Watching ({stats.watching})
                      </div>
                      <div className="text-[11px] text-ink-muted truncate">
                        Resume in-progress series
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/library?status=PLAN_TO_WATCH"
                    className="flex items-center gap-3 p-3.5 rounded-xl glass-1 hover:bg-white/[0.04] border border-white/5 hover:border-white/15 transition-all text-xs font-medium text-ink group min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                      <Bookmark className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-ink group-hover:text-sky-400 transition-colors">
                        Plan to Watch ({stats.planToWatch})
                      </div>
                      <div className="text-[11px] text-ink-muted truncate">
                        Explore your backlog queue
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/library?status=WATCHED"
                    className="flex items-center gap-3 p-3.5 rounded-xl glass-1 hover:bg-white/[0.04] border border-white/5 hover:border-white/15 transition-all text-xs font-medium text-ink group min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                      <Film className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-ink group-hover:text-emerald-400 transition-colors">
                        Watched ({stats.watched})
                      </div>
                      <div className="text-[11px] text-ink-muted truncate">
                        Review finished collection
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}
