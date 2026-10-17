import React from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Logo, LogoMark } from "./logo";

describe("Logo and LogoMark", () => {
  it("renders LogoMark with default badge and obsidian gradient", () => {
    const html = renderToStaticMarkup(<LogoMark size={40} className="custom-mark" />);
    expect(html).toContain('width="40"');
    expect(html).toContain('height="40"');
    expect(html).toContain('linearGradient id="akshelf-gate-bg"');
    expect(html).toContain("custom-mark");
  });

  it("renders LogoMark bare version without badge gradient", () => {
    const html = renderToStaticMarkup(<LogoMark bare size={24} />);
    expect(html).toContain('width="24"');
    expect(html).not.toContain('id="akshelf-gate-bg"');
    expect(html).toContain('fill="currentColor"');
  });

  it("renders full Logo with AkShelf text and subtitle", () => {
    const html = renderToStaticMarkup(<Logo />);
    expect(html).toContain("AkShelf");
    expect(html).toContain("Watch Tracker");
  });

  it("renders full Logo without subtitle when showSubtitle is false", () => {
    const html = renderToStaticMarkup(<Logo showSubtitle={false} />);
    expect(html).toContain("AkShelf");
    expect(html).not.toContain("Watch Tracker");
  });
});
