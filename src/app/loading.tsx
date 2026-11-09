import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import {
  StatsBandSkeleton,
  ContinueWatchingShelfSkeleton,
  RecentlyWatchedSectionSkeleton,
  AnalyticsStatsSkeleton,
} from "@/components/dashboard";

export default function DashboardLoading() {
  return (
    <AppShell>
      <div className="space-y-10 pb-16 max-w-6xl mx-auto">
        <PageHeader
          title="Your shelf"
          subtitle="Track what you watch, what is next, and your ratings."
        />

        <Skeleton className="w-full h-[300px] md:h-[340px] rounded-xl" />

        <div className="space-y-10">
          <ContinueWatchingShelfSkeleton />
          <RecentlyWatchedSectionSkeleton />
          <StatsBandSkeleton />
          <AnalyticsStatsSkeleton />
        </div>
      </div>
    </AppShell>
  );
}
