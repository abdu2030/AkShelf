import React from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ArchiveSpotlight } from "./archive-spotlight";
import type { ContinueWatchingItem, RecentlyWatchedItem } from "@/lib/dashboard";

const watching: ContinueWatchingItem = {
  id: "record-1",
  externalSource: "tmdb",
  externalId: "20",
  title: "A real series",
  type: "TV",
  totalEpisodes: 8,
  watchedEpisodes: 2,
  percentage: 25,
  nextUp: { seasonNumber: 2, episodeNumber: 3 },
  isCompleted: false,
};
const watched: RecentlyWatchedItem = {
  id: "record-2",
  externalSource: "tmdb",
  externalId: "30",
  title: "A remembered film",
  type: "MOVIE",
  status: "WATCHED",
  rating: 8.5,
};

describe("Personal archive spotlight", () => {
  it("prefers a resolvable next episode and preserves typed season deep links", () => {
    const html = renderToStaticMarkup(
      <ArchiveSpotlight
        watching={[{ ...watching, title: "Unknown", nextUp: null }, watching]}
        recent={[watched]}
      />,
    );
    expect(html).toContain("A real series");
    expect(html).toContain("Continue S2 E3");
    expect(html).toContain("/title/db-record-1?season=2&amp;type=TV");
  });
  it("does not invent an episode when only an unknown progress record exists", () => {
    const html = renderToStaticMarkup(
      <ArchiveSpotlight watching={[{ ...watching, nextUp: null, totalEpisodes: 0 }]} recent={[]} />,
    );
    expect(html).toContain("View progress");
    expect(html).not.toContain("Continue S");
    expect(html).not.toContain("0 / 0");
  });
  it("shows a watched memory without implying playback or continuation", () => {
    const html = renderToStaticMarkup(<ArchiveSpotlight watching={[]} recent={[watched]} />);
    expect(html).toContain("From your archive");
    expect(html).toContain("A remembered film");
    expect(html).not.toContain("Continue");
  });
  it("does not fabricate a spotlight for an empty collection", () => {
    expect(renderToStaticMarkup(<ArchiveSpotlight watching={[]} recent={[]} />)).toBe("");
  });
});
