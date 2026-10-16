import { describe, expect, it } from "vitest";
import {
  sortMediaItems,
  SortableMediaItem,
  getSortDirectionDescription,
  sortOptions,
} from "./sort";

describe("sortMediaItems", () => {
  const sampleItems: SortableMediaItem[] = [
    {
      title: "Severance",
      rating: 8.7,
      year: 2022,
      addedAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-03-15T00:00:00Z",
    },
    {
      title: "Attack on Titan",
      rating: 9.1,
      year: 2013,
      addedAt: "2026-03-01T00:00:00Z",
      updatedAt: "2026-03-05T00:00:00Z",
    },
    {
      title: "Inception",
      rating: 8.8,
      year: 2010,
      addedAt: "2026-02-01T00:00:00Z",
      updatedAt: "2026-03-20T00:00:00Z",
    },
    {
      title: "Unrated Show",
      rating: null,
      year: null,
      addedAt: "2025-12-01T00:00:00Z",
      updatedAt: null,
    },
  ];

  it("sorts by recently updated descending (newest updates first)", () => {
    const sorted = sortMediaItems(sampleItems, "RECENTLY_UPDATED", "desc");
    expect(sorted.map((i) => i.title)).toEqual([
      "Inception", // March 20
      "Severance", // March 15
      "Attack on Titan", // March 5
      "Unrated Show", // null -> pushed to end
    ]);
  });

  it("sorts by recently updated ascending (oldest updates first)", () => {
    const sorted = sortMediaItems(sampleItems, "RECENTLY_UPDATED", "asc");
    expect(sorted.map((i) => i.title)).toEqual([
      "Unrated Show", // Dec 2025 (oldest update/addition)
      "Attack on Titan", // March 5
      "Severance", // March 15
      "Inception", // March 20
    ]);
  });

  it("pushes items without any timestamp to the end in recently updated sorting", () => {
    const itemsWithDateless: SortableMediaItem[] = [
      { title: "Has Date", addedAt: "2026-01-01T00:00:00Z" },
      { title: "No Date", addedAt: null, updatedAt: null },
    ];
    const descSorted = sortMediaItems(itemsWithDateless, "RECENTLY_UPDATED", "desc");
    expect(descSorted.map((i) => i.title)).toEqual(["Has Date", "No Date"]);

    const ascSorted = sortMediaItems(itemsWithDateless, "RECENTLY_UPDATED", "asc");
    expect(ascSorted.map((i) => i.title)).toEqual(["Has Date", "No Date"]);
  });

  it("falls back to watchedAt, startedAt, and addedAt for recently updated sorting", () => {
    const itemsWithoutExplicitUpdatedAt: SortableMediaItem[] = [
      {
        title: "Item A",
        addedAt: "2026-01-01T00:00:00Z",
        watchedAt: "2026-02-10T00:00:00Z",
      },
      {
        title: "Item B",
        addedAt: "2026-01-05T00:00:00Z",
        startedAt: "2026-03-01T00:00:00Z",
      },
      {
        title: "Item C",
        addedAt: "2026-01-20T00:00:00Z",
      },
    ];

    const sorted = sortMediaItems(itemsWithoutExplicitUpdatedAt, "RECENTLY_UPDATED", "desc");
    expect(sorted.map((i) => i.title)).toEqual([
      "Item B", // startedAt: March 1
      "Item A", // watchedAt: Feb 10
      "Item C", // addedAt: Jan 20
    ]);
  });

  it("sorts by title ascending (A to Z) with natural numeric collation", () => {
    const numericTitles: SortableMediaItem[] = [
      { title: "Season 10" },
      { title: "Season 2" },
      { title: "Season 1" },
    ];
    const sorted = sortMediaItems(numericTitles, "TITLE", "asc");
    expect(sorted.map((i) => i.title)).toEqual(["Season 1", "Season 2", "Season 10"]);
  });

  it("sorts by title descending (Z to A)", () => {
    const sorted = sortMediaItems(sampleItems, "TITLE", "desc");
    expect(sorted.map((i) => i.title)).toEqual([
      "Unrated Show",
      "Severance",
      "Inception",
      "Attack on Titan",
    ]);
  });

  it("sorts by rating descending with unrated items at the end", () => {
    const sorted = sortMediaItems(sampleItems, "RATING", "desc");
    expect(sorted.map((i) => i.title)).toEqual([
      "Attack on Titan", // 9.1
      "Inception", // 8.8
      "Severance", // 8.7
      "Unrated Show", // null
    ]);
  });

  it("sorts by rating ascending with unrated items still at the end", () => {
    const sorted = sortMediaItems(sampleItems, "RATING", "asc");
    expect(sorted.map((i) => i.title)).toEqual([
      "Severance", // 8.7
      "Inception", // 8.8
      "Attack on Titan", // 9.1
      "Unrated Show", // null
    ]);
  });

  it("sorts by release year descending with unknown years at the end", () => {
    const sorted = sortMediaItems(sampleItems, "RELEASE_YEAR", "desc");
    expect(sorted.map((i) => i.title)).toEqual([
      "Severance", // 2022
      "Attack on Titan", // 2013
      "Inception", // 2010
      "Unrated Show", // null
    ]);
  });

  it("sorts by release year ascending with unknown years at the end", () => {
    const sorted = sortMediaItems(sampleItems, "RELEASE_YEAR", "asc");
    expect(sorted.map((i) => i.title)).toEqual([
      "Inception", // 2010
      "Attack on Titan", // 2013
      "Severance", // 2022
      "Unrated Show", // null
    ]);
  });

  it("sorts by date added descending (newest first)", () => {
    const sorted = sortMediaItems(sampleItems, "DATE_ADDED", "desc");
    expect(sorted.map((i) => i.title)).toEqual([
      "Attack on Titan", // March 2026
      "Inception", // Feb 2026
      "Severance", // Jan 2026
      "Unrated Show", // Dec 2025
    ]);
  });

  it("sorts by date added ascending (oldest first)", () => {
    const sorted = sortMediaItems(sampleItems, "DATE_ADDED", "asc");
    expect(sorted.map((i) => i.title)).toEqual([
      "Unrated Show", // Dec 2025
      "Severance", // Jan 2026
      "Inception", // Feb 2026
      "Attack on Titan", // March 2026
    ]);
  });

  it("resolves ties deterministically by title", () => {
    const tiedItems: SortableMediaItem[] = [
      { title: "Zebra", rating: 9.0 },
      { title: "Alpha", rating: 9.0 },
    ];
    const sorted = sortMediaItems(tiedItems, "RATING", "desc");
    expect(sorted.map((i) => i.title)).toEqual(["Alpha", "Zebra"]);
  });
});

describe("getSortDirectionDescription", () => {
  it("provides informative descriptions for all options and directions", () => {
    for (const opt of sortOptions) {
      const ascDesc = getSortDirectionDescription(opt.field, "asc");
      const descDesc = getSortDirectionDescription(opt.field, "desc");
      expect(ascDesc.length).toBeGreaterThan(0);
      expect(descDesc.length).toBeGreaterThan(0);
      expect(ascDesc).not.toEqual(descDesc);
    }
  });

  it("provides expected labels for key fields", () => {
    expect(getSortDirectionDescription("RATING", "desc")).toBe("Highest rated first");
    expect(getSortDirectionDescription("RATING", "asc")).toBe("Lowest rated first");
    expect(getSortDirectionDescription("TITLE", "asc")).toBe("A to Z");
    expect(getSortDirectionDescription("TITLE", "desc")).toBe("Z to A");
    expect(getSortDirectionDescription("RECENTLY_UPDATED", "desc")).toBe("Recently updated first");
    expect(getSortDirectionDescription("RELEASE_YEAR", "desc")).toBe("Newest release first");
  });
});
