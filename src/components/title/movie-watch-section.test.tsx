import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MovieWatchSection, MovieQuickCheckButton } from "./movie-watch-section";

vi.mock("@/actions/tracking", () => ({
  updateTitleStatusAction: vi.fn().mockResolvedValue({ success: true, status: "WATCHED" }),
}));

describe("MovieWatchSection Component", () => {
  it("renders feature film completion row for an unwatched movie", () => {
    const html = renderToStaticMarkup(
      <MovieWatchSection
        titleExternalSource="tmdb"
        titleExternalId="13223"
        titleName="Gran Torino"
        mediaType="MOVIE"
        year={2008}
        runtime={116}
        posterUrl="https://image.tmdb.org/t/p/w500/zUybYvxWdAJy5hhYovsXtHSWI1l.jpg"
        currentStatus="PLAN_TO_WATCH"
      />,
    );

    expect(html).toContain("Feature Film Watch Progress");
    expect(html).toContain("Gran Torino");
    expect(html).toContain("2008");
    expect(html).toContain("1h 56m");
    expect(html).toContain('role="checkbox"');
    expect(html).toContain('aria-checked="false"');
    expect(html).toContain("Mark as Watched");
  });

  it("renders completed state with watched badge when movie is WATCHED", () => {
    const html = renderToStaticMarkup(
      <MovieWatchSection
        titleExternalSource="tmdb"
        titleExternalId="13223"
        titleName="Gran Torino"
        mediaType="MOVIE"
        year={2008}
        runtime={116}
        currentStatus="WATCHED"
        watchedAt="2026-10-17T00:00:00.000Z"
      />,
    );

    expect(html).toContain("Feature Film Watch Progress");
    expect(html).toContain("Gran Torino");
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain("Mark Unwatched");
    expect(html).toContain("Watched on");
  });
});

describe("MovieQuickCheckButton Component", () => {
  it("renders quick check button in unwatched state", () => {
    const html = renderToStaticMarkup(
      <MovieQuickCheckButton
        titleExternalSource="tmdb"
        titleExternalId="13223"
        titleName="Gran Torino"
        mediaType="MOVIE"
        currentStatus="PLAN_TO_WATCH"
      />,
    );

    expect(html).toContain("Mark Watched");
    expect(html).toContain('aria-label="Mark Gran Torino as watched"');
  });

  it("renders quick check button in watched state", () => {
    const html = renderToStaticMarkup(
      <MovieQuickCheckButton
        titleExternalSource="tmdb"
        titleExternalId="13223"
        titleName="Gran Torino"
        mediaType="MOVIE"
        currentStatus="WATCHED"
      />,
    );

    expect(html).toContain("Watched");
    expect(html).toContain('aria-label="Mark Gran Torino as unwatched"');
  });
});
