import React from "react";
import { CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { HistoryList } from "@/components/history";
import { getWatchHistory } from "@/lib/history/service";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const { items, totalCount, hasMore } = await getWatchHistory({
    limit: 50,
    offset: 0,
  });

  return (
    <AppShell>
      <div className="space-y-8 pb-12">
        <PageHeader
          title="History"
          subtitle="Chronological activity log of what you watched and rated."
        />

        <HistoryList initialItems={items} totalCount={totalCount} initialHasMore={hasMore} />

        {/* Milestone Indicator */}
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 flex items-center gap-3 text-xs sm:text-sm text-ink-soft">
          <CheckCircle2 className="w-5 h-5 text-accent shrink-0" aria-hidden="true" />
          <span>
            <strong>Week 4 Milestones:</strong> Chronological watch history activity feed, day
            groupings, and action logging are active for <strong>Days 26–27</strong>.
          </span>
        </div>
      </div>
    </AppShell>
  );
}
