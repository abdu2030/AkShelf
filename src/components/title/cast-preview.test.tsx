import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CastPreview } from "./cast-preview";

describe("CastPreview Component", () => {
  it("renders empty state notice when cast array is empty", () => {
    const html = renderToStaticMarkup(<CastPreview cast={[]} />);
    expect(html).toContain("No cast information available for this title");
  });

  it("renders empty state notice when cast is undefined", () => {
    const html = renderToStaticMarkup(<CastPreview />);
    expect(html).toContain("No cast information available for this title");
  });

  it("renders cast members with names and characters", () => {
    const mockCast = [
      {
        id: 1,
        name: "Leonardo DiCaprio",
        character: "Dom Cobb",
        image: "https://image.tmdb.org/t/p/w185/leo.jpg",
      },
      {
        id: 2,
        name: "Joseph Gordon-Levitt",
        character: "Arthur",
        image: null,
      },
    ];

    const html = renderToStaticMarkup(<CastPreview cast={mockCast} />);
    expect(html).toContain("Cast &amp; Characters");
    expect(html).toContain("2 members");
    expect(html).toContain("Leonardo DiCaprio");
    expect(html).toContain("Dom Cobb");
    expect(html).toContain("Joseph Gordon-Levitt");
    expect(html).toContain("Arthur");
  });

  it("renders image component when image URL is provided", () => {
    const mockCast = [
      {
        id: 1,
        name: "Leonardo DiCaprio",
        character: "Dom Cobb",
        image: "https://image.tmdb.org/t/p/w185/leo.jpg",
      },
    ];

    const html = renderToStaticMarkup(<CastPreview cast={mockCast} />);
    expect(html).toContain("img");
    expect(html).toContain("Leonardo DiCaprio");
  });
});
