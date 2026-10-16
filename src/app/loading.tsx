import React from "react";
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

        <section aria-label="Loading shelf summary statistics">
          <StatsBandSkeleton />
        </section>

        <div className="space-y-10">
          <ContinueWatchingShelfSkeleton />
          <RecentlyWatchedSectionSkeleton />
          <AnalyticsStatsSkeleton />
        </div>
      </div>
    </AppShell>
  );
}
