import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SearchResultRow } from "./search-result-row";
import { SearchResultItem } from "@/app/api/search/route";

describe("SearchResultRow Component", () => {
  const trackedMovie: SearchResultItem = {
    id: "demo-tmdb-27205",
    externalSource: "tmdb",
    externalId: "27205",
    type: "MOVIE",
    title: "Inception",
    year: 2010,
    overview: "A thief enters the dreams of others.",
    posterUrl: "https://image.tmdb.org/t/p/w500/poster.jpg",
    genres: ["Action", "Sci-Fi"],
    isOnShelf: true,
    status: "WATCHED",
    rating: 9.5,
  };

  const untrackedAnime: SearchResultItem = {
    id: "anilist:16498",
    externalSource: "anilist",
    externalId: "16498",
    type: "ANIME",
    title: "Attack on Titan",
    year: 2013,
    overview: "Humanity fights Titans.",
    posterUrl: null,
    genres: ["Action", "Fantasy"],
    isOnShelf: false,
    status: null,
  };

  it("renders title, year, genres, and media type label", () => {
    const html = renderToStaticMarkup(<SearchResultRow item={trackedMovie} />);

    expect(html).toContain("Inception");
    expect(html).toContain("2010");
    expect(html).toContain("Movie");
    expect(html).toContain("Action, Sci-Fi");
    expect(html).toContain("A thief enters the dreams of others.");
  });

  it("renders StatusBadge when title is tracked on user shelf", () => {
    const html = renderToStaticMarkup(<SearchResultRow item={trackedMovie} />);

    expect(html).toContain("Watched");
    expect(html).toContain("9.5");
    expect(html).not.toContain("Plan to Watch");
  });

  it("renders + Plan to Watch button when title is untracked", () => {
    const html = renderToStaticMarkup(<SearchResultRow item={untrackedAnime} />);

    expect(html).toContain("Plan to Watch");
    expect(html).toContain('aria-label="Add Attack on Titan to Plan to Watch"');
  });

  it("applies highlight styling when isHighlighted is true", () => {
    const html = renderToStaticMarkup(<SearchResultRow item={trackedMovie} isHighlighted={true} />);

    expect(html).toContain('data-highlighted="true"');
    expect(html).toContain("border-accent");
  });

  it("renders poster status indicator and personal rating when title is watched and rated", () => {
    const html = renderToStaticMarkup(<SearchResultRow item={trackedMovie} />);

    expect(html).toContain('data-testid="poster-status-indicator"');
    expect(html).toContain('data-testid="search-personal-rating"');
    expect(html).toContain("9.5");
    expect(html).toContain("/10");
  });

  it("renders watching progress detail for in-progress series", () => {
    const watchingSeries: SearchResultItem = {
      id: "demo-tmdb-66732",
      externalSource: "tmdb",
      externalId: "66732",
      type: "TV",
      title: "Stranger Things",
      year: 2016,
      overview: "When a young boy vanishes...",
      posterUrl: "https://image.tmdb.org/t/p/w500/stranger.jpg",
      genres: ["Sci-Fi", "Drama"],
      isOnShelf: true,
      status: "WATCHING",
      season: 2,
      episode: 4,
      currentEpisode: 11,
    };

    const html = renderToStaticMarkup(<SearchResultRow item={watchingSeries} />);

    expect(html).toContain('data-testid="poster-status-indicator"');
    expect(html).toContain('data-testid="search-watching-progress"');
    expect(html).toContain("S2 E4");
    expect(html).toContain("Watching - S2 E4");
  });

  it("renders public score fallback when title is unrated by user", () => {
    const unratedWithPublicScore: SearchResultItem = {
      ...untrackedAnime,
      voteAverage: 8.6,
    };

    const html = renderToStaticMarkup(<SearchResultRow item={unratedWithPublicScore} />);

    expect(html).not.toContain('data-testid="search-personal-rating"');
    expect(html).toContain('data-testid="search-public-rating"');
    expect(html).toContain("8.6");
    expect(html).not.toContain('data-testid="poster-status-indicator"');
  });

  it("renders title even without poster", () => {
    const html = renderToStaticMarkup(<SearchResultRow item={untrackedAnime} />);

    expect(html).toContain("Attack on Titan");
    expect(html).toContain("Anime");
  });
});
