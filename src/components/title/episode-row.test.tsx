import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EpisodeRow } from "./episode-row";

describe("EpisodeRow Component", () => {
  it("renders episode number, title, air date, and runtime", () => {
    const html = renderToStaticMarkup(
      <EpisodeRow
        episodeNumber={1}
        name="To You, in 2000 Years"
        airDate="Apr 7, 2013"
        runtime={24}
      />,
    );

    expect(html).toContain("1");
    expect(html).toContain("To You, in 2000 Years");
    expect(html).toContain("Apr 7, 2013 • 24m");
    expect(html).toContain('role="checkbox"');
    expect(html).toContain('aria-checked="false"');
  });

  it("renders watched state when isWatched is true", () => {
    const html = renderToStaticMarkup(
      <EpisodeRow episodeNumber={14} name="Can't Look into His Eyes Yet" isWatched={true} />,
    );

    expect(html).toContain('aria-checked="true"');
    expect(html).toContain("Mark Episode 14 as unwatched");
  });

  it("renders next-up marker chip and left border when isNextUp is true", () => {
    const html = renderToStaticMarkup(
      <EpisodeRow episodeNumber={15} name="Special Operations Squad" isNextUp={true} />,
    );

    expect(html).toContain("Continue");
    expect(html).toContain("border-l-[3px] border-l-accent");
  });

  it("disables checkbox and shows airing caption when isAired is false", () => {
    const html = renderToStaticMarkup(
      <EpisodeRow
        episodeNumber={26}
        name="Future Episode"
        isAired={false}
        airDate="Oct 20, 2026"
      />,
    );

    expect(html).toContain("Airs Oct 20, 2026");
    expect(html).toContain("disabled");
  });
});
