import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProgressBar } from "./progress-bar";

describe("ProgressBar Component", () => {
  it("renders with correct accessibility attributes", () => {
    const html = renderToStaticMarkup(<ProgressBar value={14} max={28} />);
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="50"');
    expect(html).toContain('aria-valuemin="0"');
    expect(html).toContain('aria-valuemax="100"');
    expect(html).toContain("14 / 28 episodes");
    expect(html).toContain("width:50%");
  });

  it("handles zero and 100 percent edge cases correctly", () => {
    const htmlZero = renderToStaticMarkup(<ProgressBar value={0} max={10} />);
    expect(htmlZero).toContain('aria-valuenow="0"');
    expect(htmlZero).toContain("width:0%");

    const htmlFull = renderToStaticMarkup(<ProgressBar value={10} max={10} />);
    expect(htmlFull).toContain('aria-valuenow="100"');
    expect(htmlFull).toContain("width:100%");
  });

  it("renders custom label and percentage when requested", () => {
    const html = renderToStaticMarkup(
      <ProgressBar value={12} max={24} showPercent label="Halfway there" />,
    );
    expect(html).toContain("Halfway there");
  });
});
