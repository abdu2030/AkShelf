import React from "react";
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
      </div>
    </AppShell>
  );
}
