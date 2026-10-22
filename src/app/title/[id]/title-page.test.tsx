import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    title: {
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

import { prisma } from "@/lib/db";
import TitleDetailPage from "./page";

describe("TitleDetailPage Component", () => {
  it("renders movie detail view with synopsis, cast preview, and metadata panel", async () => {
    const page = await TitleDetailPage({
      params: Promise.resolve({ id: "demo-tmdb-27205" }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Inception");
    expect(html).toContain("(2010)");
    expect(html).toContain("Movie");
    expect(html).toContain("Watched");
    expect(html).toContain("9.5/10");
    expect(html).toContain("Back to Library");

    // Synopsis
    expect(html).toContain("Synopsis");
    expect(html).toContain("Cobb, a skilled thief");

    // Cast Preview
    expect(html).toContain("Cast &amp; Characters");
    expect(html).toContain("Leonardo DiCaprio");
    expect(html).toContain("Dom Cobb");
    expect(html).toContain("Joseph Gordon-Levitt");

    // Metadata Overview Panel
    expect(html).toContain("About &amp; Overview");
    expect(html).toContain("Christopher Nolan");
    expect(html).toContain("Warner Bros. Pictures");
    expect(html).toContain("148m (2h 28m)");
    expect(html).toContain("View on TMDB");

    // Status Selector Shelf Panel (Day 22), Rating Control (Day 24) & Date Tracker (Day 25)
    expect(html).toContain("Your Shelf");
    expect(html).toContain("Click status to change or untrack");
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-label="Your rating"');
    expect(html).toContain("Watch Dates:");
  });

  it("renders anime detail view with cast, metadata, and episodes breakdown", async () => {
    const page = await TitleDetailPage({
      params: Promise.resolve({ id: "demo-anilist-16498" }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Attack on Titan");
    expect(html).toContain("(2013)");
    expect(html).toContain("Anime");
    expect(html).toContain("Synopsis");

    // Cast Preview
    expect(html).toContain("Cast &amp; Characters");
    expect(html).toContain("Yuki Kaji");
    expect(html).toContain("Eren Yeager");

    // Metadata Overview Panel
    expect(html).toContain("About &amp; Overview");
    expect(html).toContain("Tetsurō Araki");
    expect(html).toContain("Wit Studio, MAPPA");
    expect(html).toContain("View on AniList");

    // Episodes breakdown
    expect(html).toContain("Episodes");
    expect(html).toContain('role="progressbar"');
    expect(html).toContain("To You, in 2000 Years");
  });

  it("renders not found state for nonexistent title ID", async () => {
    const page = await TitleDetailPage({
      params: Promise.resolve({ id: "nonexistent-id-99999" }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Title Not Found");
    expect(html).toContain("Back to Library");
  });

  it("resolves and renders database title by db- prefix with movie watch section", async () => {
    vi.mocked(prisma.title.findUnique).mockResolvedValueOnce({
      id: "cmvc5p3zc0000lqyos10oe8ov",
      externalSource: "tmdb",
      externalId: "13223",
      title: "Gran Torino",
      type: "MOVIE",
      year: 2008,
      overview: "Disgruntled Korean War veteran Walt Kowalski sets out to reform his neighbor.",
      posterUrl: "https://image.tmdb.org/t/p/w500/zUybYvxWdAJy5hhYovsXtHSWI1l.jpg",
      backdropUrl: null,
      genres: ["Drama"],
      seasons: [],
      userTitles: [
        {
          id: "ut-1",
          status: "WATCHED",
          rating: 8.5,
          startedAt: null,
          watchedAt: new Date("2026-10-17T00:00:00.000Z"),
        },
      ],
    } as unknown as never);

    const page = await TitleDetailPage({
      params: Promise.resolve({ id: "db-cmvc5p3zc0000lqyos10oe8ov" }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Gran Torino");
    expect(html).toContain("Feature Film Watch Progress");
    expect(html).toContain("Mark Unwatched");
  });

  it("resolves external slug tmdb-1411 as TV when database contains Person of Interest TV record", async () => {
    vi.mocked(prisma.title.findUnique).mockResolvedValueOnce({
      id: "cmvc5p3zc0000lqyos10oe8poi",
      externalSource: "tmdb",
      externalId: "1411",
      title: "Person of Interest",
      type: "TV",
      year: 2011,
      overview: "An ex-CIA agent and a mysterious billionaire prevent violent crimes.",
      posterUrl: "https://image.tmdb.org/t/p/w500/poi.jpg",
      backdropUrl: null,
      genres: ["Action", "Drama", "Sci-Fi"],
      seasons: [
        {
          id: "s-1",
          seasonNumber: 1,
          name: "Season 1",
          episodeCount: 23,
          episodes: [
            { id: "ep-1", episodeNumber: 1, name: "Pilot", airDate: "2011-09-22", runtime: 43 },
          ],
        },
        {
          id: "s-2",
          seasonNumber: 2,
          name: "Season 2",
          episodeCount: 22,
          episodes: [
            {
              id: "ep-2",
              episodeNumber: 1,
              name: "The Contingency",
              airDate: "2012-09-27",
              runtime: 43,
            },
          ],
        },
      ],
      userTitles: [
        {
          id: "ut-2",
          status: "WATCHING",
          rating: 9.0,
          startedAt: new Date("2026-10-10T00:00:00.000Z"),
          watchedAt: null,
        },
      ],
    } as unknown as never);

    const page = await TitleDetailPage({
      params: Promise.resolve({ id: "tmdb-1411" }),
      searchParams: Promise.resolve({ season: "2" }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Person of Interest");
    expect(html).toContain("TV Show");
    expect(html).toContain("S1");
    expect(html).toContain("S2");
    expect(html).toContain("The Contingency");
    expect(html).not.toContain("Feature Film Watch Progress");
  });
});
