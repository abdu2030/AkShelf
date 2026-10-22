import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ContinueWatchingCard } from "./continue-watching-card";
import { ContinueWatchingItem } from "@/lib/dashboard";

describe("ContinueWatchingCard Component", () => {
  const sampleItem: ContinueWatchingItem = {
    id: "cw-1",
    externalSource: "tmdb",
    externalId: "1399",
    title: "Breaking Bad",
    type: "TV",
    posterUrl: "https://image.tmdb.org/t/p/w500/bb.jpg",
    backdropUrl: null,
    year: 2008,
    userRating: 9.5,
    totalEpisodes: 62,
    watchedEpisodes: 6,
    percentage: 10,
    nextUp: {
      seasonNumber: 1,
      episodeNumber: 7,
      name: "A No-Rough-Stuff-Type Deal",
    },
    isCompleted: false,
  };

  it("renders title, next-up episode badge, progress bar, and continue action link", () => {
    const html = renderToStaticMarkup(<ContinueWatchingCard item={sampleItem} />);

    expect(html).toContain("Breaking Bad");
    expect(html).toContain("Next: S1 E7");
    expect(html).toContain("A No-Rough-Stuff-Type Deal");
    expect(html).toContain("6 / 62 eps");
    expect(html).toContain("10%");
    expect(html).toContain('href="/title/tmdb-1399?season=1&amp;type=TV"');
    expect(html).toContain("Continue S1 E7");
    expect(html).toContain('aria-label="Continue Breaking Bad Season 1 Episode 7"');
  });

  it("renders completion badge when series is completed", () => {
    const completedItem: ContinueWatchingItem = {
      ...sampleItem,
      watchedEpisodes: 62,
      percentage: 100,
      nextUp: null,
      isCompleted: true,
    };

    const html = renderToStaticMarkup(<ContinueWatchingCard item={completedItem} />);

    expect(html).toContain("All Episodes Watched");
    expect(html).toContain("62 / 62 eps");
    expect(html).toContain("100%");
    expect(html).toContain('href="/title/tmdb-1399?type=TV"');
    expect(html).toContain("View Title");
  });

  it("links directly to database title id when item has database primary key", () => {
    const dbItem: ContinueWatchingItem = {
      ...sampleItem,
      id: "clx98765432101234567890",
      externalSource: "tmdb",
      externalId: "1411",
      title: "Person of Interest",
      type: "TV",
    };

    const html = renderToStaticMarkup(<ContinueWatchingCard item={dbItem} />);

    expect(html).toContain("Person of Interest");
    expect(html).toContain('href="/title/db-clx98765432101234567890?season=1&amp;type=TV"');
    expect(html).toContain('href="/title/db-clx98765432101234567890?type=TV"');
  });
});
