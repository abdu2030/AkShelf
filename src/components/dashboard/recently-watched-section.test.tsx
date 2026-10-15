import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RecentlyWatchedSection } from "./recently-watched-section";
import { RecentlyWatchedItem } from "@/lib/dashboard";

describe("RecentlyWatchedSection Component", () => {
  const sampleItems: RecentlyWatchedItem[] = [
    {
      id: "rw-1",
      externalSource: "tmdb",
      externalId: "27205",
      title: "Inception",
      type: "MOVIE",
      posterUrl: null,
      backdropUrl: null,
      year: 2010,
      rating: 9.5,
      status: "WATCHED",
      watchedAt: "2026-10-14T20:00:00Z",
    },
    {
      id: "rw-2",
      externalSource: "tmdb",
      externalId: "157336",
      title: "Interstellar",
      type: "MOVIE",
      posterUrl: null,
      backdropUrl: null,
      year: 2014,
      rating: 9.0,
      status: "WATCHED",
      watchedAt: "2026-10-12T18:00:00Z",
    },
  ];

  it("renders section heading, counter badge, cards, and link to history", () => {
    const html = renderToStaticMarkup(<RecentlyWatchedSection items={sampleItems} />);

    expect(html).toContain('aria-label="Recently Watched"');
    expect(html).toContain("Recently Watched");
    expect(html).toContain("2 titles");
    expect(html).toContain("Inception");
    expect(html).toContain("Interstellar");
    expect(html).toContain('href="/history"');
    expect(html).toContain("View all history");
  });

  it("renders empty string when items array is empty", () => {
    const html = renderToStaticMarkup(<RecentlyWatchedSection items={[]} />);
    expect(html).toBe("");
  });
});
