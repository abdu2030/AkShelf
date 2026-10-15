import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ContinueWatchingShelf } from "./continue-watching-shelf";
import { ContinueWatchingItem } from "@/lib/dashboard";

describe("ContinueWatchingShelf Component", () => {
  const sampleItems: ContinueWatchingItem[] = [
    {
      id: "cw-1",
      externalSource: "tmdb",
      externalId: "1399",
      title: "Breaking Bad",
      type: "TV",
      posterUrl: null,
      backdropUrl: null,
      year: 2008,
      userRating: 9.5,
      totalEpisodes: 62,
      watchedEpisodes: 6,
      percentage: 10,
      nextUp: { seasonNumber: 1, episodeNumber: 7, name: "Episode 7" },
      isCompleted: false,
    },
    {
      id: "cw-2",
      externalSource: "anilist",
      externalId: "16498",
      title: "Attack on Titan",
      type: "ANIME",
      posterUrl: null,
      backdropUrl: null,
      year: 2013,
      userRating: 9.0,
      totalEpisodes: 87,
      watchedEpisodes: 4,
      percentage: 5,
      nextUp: { seasonNumber: 1, episodeNumber: 5, name: "Episode 5" },
      isCompleted: false,
    },
  ];

  it("renders section heading, counter badge, and all continue watching cards", () => {
    const html = renderToStaticMarkup(<ContinueWatchingShelf items={sampleItems} />);

    expect(html).toContain('aria-label="Continue Watching"');
    expect(html).toContain("Continue Watching");
    expect(html).toContain("2 in progress");
    expect(html).toContain("Breaking Bad");
    expect(html).toContain("Attack on Titan");
    expect(html).toContain('href="/library?status=WATCHING"');
    expect(html).toContain("View all");
  });

  it("renders empty string when items array is empty", () => {
    const html = renderToStaticMarkup(<ContinueWatchingShelf items={[]} />);
    expect(html).toBe("");
  });
});
