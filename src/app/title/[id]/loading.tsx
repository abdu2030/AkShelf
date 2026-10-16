import React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function TitleDetailLoading() {
  return (
    <AppShell>
      <div className="space-y-8 pb-20">
        {/* Back Link Skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-28 rounded-md" />
        </div>

        {/* Hero Section Skeleton */}
        <div
          aria-hidden="true"
          className="relative rounded-3xl overflow-hidden glass-1 border border-white/5 p-6 sm:p-8"
        >
          <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
            {/* 2:3 Poster Frame Skeleton */}
            <div className="w-36 sm:w-48 lg:w-56 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden bg-white/5 animate-pulse" />

            {/* Details Skeleton */}
            <div className="flex-1 space-y-4 w-full">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-9 w-3/4 rounded-lg" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-16 rounded-md" />
                <Skeleton className="h-4 w-20 rounded-md" />
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
              <Skeleton className="h-20 w-full rounded-xl" />

              {/* Status & Rating Actions Skeleton */}
              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/5">
                <Skeleton className="h-10 w-36 rounded-full" />
                <Skeleton className="h-10 w-48 rounded-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Metadata & Season Episodes Skeleton */}
        <div aria-hidden="true" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-6 w-40 rounded-md" />
            <div className="glass-1 p-6 rounded-2xl border border-white/5 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-32 rounded-md" />
            <div className="glass-1 p-5 rounded-2xl border border-white/5 space-y-3">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-5/6 rounded-md" />
              <Skeleton className="h-4 w-2/3 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
