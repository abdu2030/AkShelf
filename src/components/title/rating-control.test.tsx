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

  it("renders rating score and Clear button when integer rating is set", () => {
    const html = renderToStaticMarkup(<RatingControl currentRating={8} />);

    expect(html).toContain("Your rating:");
    expect(html).toContain(">8<");
    expect(html).toContain("/10");
    expect(html).toContain("Clear rating");
    expect(html).toContain('value="8"');
  });

  it("renders decimal float ratings (e.g. 8.5) and populates the custom input", () => {
    const html = renderToStaticMarkup(<RatingControl currentRating={8.5} />);

    expect(html).toContain("Your rating:");
    expect(html).toContain(">8.5<");
    expect(html).toContain("/10");
    expect(html).toContain("Clear rating");
    expect(html).toContain('value="8.5"');
    expect(html).toContain('aria-label="Custom decimal rating from 1 to 10"');
  });

  it("renders decimal input field with step 0.1 and min 1 max 10 attributes", () => {
    const html = renderToStaticMarkup(<RatingControl currentRating={null} />);

    expect(html).toContain('type="number"');
    expect(html).toContain('step="0.1"');
    expect(html).toContain('min="1"');
    expect(html).toContain('max="10"');
    expect(html).toContain('placeholder="e.g. 8.5"');
  });

  it("does not render Clear rating button when no rating exists", () => {
    const html = renderToStaticMarkup(<RatingControl currentRating={null} />);

    expect(html).toContain("Rate this title:");
    expect(html).not.toContain("Clear rating");
    expect(html).toContain('value=""');
  });
});
