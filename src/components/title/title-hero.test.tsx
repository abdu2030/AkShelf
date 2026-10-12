import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TitleHero } from "./title-hero";

describe("TitleHero Component", () => {
  it("renders movie title, year, genres, runtime, and synopsis", () => {
    const html = renderToStaticMarkup(
      <TitleHero
        title="Inception"
        type="MOVIE"
        year={2010}
        overview="Cobb, a skilled thief who commits corporate espionage..."
        genres={["Action", "Science Fiction"]}
        runtime={148}
        posterUrl="https://image.tmdb.org/t/p/w500/inception.jpg"
        backdropUrl="https://image.tmdb.org/t/p/original/backdrop.jpg"
        status="WATCHED"
        rating={9.5}
        voteAverage={8.4}
      />,
    );

    expect(html).toContain("Inception");
    expect(html).toContain("(2010)");
    expect(html).toContain("Action");
    expect(html).toContain("Science Fiction");
    expect(html).toContain("2h 28m");
    expect(html).toContain("Synopsis");
    expect(html).toContain("Cobb, a skilled thief");
    expect(html).toContain("Watched");
    expect(html).toContain("9.5/10");
    expect(html).toContain("8.4/10");
  });

  it("renders poster fallback tile when posterUrl is null", () => {
    const html = renderToStaticMarkup(
      <TitleHero title="Untitled Anime" type="ANIME" year={2024} posterUrl={null} />,
    );

    expect(html).toContain("Untitled Anime");
    expect(html).toContain("(2024)");
    expect(html).toContain("Anime");
  });

  it("handles titles without runtime, rating, or overview gracefully", () => {
    const html = renderToStaticMarkup(
      <TitleHero title="Minimal Show" type="TV" totalEpisodes={12} />,
    );

    expect(html).toContain("Minimal Show");
    expect(html).toContain("12 Episodes");
    expect(html).not.toContain("Synopsis");
  });
});
