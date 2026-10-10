import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MediaGrid, MediaGridSkeleton } from "./media-grid";
import { MediaCardProps } from "./media-card";

describe("MediaGrid", () => {
  const sampleItems: MediaCardProps[] = [
    {
      id: "item-1",
      title: "Inception",
      mediaType: "MOVIE",
      year: 2010,
      rating: 9.0,
      status: "WATCHED",
    },
    {
      id: "item-2",
      title: "Severance",
      mediaType: "TV",
      year: 2022,
      status: "WATCHING",
      currentEpisode: 7,
      totalEpisodes: 9,
    },
  ];

  it("renders with default responsive grid classes", () => {
    const html = renderToStaticMarkup(
      <MediaGrid>
        <div data-testid="child-1">Card 1</div>
      </MediaGrid>,
    );

    expect(html).toContain('data-testid="media-grid"');
    expect(html).toContain("grid-cols-2");
    expect(html).toContain("sm:grid-cols-3");
    expect(html).toContain("md:grid-cols-4");
    expect(html).toContain("lg:grid-cols-4");
    expect(html).toContain("xl:grid-cols-5");
    expect(html).toContain("2xl:grid-cols-6");
    expect(html).toContain('data-testid="child-1"');
  });

  it("renders items from items prop array", () => {
    const html = renderToStaticMarkup(<MediaGrid items={sampleItems} />);

    expect(html).toContain("Inception");
    expect(html).toContain("Severance");
    expect(html).toContain("Movie");
    expect(html).toContain("TV Show");
  });

  it("renders custom markup using renderItem prop", () => {
    const html = renderToStaticMarkup(
      <MediaGrid
        items={sampleItems}
        renderItem={(item) => (
          <div key={item.id} data-testid={`custom-${item.id}`}>
            Custom: {item.title}
          </div>
        )}
      />,
    );

    expect(html).toContain('data-testid="custom-item-1"');
    expect(html).toContain("Custom: Inception");
    expect(html).toContain('data-testid="custom-item-2"');
    expect(html).toContain("Custom: Severance");
  });

  it("renders skeleton loading state when isLoading is true", () => {
    const html = renderToStaticMarkup(<MediaGrid items={sampleItems} isLoading={true} />);

    expect(html).toContain('data-testid="media-grid-skeleton"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aria-label="Loading media library items"');
    // Default count is 12
    const skeletonMatches = html.match(/data-testid="media-card-skeleton"/g);
    expect(skeletonMatches?.length).toBe(12);
    // Does not render actual item titles while loading
    expect(html).not.toContain("Inception");
  });

  it("respects custom skeletonCount during loading", () => {
    const html = renderToStaticMarkup(<MediaGrid isLoading={true} skeletonCount={6} />);

    const skeletonMatches = html.match(/data-testid="media-card-skeleton"/g);
    expect(skeletonMatches?.length).toBe(6);
  });

  it("renders emptyState when items list is empty and not loading", () => {
    const emptyMarkup = <div data-testid="empty-test">No titles found.</div>;
    const html = renderToStaticMarkup(<MediaGrid items={[]} emptyState={emptyMarkup} />);

    expect(html).toContain('data-testid="media-grid-empty-container"');
    expect(html).toContain('data-testid="empty-test"');
    expect(html).toContain("No titles found.");
  });

  it("does not render emptyState when items are present", () => {
    const emptyMarkup = <div data-testid="empty-test">No titles found.</div>;
    const html = renderToStaticMarkup(<MediaGrid items={sampleItems} emptyState={emptyMarkup} />);

    expect(html).not.toContain('data-testid="media-grid-empty-container"');
    expect(html).toContain("Inception");
  });

  it("supports compact and spacious density variants", () => {
    const compactHtml = renderToStaticMarkup(
      <MediaGrid density="compact">
        <div>Item</div>
      </MediaGrid>,
    );
    expect(compactHtml).toContain("2xl:grid-cols-7");

    const spaciousHtml = renderToStaticMarkup(
      <MediaGrid density="spacious">
        <div>Item</div>
      </MediaGrid>,
    );
    expect(spaciousHtml).toContain("2xl:grid-cols-5");
  });

  it("renders as semantic element tag specified by 'as' prop", () => {
    const html = renderToStaticMarkup(
      <MediaGrid as="section" aria-label="Media Shelf">
        <div>Item</div>
      </MediaGrid>,
    );

    expect(html.startsWith("<section")).toBe(true);
    expect(html).toContain('aria-label="Media Shelf"');
  });
});

describe("MediaGridSkeleton", () => {
  it("renders standalone skeleton with specified count and density", () => {
    const html = renderToStaticMarkup(<MediaGridSkeleton count={8} density="compact" />);

    expect(html).toContain('data-testid="media-grid-skeleton"');
    expect(html).toContain("2xl:grid-cols-7");
    const skeletonMatches = html.match(/data-testid="media-card-skeleton"/g);
    expect(skeletonMatches?.length).toBe(8);
  });
});
