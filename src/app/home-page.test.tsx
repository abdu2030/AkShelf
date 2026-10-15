import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "user-123", email: "user@akshelf.local" },
  }),
}));

vi.mock("@/lib/db", () => {
  const mockPrisma = {
    userTitle: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    userEpisode: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

import HomePage from "./page";
import { prisma } from "@/lib/db";

describe("HomePage (Dashboard - Day 36, Day 37 & Day 38)", () => {
  it("renders live dashboard stats, continue watching, recently watched, and shelf analytics", async () => {
    vi.mocked(prisma.userTitle.groupBy).mockResolvedValueOnce([
      { status: "WATCHED", _count: { status: 18 } },
      { status: "WATCHING", _count: { status: 3 } },
      { status: "PLAN_TO_WATCH", _count: { status: 7 } },
    ] as unknown as never);

    // Continue Watching mock
    vi.mocked(prisma.userTitle.findMany).mockResolvedValueOnce([
      {
        id: "ut-1",
        userId: "user-123",
        titleId: "title-1",
        status: "WATCHING",
        rating: 9.5,
        updatedAt: new Date("2026-10-14T10:00:00Z"),
        title: {
          id: "title-1",
          externalSource: "tmdb",
          externalId: "1399",
          title: "Breaking Bad",
          type: "TV",
          posterUrl: "https://image.tmdb.org/t/p/w500/bb.jpg",
          backdropUrl: null,
          year: 2008,
          seasons: [
            {
              id: "s-1",
              seasonNumber: 1,
              name: "Season 1",
              episodeCount: 7,
              episodes: [
                { id: "ep-1", episodeNumber: 1, name: "Pilot", airDate: "2008-01-20", runtime: 58 },
                {
                  id: "ep-2",
                  episodeNumber: 2,
                  name: "Cat's in the Bag...",
                  airDate: "2008-01-27",
                  runtime: 48,
                },
              ],
            },
          ],
        },
      },
    ] as unknown as never);

    vi.mocked(prisma.userEpisode.findMany).mockResolvedValueOnce([
      { episodeId: "ep-1" },
    ] as unknown as never);

    // Recently Watched mock
    vi.mocked(prisma.userTitle.findMany).mockResolvedValueOnce([
      {
        id: "ut-2",
        userId: "user-123",
        titleId: "title-2",
        status: "WATCHED",
        rating: 9.5,
        watchedAt: new Date("2026-10-15T12:00:00Z"),
        updatedAt: new Date("2026-10-15T12:00:00Z"),
        title: {
          id: "title-2",
          externalSource: "tmdb",
          externalId: "27205",
          title: "Inception",
          type: "MOVIE",
          posterUrl: "https://image.tmdb.org/t/p/w500/inception.jpg",
          backdropUrl: null,
          year: 2010,
        },
      },
    ] as unknown as never);

    // Analytics mocks (counts by type, aggregate rating, episode count)
    vi.mocked(prisma.userTitle.count)
      .mockResolvedValueOnce(18) // movies
      .mockResolvedValueOnce(6) // tv
      .mockResolvedValueOnce(4); // anime

    vi.mocked(prisma.userTitle.aggregate).mockResolvedValueOnce({
      _avg: { rating: 9.24 },
      _count: { rating: 20 },
    } as unknown as never);

    vi.mocked(prisma.userEpisode.count).mockResolvedValueOnce(142);

    const page = await HomePage();
    const html = renderToStaticMarkup(page);

    // Header
    expect(html).toContain("Your shelf");
    expect(html).toContain("Track what you watch, what is next, and your ratings.");

    // Stat tiles with real counts
    expect(html).toContain("Total tracked");
    expect(html).toContain("28");
    expect(html).toContain("Watched");
    expect(html).toContain("18");
    expect(html).toContain("Watching");
    expect(html).toContain("3");
    expect(html).toContain("Plan to Watch");
    expect(html).toContain("7");

    // Continue Watching shelf
    expect(html).toContain("Continue Watching");
    expect(html).toContain("Breaking Bad");
    expect(html).toContain("Next: S1 E2");
    expect(html).toContain("Continue S1 E2");

    // Recently Watched section
    expect(html).toContain("Recently Watched");
    expect(html).toContain("Inception");
    expect(html).toContain("9.5");

    // Shelf Analytics (Day 38)
    expect(html).toContain("Shelf Analytics");
    expect(html).toContain("Collection by Format");
    expect(html).toContain("Movies");
    expect(html).toContain("18");
    expect(html).toContain("TV Shows");
    expect(html).toContain("6");
    expect(html).toContain("Anime");
    expect(html).toContain("4");
    expect(html).toContain("Average Personal Rating");
    expect(html).toContain("9.2");
    expect(html).toContain("20 titles rated");
    expect(html).toContain("Total Watched Episodes");
    expect(html).toContain("142");

    // Active shelf overview
    expect(html).toContain("Active Shelf Overview");
    expect(html).toContain("View Library");
    expect(html).toContain("Watching (3)");
    expect(html).toContain("Plan to Watch (7)");
    expect(html).toContain("Watched (18)");
  });

  it("renders stat tiles with 0 and spec empty state when user has zero tracked titles", async () => {
    vi.mocked(prisma.userTitle.groupBy).mockResolvedValueOnce([] as unknown as never);
    vi.mocked(prisma.userTitle.findMany).mockResolvedValueOnce([] as unknown as never);
    vi.mocked(prisma.userTitle.findMany).mockResolvedValueOnce([] as unknown as never);
    vi.mocked(prisma.userTitle.count)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    vi.mocked(prisma.userTitle.aggregate).mockResolvedValueOnce({
      _avg: { rating: null },
      _count: { rating: 0 },
    } as unknown as never);
    vi.mocked(prisma.userEpisode.count).mockResolvedValueOnce(0);

    const page = await HomePage();
    const html = renderToStaticMarkup(page);

    // Stat tiles render zeros per spec (Section 10.2)
    expect(html).toContain("Total tracked");
    expect(html).toContain("Watched");
    expect(html).toContain("Watching");
    expect(html).toContain("Plan to Watch");

    // Empty state headline & CTA
    expect(html).toContain("Your shelf is empty");
    expect(html).toContain("Search for a movie, show or anime to start.");
    expect(html).toContain("Search titles");

    // Continue Watching, Recently Watched & Analytics sections should not appear in zero state
    expect(html).not.toContain("Active Shelf Overview");
    expect(html).not.toContain("Collection by Format");
  });
});
