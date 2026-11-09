import React from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Logo, LogoMark } from "./logo";

describe("Logo and LogoMark", () => {
  it("renders LogoMark at the requested size", () => {
    const html = renderToStaticMarkup(<LogoMark size={40} className="custom-mark" />);
    expect(html).toContain('width="40"');
    expect(html).toContain('height="40"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("custom-mark");
  });

  it("renders LogoMark bare version without badge", () => {
    const html = renderToStaticMarkup(<LogoMark bare size={24} />);
    expect(html).toContain('width="24"');
    expect(html).not.toContain("<rect");
    expect(html).toContain('fill="currentColor"');
  });

  it("renders full Logo with AkShelf text and subtitle", () => {
    const html = renderToStaticMarkup(<Logo />);
    expect(html).toContain("AkShelf");
    expect(html).toContain("Private archive");
  });

  it("renders full Logo without subtitle when showSubtitle is false", () => {
    const html = renderToStaticMarkup(<Logo showSubtitle={false} />);
    expect(html).toContain("AkShelf");
    expect(html).not.toContain("Private archive");
  });
});
