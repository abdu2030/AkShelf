import React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { MediaGridSkeleton } from "@/components/title/media-grid";
import { Skeleton } from "@/components/ui/skeleton";

export default function LibraryLoading() {
  return (
    <AppShell>
      <div className="space-y-6 pb-16">
        <PageHeader
          title="My Library"
          subtitle="Browse, filter, and sort your entire tracked collection."
        />

        {/* Skeleton Filter Bar */}
        <div
          aria-hidden="true"
          className="glass-1 p-4 md:p-5 rounded-[20px] border border-white/5 space-y-3.5 mb-6 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-20 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-28 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-white/5">
            <Skeleton className="h-8 w-16 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-full" />
          </div>
        </div>

        {/* Skeleton Media Grid */}
        <MediaGridSkeleton count={12} />
      </div>
    </AppShell>
  );
}
