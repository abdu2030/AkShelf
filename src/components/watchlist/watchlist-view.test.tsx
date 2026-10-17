import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { WatchlistView } from "./watchlist-view";
import { MediaCardProps } from "@/components/title/media-card";

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}));

describe("WatchlistView Component", () => {
  const sampleWatchlistItems: MediaCardProps[] = [
    {
      id: "title-1",
      title: "Gran Turismo",
      mediaType: "MOVIE",
      year: 2023,
      status: "PLAN_TO_WATCH",
      posterUrl: "https://image.tmdb.org/t/p/w500/granturismo.jpg",
    },
    {
      id: "title-2",
      title: "Shogun",
      mediaType: "TV",
      year: 2024,
      status: "PLAN_TO_WATCH",
      posterUrl: "https://image.tmdb.org/t/p/w500/shogun.jpg",
      season: 1,
      totalEpisodes: 10,
    },
    {
      id: "title-3",
      title: "Spirited Away",
      mediaType: "ANIME",
      year: 2001,
      status: "PLAN_TO_WATCH",
      posterUrl: "https://image.tmdb.org/t/p/w500/spirited.jpg",
    },
  ];

  it("renders empty state when watchlist is empty", () => {
    const html = renderToStaticMarkup(<WatchlistView initialItems={[]} />);

    expect(html).toContain("Watchlist");
    expect(html).toContain("Titles you plan to watch next.");
    expect(html).toContain("Your watchlist is empty");
    expect(html).toContain("Search titles");
    expect(html).toContain('href="/search"');
  });

  it("renders watchlist items in media grid when items are provided", () => {
    const html = renderToStaticMarkup(<WatchlistView initialItems={sampleWatchlistItems} />);

    expect(html).toContain("Watchlist");
    expect(html).toContain("3 titles");
    expect(html).toContain("Gran Turismo");
    expect(html).toContain("Shogun");
    expect(html).toContain("Spirited Away");
    expect(html).not.toContain("Your watchlist is empty");
  });

  it("renders filter chips with live counts across media types", () => {
    const html = renderToStaticMarkup(<WatchlistView initialItems={sampleWatchlistItems} />);

    expect(html).toContain("All");
    expect(html).toContain("Movies");
    expect(html).toContain("TV Shows");
    expect(html).toContain("Anime");
  });

  it("does not render episode counter for movies in watchlist", () => {
    const html = renderToStaticMarkup(<WatchlistView initialItems={sampleWatchlistItems} />);

    // Gran Turismo is a movie with PLAN_TO_WATCH status
    expect(html).toContain("Gran Turismo");
    expect(html).not.toContain("Ep 0");
  });
});
