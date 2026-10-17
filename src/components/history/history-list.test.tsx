import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HistoryList } from "./history-list";
import { HistoryItem } from "@/lib/history/types";

describe("HistoryList Component", () => {
  const mockItems: HistoryItem[] = [
    {
      id: "h1",
      titleId: "t1",
      titleName: "Inception",
      titleExternalSource: "tmdb",
      titleExternalId: "27205",
      mediaType: "MOVIE",
      action: "STATUS_WATCHED",
      actionSentence: "Marked as Watched",
      status: "WATCHED",
      rating: 9.5,
      occurredAt: new Date().toISOString(),
      timeFormatted: "7:42 PM",
    },
  ];

  it("renders media type filter chips and activity entries", () => {
    const html = renderToStaticMarkup(
      <HistoryList initialItems={mockItems} totalCount={1} initialHasMore={false} />,
    );

    expect(html).toContain("All");
    expect(html).toContain("Movies");
    expect(html).toContain("TV");
    expect(html).toContain("Anime");
    expect(html).toContain("TODAY");
    expect(html).toContain("Inception");
    expect(html).toContain("Marked as Watched");
  });

  it("renders empty state when items list is empty", () => {
    const html = renderToStaticMarkup(
      <HistoryList initialItems={[]} totalCount={0} initialHasMore={false} />,
    );

    expect(html).toContain("Nothing here yet");
    expect(html).toContain("Your activity will appear as you track titles.");
    expect(html).toContain("Search titles");
  });

  it("renders 'Show earlier activity' button when hasMore is true", () => {
    const html = renderToStaticMarkup(
      <HistoryList initialItems={mockItems} totalCount={10} initialHasMore={true} />,
    );

    expect(html).toContain("Show earlier activity");
  });

  it("renders 'Clear history' button when items are present", () => {
    const html = renderToStaticMarkup(
      <HistoryList initialItems={mockItems} totalCount={1} initialHasMore={false} />,
    );

    expect(html).toContain("Clear history");
  });

  it("does not render 'Clear history' button when items list is empty", () => {
    const html = renderToStaticMarkup(
      <HistoryList initialItems={[]} totalCount={0} initialHasMore={false} />,
    );

    expect(html).not.toContain("Clear history");
  });
});
