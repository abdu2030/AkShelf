import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LibraryEmptyState, getFilterEmptyStateText } from "./library-empty-state";

describe("getFilterEmptyStateText", () => {
  it("generates correct copy when both media type and status are filtered", () => {
    const animeWatching = getFilterEmptyStateText("ANIME", "WATCHING");
    expect(animeWatching.headline).toBe("No currently watching anime");
    expect(animeWatching.body).toContain("anime");
    expect(animeWatching.body).toContain("Watching");

    const movieWatched = getFilterEmptyStateText("MOVIE", "WATCHED");
    expect(movieWatched.headline).toBe("No watched movies");
    expect(movieWatched.body).toContain("movie");
    expect(movieWatched.body).toContain("Watched");

    const tvPlanToWatch = getFilterEmptyStateText("TV", "PLAN_TO_WATCH");
    expect(tvPlanToWatch.headline).toBe("No plan to watch TV shows");
    expect(tvPlanToWatch.body).toContain("TV show");
    expect(tvPlanToWatch.body).toContain("Plan to Watch");
  });

  it("generates correct copy when only media type is filtered", () => {
    const movieOnly = getFilterEmptyStateText("MOVIE", "ALL");
    expect(movieOnly.headline).toBe("No movies on your shelf");
    expect(movieOnly.body).toContain("movies");

    const animeOnly = getFilterEmptyStateText("ANIME", "ALL");
    expect(animeOnly.headline).toBe("No anime on your shelf");
    expect(animeOnly.body).toContain("anime");
  });

  it("generates correct copy when only status is filtered", () => {
    const onHoldOnly = getFilterEmptyStateText("ALL", "ON_HOLD");
    expect(onHoldOnly.headline).toBe("No titles on hold");
    expect(onHoldOnly.body).toContain("On Hold");

    const droppedOnly = getFilterEmptyStateText("ALL", "DROPPED");
    expect(droppedOnly.headline).toBe("No titles dropped");
    expect(droppedOnly.body).toContain("Dropped");
  });

  it("falls back to default message when neither is filtered", () => {
    const none = getFilterEmptyStateText("ALL", "ALL");
    expect(none.headline).toBe("No matching titles found");
    expect(none.body).toContain("matching the active filters");
  });
});

describe("LibraryEmptyState Component", () => {
  it("renders full empty library state when user has zero items", () => {
    const html = renderToStaticMarkup(
      <LibraryEmptyState
        hasAnyItems={false}
        selectedType="ALL"
        selectedStatus="ALL"
        onResetFilters={() => {}}
      />,
    );

    expect(html).toContain('data-testid="library-empty-state"');
    expect(html).toContain('data-empty-type="empty-library"');
    expect(html).toContain("Nothing on your shelf yet");
    expect(html).toContain("Search titles");
    expect(html).toContain('href="/search"');
  });

  it("renders filter empty state with reset button when filters produce 0 matches", () => {
    const html = renderToStaticMarkup(
      <LibraryEmptyState
        hasAnyItems={true}
        selectedType="MOVIE"
        selectedStatus="ALL"
        onResetFilters={() => {}}
      />,
    );

    expect(html).toContain('data-testid="library-empty-state"');
    expect(html).toContain('data-empty-type="empty-filter"');
    expect(html).toContain('data-testid="empty-headline"');
    expect(html).toContain("No movies on your shelf");
    expect(html).toContain('data-testid="empty-reset-all-button"');
    expect(html).toContain("Reset all filters");
    expect(html).toContain('data-testid="empty-search-link-button"');
    expect(html).toContain('href="/search?type=movie"');
  });

  it("renders granular quick-action buttons when both type and status filters are set", () => {
    const html = renderToStaticMarkup(
      <LibraryEmptyState
        hasAnyItems={true}
        selectedType="ANIME"
        selectedStatus="WATCHING"
        onResetFilters={() => {}}
        onClearTypeFilter={() => {}}
        onClearStatusFilter={() => {}}
      />,
    );

    expect(html).toContain('data-testid="empty-clear-status-button"');
    expect(html).toContain("Show all anime");
    expect(html).toContain('data-testid="empty-clear-type-button"');
    expect(html).toContain("Show all currently watching");
    expect(html).toContain('data-testid="empty-reset-all-button"');
  });

  it("omits granular buttons when only one filter dimension is active", () => {
    const html = renderToStaticMarkup(
      <LibraryEmptyState
        hasAnyItems={true}
        selectedType="ALL"
        selectedStatus="WATCHED"
        onResetFilters={() => {}}
        onClearTypeFilter={() => {}}
        onClearStatusFilter={() => {}}
      />,
    );

    expect(html).not.toContain('data-testid="empty-clear-status-button"');
    expect(html).not.toContain('data-testid="empty-clear-type-button"');
    expect(html).toContain('data-testid="empty-reset-all-button"');
  });
});
