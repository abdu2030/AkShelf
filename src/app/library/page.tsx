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

// Expanded demo library titles matching seeded database records (Day 13)
const initialLibraryItems: MediaCardProps[] = demoLibraryItems;

export default function LibraryPage() {
  const [selectedType, setSelectedType] = useState<MediaTypeFilter>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("ALL");
  const [sortField, setSortField] = useState<SortField>("DATE_ADDED");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Calculate live counts across all tracked titles
  const counts: LibraryFilterCounts = {
    byType: {
      ALL: initialLibraryItems.length,
      MOVIE: initialLibraryItems.filter((i) => i.mediaType === "MOVIE").length,
      TV: initialLibraryItems.filter((i) => i.mediaType === "TV").length,
      ANIME: initialLibraryItems.filter((i) => i.mediaType === "ANIME").length,
    },
    byStatus: {
      ALL: initialLibraryItems.length,
      WATCHING: initialLibraryItems.filter((i) => i.status === "WATCHING").length,
      WATCHED: initialLibraryItems.filter((i) => i.status === "WATCHED").length,
      PLAN_TO_WATCH: initialLibraryItems.filter((i) => i.status === "PLAN_TO_WATCH").length,
      ON_HOLD: initialLibraryItems.filter((i) => i.status === "ON_HOLD").length,
      DROPPED: initialLibraryItems.filter((i) => i.status === "DROPPED").length,
    },
    total: initialLibraryItems.length,
  };

  // Filter items according to active type and status filters
  const filteredItems = initialLibraryItems.filter((item) => {
    const matchesType = selectedType === "ALL" || item.mediaType === selectedType;
    const matchesStatus = selectedStatus === "ALL" || item.status === selectedStatus;
    return matchesType && matchesStatus;
  });

  // Sort filtered items according to selected sort criteria
  const sortedItems = sortMediaItems(filteredItems, sortField, sortDirection);

  const handleResetFilters = () => {
    setSelectedType("ALL");
    setSelectedStatus("ALL");
  };

  return (
    <AppShell>
      <LibraryHeader
        totalCount={initialLibraryItems.length}
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
          hasAnyItems={initialLibraryItems.length > 0}
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
