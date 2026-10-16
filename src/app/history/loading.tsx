import React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function HistoryLoading() {
  return (
    <AppShell>
      <div className="space-y-8 pb-12">
        <PageHeader
          title="History"
          subtitle="Chronological activity log of what you watched and rated."
        />

        <div aria-hidden="true" className="space-y-6">
          {/* Day Group 1 */}
          <div className="space-y-2.5">
            <Skeleton className="h-4 w-28 rounded-md mb-2" />
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="glass-1 p-3.5 sm:p-4 rounded-xl border border-white/5 flex items-center gap-3.5"
              >
                <Skeleton className="w-10 h-14 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3 rounded-md" />
                  <Skeleton className="h-3 w-1/4 rounded-md" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full shrink-0" />
              </div>
            ))}
          </div>

          {/* Day Group 2 */}
          <div className="space-y-2.5">
            <Skeleton className="h-4 w-36 rounded-md mb-2" />
            {[1, 2].map((i) => (
              <div
                key={i}
                className="glass-1 p-3.5 sm:p-4 rounded-xl border border-white/5 flex items-center gap-3.5"
              >
                <Skeleton className="w-10 h-14 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3 rounded-md" />
                  <Skeleton className="h-3 w-1/4 rounded-md" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
