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
    expect(html).toContain('href="/title/tmdb-27205?type=MOVIE"');
  });

  it("links directly to database title id when item has database primary key", () => {
    const dbItem: RecentlyWatchedItem = {
      ...sampleItem,
      id: "clx12345678901234567890",
      externalSource: "tmdb",
      externalId: "1411",
      title: "Person of Interest",
      type: "TV",
    };

    const html = renderToStaticMarkup(<RecentlyWatchedCard item={dbItem} />);

    expect(html).toContain("Person of Interest");
    expect(html).toContain('href="/title/db-clx12345678901234567890?type=TV"');
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
