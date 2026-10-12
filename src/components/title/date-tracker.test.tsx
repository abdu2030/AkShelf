import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DateTracker } from "./date-tracker";

describe("DateTracker Component", () => {
  it("renders empty state when no dates are set", () => {
    const html = renderToStaticMarkup(<DateTracker startedAt={null} watchedAt={null} />);

    expect(html).toContain("Watch Dates:");
    expect(html).toContain("No dates logged");
    expect(html).toContain("+ Add dates");
  });

  it("renders formatted started and finished dates when provided", () => {
    const html = renderToStaticMarkup(
      <DateTracker startedAt="2026-10-01" watchedAt="2026-10-10" />,
    );

    expect(html).toContain("Started:");
    expect(html).toContain("Oct 1, 2026");
    expect(html).toContain("Finished:");
    expect(html).toContain("Oct 10, 2026");
    expect(html).toContain("Edit dates");
  });
});
