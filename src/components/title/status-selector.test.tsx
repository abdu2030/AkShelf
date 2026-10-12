import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StatusSelector } from "./status-selector";

describe("StatusSelector Component", () => {
  it("renders '+ Add to Shelf' trigger when status is null or undefined", () => {
    const html = renderToStaticMarkup(<StatusSelector currentStatus={null} />);

    expect(html).toContain("+ Add to Shelf");
    expect(html).toContain('aria-label="Add title to shelf"');
  });

  it("renders active StatusBadge when current status is provided", () => {
    const html = renderToStaticMarkup(
      <StatusSelector currentStatus="WATCHING" titleExternalSource="tmdb" titleExternalId="1399" />,
    );

    expect(html).toContain("Watching");
    expect(html).toContain('aria-label="Change watch status, currently Watching"');
  });

  it("renders watched status badge correctly", () => {
    const html = renderToStaticMarkup(
      <StatusSelector currentStatus="WATCHED" titleExternalSource="tmdb" titleExternalId="27205" />,
    );

    expect(html).toContain("Watched");
  });
});
