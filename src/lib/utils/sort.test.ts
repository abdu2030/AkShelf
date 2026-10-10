import { describe, expect, it } from "vitest";
import { sortMediaItems, SortableMediaItem } from "./sort";

describe("sortMediaItems", () => {
  const sampleItems: SortableMediaItem[] = [
    {
      title: "Severance",
      rating: 8.7,
      year: 2022,
      addedAt: "2026-01-01T00:00:00Z",
    },
    {
      title: "Attack on Titan",
      rating: 9.1,
      year: 2013,
      addedAt: "2026-03-01T00:00:00Z",
    },
    {
      title: "Inception",
      rating: 8.8,
      year: 2010,
      addedAt: "2026-02-01T00:00:00Z",
    },
    {
      title: "Unrated Show",
      rating: null,
      year: null,
      addedAt: "2025-12-01T00:00:00Z",
    },
  ];

  it("sorts by title ascending (A to Z)", () => {
    const sorted = sortMediaItems(sampleItems, "TITLE", "asc");
    expect(sorted.map((i) => i.title)).toEqual([
      "Attack on Titan",
      "Inception",
      "Severance",
      "Unrated Show",
    ]);
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
