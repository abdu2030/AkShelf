import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RecentlyWatchedCard } from "./recently-watched-card";
import { RecentlyWatchedItem } from "@/lib/dashboard";

describe("RecentlyWatchedCard Component", () => {
  const sampleItem: RecentlyWatchedItem = {
    id: "rw-1",
    externalSource: "tmdb",
    externalId: "27205",
    title: "Inception",
    type: "MOVIE",
    posterUrl: "https://image.tmdb.org/t/p/w500/inception.jpg",
    backdropUrl: null,
    year: 2010,
    rating: 9.5,
    status: "WATCHED",
    watchedAt: "2026-10-14T20:00:00Z",
  };

  it("renders poster, title, year, watched badge, and rating pill", () => {
    const html = renderToStaticMarkup(<RecentlyWatchedCard item={sampleItem} />);

    expect(html).toContain("Inception");
    expect(html).toContain("2010");
    expect(html).toContain("MOVIE");
    expect(html).toContain("Watched");
    expect(html).toContain("9.5");
    expect(html).toContain('data-testid="recently-watched-card-27205"');
    expect(html).toContain('href="/title/tmdb-27205"');
  });

  it("renders correctly without rating when not rated", () => {
    const unratedItem: RecentlyWatchedItem = {
      ...sampleItem,
      rating: null,
    };

    const html = renderToStaticMarkup(<RecentlyWatchedCard item={unratedItem} />);

    expect(html).toContain("Inception");
    expect(html).not.toContain("9.5");
  });
});
