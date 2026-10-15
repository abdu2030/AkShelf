import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StatsBand } from "./stats-band";

describe("StatsBand Component (Day 36)", () => {
  const mockStats = {
    totalTracked: 50,
    watched: 30,
    watching: 5,
    planToWatch: 15,
    onHold: 0,
    dropped: 0,
  };

  it("renders all four stat tiles with correct counts and destination links", () => {
    const html = renderToStaticMarkup(<StatsBand stats={mockStats} />);

    expect(html).toContain('data-testid="stats-band"');

    // Total tracked
    expect(html).toContain("Total tracked");
    expect(html).toContain("50");
    expect(html).toContain('href="/library"');

    // Watched
    expect(html).toContain("Watched");
    expect(html).toContain("30");
    expect(html).toContain('href="/library?status=WATCHED"');

    // Watching
    expect(html).toContain("Watching");
    expect(html).toContain("5");
    expect(html).toContain('href="/library?status=WATCHING"');

    // Plan to Watch
    expect(html).toContain("Plan to Watch");
    expect(html).toContain("15");
    expect(html).toContain('href="/library?status=PLAN_TO_WATCH"');
  });

  it("renders zeros without hiding tiles when totalTracked is 0 (UI spec 10.2)", () => {
    const zeroStats = {
      totalTracked: 0,
      watched: 0,
      watching: 0,
      planToWatch: 0,
      onHold: 0,
      dropped: 0,
    };

    const html = renderToStaticMarkup(<StatsBand stats={zeroStats} />);

    expect(html).toContain("Total tracked");
    expect(html).toContain("Watched");
    expect(html).toContain("Watching");
    expect(html).toContain("Plan to Watch");
    expect(html).toContain(">0<");
  });
});
