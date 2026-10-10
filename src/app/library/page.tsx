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
} from "@/components/library";
import { MediaGrid } from "@/components/title/media-grid";
import { MediaCardProps } from "@/components/title/media-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Library, FilterX } from "lucide-react";

// Demo library titles matching initial seeded database records
const initialLibraryItems: MediaCardProps[] = [
  {
    id: "demo-inception",
    title: "Inception",
    mediaType: "MOVIE",
    year: 2010,
    posterUrl: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    status: "WATCHED",
    rating: 9.5,
    addedAt: "2026-03-01T12:00:00Z",
  },
  {
    id: "demo-breaking-bad",
    title: "Breaking Bad",
    mediaType: "TV",
    year: 2008,
    posterUrl: "https://image.tmdb.org/t/p/w500/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg",
    status: "WATCHING",
    season: 1,
    episode: 1,
    currentEpisode: 1,
    totalEpisodes: 7,
    addedAt: "2026-03-15T10:00:00Z",
  },
  {
    id: "demo-aot",
    title: "Attack on Titan",
    mediaType: "ANIME",
    year: 2013,
    posterUrl:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-73peebRJWhFw.jpg",
    status: "PLAN_TO_WATCH",
    rating: 8.9,
    addedAt: "2026-04-01T08:00:00Z",
  },
];

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
      ) : initialLibraryItems.length === 0 ? (
        <EmptyState
          icon={<Library />}
          headline="Nothing on your shelf yet"
          body="Titles you track will show up here."
          actionLabel="Search titles"
          actionHref="/search"
        />
      ) : (
        <EmptyState
          icon={<FilterX />}
          headline="No matching titles"
          body="There are no titles on your shelf matching the active filters."
          actionLabel="Reset filters"
          onAction={handleResetFilters}
        />
      )}
    </AppShell>
  );
}
