import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RatingControl } from "./rating-control";

describe("RatingControl Component", () => {
  it("renders 10 score buttons with proper radio group semantics", () => {
    const html = renderToStaticMarkup(<RatingControl currentRating={null} />);

    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-label="Your rating"');
    for (let i = 1; i <= 10; i++) {
      expect(html).toContain(`aria-label="Rate ${i} out of 10"`);
      expect(html).toContain(`>${i}</button>`);
    }
  });

  it("renders rating score and Clear button when rating is set", () => {
    const html = renderToStaticMarkup(<RatingControl currentRating={8} />);

    expect(html).toContain("Your rating:");
    expect(html).toContain(">8<");
    expect(html).toContain("/10");
    expect(html).toContain("Clear rating");
  });

  it("does not render Clear rating button when no rating exists", () => {
    const html = renderToStaticMarkup(<RatingControl currentRating={null} />);

    expect(html).toContain("Rate this title:");
    expect(html).not.toContain("Clear rating");
  });
});
