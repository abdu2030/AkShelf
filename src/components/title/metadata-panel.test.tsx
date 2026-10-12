import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MetadataPanel } from "./metadata-panel";

describe("MetadataPanel Component", () => {
  it("renders basic metadata attributes", () => {
    const html = renderToStaticMarkup(
      <MetadataPanel
        originalTitle="Inception (2010)"
        director="Christopher Nolan"
        studios={["Warner Bros. Pictures", "Syncopy"]}
        releaseDate="2010-07-16"
        runtime={148}
        status="Released"
        voteAverage={8.4}
        voteCount={35000}
        externalSource="tmdb"
        externalId="27205"
        trailerUrl="https://www.youtube.com/watch?v=YoHD9XEInc0"
      />,
    );

    expect(html).toContain("About &amp; Overview");
    expect(html).toContain("Christopher Nolan");
    expect(html).toContain("Warner Bros. Pictures, Syncopy");
    expect(html).toContain("2010-07-16");
    expect(html).toContain("148m (2h 28m)");
    expect(html).toContain("Released");
    expect(html).toContain("8.4");
    expect(html).toContain("35,000 votes");
    expect(html).toContain("View on TMDB");
    expect(html).toContain("Trailer");
    expect(html).toContain("not endorsed or certified by TMDB");
  });

  it("renders AniList attribution when externalSource is anilist", () => {
    const html = renderToStaticMarkup(
      <MetadataPanel
        director="Keiichirō Saitō"
        studios={["Madhouse"]}
        externalSource="anilist"
        externalId="154587"
      />,
    );

    expect(html).toContain("View on AniList");
    expect(html).toContain("AniList GraphQL API");
  });

  it("omits empty or null fields cleanly", () => {
    const html = renderToStaticMarkup(<MetadataPanel />);
    expect(html).toContain("About &amp; Overview");
    expect(html).not.toContain("Runtime");
    expect(html).not.toContain("Director");
    expect(html).not.toContain("Trailer");
  });
});
