import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StatTile } from "./stat-tile";

describe("StatTile Component (Day 36)", () => {
  it("renders label, count, and accessible link correctly", () => {
    const html = renderToStaticMarkup(
      <StatTile
        label="Total tracked"
        count={42}
        href="/library"
        variant="total"
        testId="stat-tile-total"
      />,
    );

    expect(html).toContain("Total tracked");
    expect(html).toContain("42");
    expect(html).toContain('href="/library"');
    expect(html).toContain('data-testid="stat-tile-total"');
    expect(html).toContain('aria-label="Total tracked: 42 titles. Click to view in library."');
  });

  it("renders specific variant dot color styles for watched, watching, and plan to watch", () => {
    const watchedHtml = renderToStaticMarkup(
      <StatTile label="Watched" count={25} href="/library?status=WATCHED" variant="watched" />,
    );
    expect(watchedHtml).toContain("bg-emerald-400");
    expect(watchedHtml).toContain("Watched");
    expect(watchedHtml).toContain("25");

    const watchingHtml = renderToStaticMarkup(
      <StatTile label="Watching" count={3} href="/library?status=WATCHING" variant="watching" />,
    );
    expect(watchingHtml).toContain("bg-amber-400");
    expect(watchingHtml).toContain("Watching");
    expect(watchingHtml).toContain("3");

    const planHtml = renderToStaticMarkup(
      <StatTile
        label="Plan to Watch"
        count={14}
        href="/library?status=PLAN_TO_WATCH"
        variant="plan_to_watch"
      />,
    );
    expect(planHtml).toContain("bg-sky-400");
    expect(planHtml).toContain("Plan to Watch");
    expect(planHtml).toContain("14");
  });
});
