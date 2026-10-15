import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AnalyticsStats } from "./analytics-stats";
import { DashboardAnalytics } from "@/lib/dashboard";

describe("AnalyticsStats Component (Day 38)", () => {
  const sampleAnalytics: DashboardAnalytics = {
    countsByType: {
      movies: 14,
      tv: 6,
      anime: 8,
    },
    averageRating: 9.2,
    ratedCount: 22,
    totalWatchedEpisodes: 142,
  };

  it("renders collection counts by format with direct library links", () => {
    const html = renderToStaticMarkup(<AnalyticsStats analytics={sampleAnalytics} />);

    expect(html).toContain('aria-label="Shelf Analytics"');
    expect(html).toContain("Shelf Analytics");
    expect(html).toContain("Collection by Format");

    // Movie count and link
    expect(html).toContain("Movies");
    expect(html).toContain("14");
    expect(html).toContain('href="/library?type=MOVIE"');

    // TV count and link
    expect(html).toContain("TV Shows");
    expect(html).toContain("6");
    expect(html).toContain('href="/library?type=TV"');

    // Anime count and link
    expect(html).toContain("Anime");
    expect(html).toContain("8");
    expect(html).toContain('href="/library?type=ANIME"');
  });

  it("renders average personal rating and rated count", () => {
    const html = renderToStaticMarkup(<AnalyticsStats analytics={sampleAnalytics} />);

    expect(html).toContain("Average Personal Rating");
    expect(html).toContain("9.2");
    expect(html).toContain("/ 10");
    expect(html).toContain("22 titles rated");
    expect(html).toContain('href="/library?sort=rating-desc"');
  });

  it("renders total watched episodes and link to history", () => {
    const html = renderToStaticMarkup(<AnalyticsStats analytics={sampleAnalytics} />);

    expect(html).toContain("Total Watched Episodes");
    expect(html).toContain("142");
    expect(html).toContain("episodes");
    expect(html).toContain('href="/history"');
  });

  it("handles unrated collection gracefully with dash display", () => {
    const unratedAnalytics: DashboardAnalytics = {
      countsByType: { movies: 3, tv: 1, anime: 0 },
      averageRating: null,
      ratedCount: 0,
      totalWatchedEpisodes: 5,
    };

    const html = renderToStaticMarkup(<AnalyticsStats analytics={unratedAnalytics} />);

    expect(html).toContain("—");
    expect(html).toContain("No titles rated yet");
  });
});
