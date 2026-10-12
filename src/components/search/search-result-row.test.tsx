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

  it("renders title even without poster", () => {
    const html = renderToStaticMarkup(<SearchResultRow item={untrackedAnime} />);

    expect(html).toContain("Attack on Titan");
    expect(html).toContain("Anime");
  });
});
