"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { LibraryHeader } from "@/components/library/library-header";
import {
  MediaTypeFilter,
  StatusFilter,
  LibraryFilterCounts,
  SortField,
  SortDirection,
  sortMediaItems,
  LibraryEmptyState,
} from "@/components/library";
import { MediaGrid } from "@/components/title/media-grid";
import { MediaCardProps } from "@/components/title/media-card";
import { demoLibraryItems } from "@/lib/data/demo-titles";

export interface LibraryViewProps {
  initialItems?: MediaCardProps[];
}

export function LibraryView({ initialItems = demoLibraryItems }: LibraryViewProps) {
  const [selectedType, setSelectedType] = useState<MediaTypeFilter>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("ALL");
  const [sortField, setSortField] = useState<SortField>("RECENTLY_UPDATED");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Calculate live counts across all tracked titles
  const counts: LibraryFilterCounts = {
    byType: {
      ALL: initialItems.length,
      MOVIE: initialItems.filter((i) => i.mediaType === "MOVIE").length,
      TV: initialItems.filter((i) => i.mediaType === "TV").length,
      ANIME: initialItems.filter((i) => i.mediaType === "ANIME").length,
    },
    byStatus: {
      ALL: initialItems.length,
      WATCHING: initialItems.filter((i) => i.status === "WATCHING").length,
      WATCHED: initialItems.filter((i) => i.status === "WATCHED").length,
      PLAN_TO_WATCH: initialItems.filter((i) => i.status === "PLAN_TO_WATCH").length,
      ON_HOLD: initialItems.filter((i) => i.status === "ON_HOLD").length,
      DROPPED: initialItems.filter((i) => i.status === "DROPPED").length,
    },
    total: initialItems.length,
  };

  // Filter items according to active type and status filters
  const filteredItems = initialItems.filter((item) => {
    const matchesType = selectedType === "ALL" || item.mediaType === selectedType;
    const matchesStatus = selectedStatus === "ALL" || item.status === selectedStatus;
    return matchesType && matchesStatus;
  });

  // Sort filtered items according to selected sort criteria (Day 40)
  const sortedItems = sortMediaItems(filteredItems, sortField, sortDirection);

  const handleResetFilters = () => {
    setSelectedType("ALL");
    setSelectedStatus("ALL");
  };

  return (
    <AppShell>
      <LibraryHeader
        totalCount={initialItems.length}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        counts={counts}
        onResetFilters={handleResetFilters}
        sortField={sortField}
        onSortFieldChange={setSortField}
        sortDirection={sortDirection}
        onSortDirectionChange={setSortDirection}
      />

      {sortedItems.length > 0 ? (
        <MediaGrid items={sortedItems} />
      ) : (
        <LibraryEmptyState
          hasAnyItems={initialItems.length > 0}
          selectedType={selectedType}
          selectedStatus={selectedStatus}
          onResetFilters={handleResetFilters}
          onClearTypeFilter={() => setSelectedType("ALL")}
          onClearStatusFilter={() => setSelectedStatus("ALL")}
        />
      )}
    </AppShell>
  );
}
