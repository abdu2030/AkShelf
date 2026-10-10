import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MediaCard, MediaCardSkeleton, getMediaTypeIcon } from "./media-card";

describe("getMediaTypeIcon", () => {
  it("returns appropriate icon component for each media type", () => {
    expect(getMediaTypeIcon("MOVIE")).toBeDefined();
    expect(getMediaTypeIcon("TV")).toBeDefined();
    expect(getMediaTypeIcon("ANIME")).toBeDefined();
  });
});

describe("MediaCard", () => {
  it("renders poster image when posterUrl is provided", () => {
    const html = renderToStaticMarkup(
      <MediaCard
        id="title-1"
        title="Interstellar"
        mediaType="MOVIE"
        year={2014}
        posterUrl="https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"
      />,
    );

    expect(html).toContain("Interstellar");
    expect(html).toContain("2014");
    expect(html).toContain("Movie");
    expect(html).toContain("gEU2QniE6E77NI6lCU6MxlNBvIx.jpg");
    expect(html).not.toContain('data-testid="poster-fallback"');
  });

  it("renders missing poster fallback when posterUrl is absent", () => {
    const html = renderToStaticMarkup(
      <MediaCard id="title-2" title="Spirited Away" mediaType="ANIME" year={2001} />,
    );

    expect(html).toContain("Spirited Away");
    expect(html).toContain("Anime");
    expect(html).toContain('data-testid="poster-fallback"');
  });

  it("renders status dot badge when title is tracked", () => {
    const html = renderToStaticMarkup(
      <MediaCard
        id="title-3"
        title="Breaking Bad"
        mediaType="TV"
        year={2008}
        status="WATCHING"
        season={2}
        episode={4}
      />,
    );

    expect(html).toContain('data-testid="status-dot-overlay"');
    expect(html).toContain("Watching • S2 E4");
  });

  it("does not render status dot overlay when untracked", () => {
    const html = renderToStaticMarkup(
      <MediaCard id="title-4" title="Severance" mediaType="TV" year={2022} />,
    );

    expect(html).not.toContain('data-testid="status-dot-overlay"');
    expect(html).not.toContain('data-testid="status-caption"');
  });

  it("renders rating chip overlay when rated", () => {
    const html = renderToStaticMarkup(
      <MediaCard id="title-5" title="Inception" mediaType="MOVIE" year={2010} rating={9.2} />,
    );

    expect(html).toContain('data-testid="rating-chip-overlay"');
    expect(html).toContain("9.2");
  });

  it("does not render rating chip when unrated", () => {
    const html = renderToStaticMarkup(
      <MediaCard id="title-6" title="Dune" mediaType="MOVIE" year={2021} rating={null} />,
    );

    expect(html).not.toContain('data-testid="rating-chip-overlay"');
  });

  it("renders 4px progress bar for WATCHING status with accurate percentage", () => {
    const html = renderToStaticMarkup(
      <MediaCard
        id="title-7"
        title="Attack on Titan"
        mediaType="ANIME"
        status="WATCHING"
        currentEpisode={6}
        totalEpisodes={24}
      />,
    );

    expect(html).toContain('data-testid="watching-progress-bar"');
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="25"');
    expect(html).toContain("width:25%");
  });

  it("does not render progress bar when status is WATCHED", () => {
    const html = renderToStaticMarkup(
      <MediaCard
        id="title-8"
        title="Cyberpunk: Edgerunners"
        mediaType="ANIME"
        status="WATCHED"
        currentEpisode={10}
        totalEpisodes={10}
      />,
    );

    expect(html).not.toContain('data-testid="watching-progress-bar"');
  });

  it("renders quick-action button with accessible aria-label", () => {
    const html = renderToStaticMarkup(<MediaCard id="title-9" title="Frieren" mediaType="ANIME" />);

    expect(html).toContain('data-testid="quick-action-button"');
    expect(html).toContain('aria-label="Change status for Frieren"');
  });

  it("supports fallback alias props (type, releaseYear, watchStatus, userRating, posterImage)", () => {
    const html = renderToStaticMarkup(
      <MediaCard
        id="title-10"
        title="Arcane"
        type="TV"
        releaseYear={2021}
        watchStatus="WATCHED"
        userRating={9.5}
        posterImage="https://image.tmdb.org/t/p/w500/arcane.jpg"
      />,
    );

    expect(html).toContain("Arcane");
    expect(html).toContain("2021");
    expect(html).toContain("TV Show");
    expect(html).toContain('data-testid="status-dot-overlay"');
    expect(html).toContain('data-testid="rating-chip-overlay"');
    expect(html).toContain("9.5");
    expect(html).toContain("arcane.jpg");
  });

  it("renders accessible label with composite details", () => {
    const html = renderToStaticMarkup(
      <MediaCard
        id="title-11"
        title="Spirited Away"
        mediaType="ANIME"
        year={2001}
        status="WATCHED"
        rating={9.5}
      />,
    );

    expect(html).toContain('aria-label="Spirited Away, 2001, Anime, Watched, rated 9.5 out of 10"');
  });

  it("links to custom href when provided", () => {
    const html = renderToStaticMarkup(
      <MediaCard id="title-12" title="Custom Route" mediaType="MOVIE" href="/custom/title-12" />,
    );

    expect(html).toContain('href="/custom/title-12"');
  });

  it("renders MediaCardSkeleton with proper poster aspect ratio and placeholder items", () => {
    const html = renderToStaticMarkup(<MediaCardSkeleton />);

    expect(html).toContain('data-testid="media-card-skeleton"');
    expect(html).toContain("aspect-[2/3]");
  });
});
