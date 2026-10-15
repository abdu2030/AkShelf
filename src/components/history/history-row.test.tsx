import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HistoryRow } from "./history-row";
import { HistoryItem } from "@/lib/history/types";

describe("HistoryRow Component", () => {
  const mockItem: HistoryItem = {
    id: "hist-1",
    titleId: "title-1",
    titleName: "Inception",
    titleExternalSource: "tmdb",
    titleExternalId: "27205",
    mediaType: "MOVIE",
    posterUrl: "https://image.tmdb.org/t/p/w500/test.jpg",
    action: "STATUS_WATCHED",
    actionSentence: "Marked as Watched",
    status: "WATCHED",
    rating: 9.5,
    occurredAt: "2026-10-15T19:42:00Z",
    timeFormatted: "7:42 PM",
  };

  it("renders title, action sentence, status, rating, and timestamp", () => {
    const html = renderToStaticMarkup(<HistoryRow item={mockItem} />);

    expect(html).toContain("Inception");
    expect(html).toContain("Marked as Watched");
    expect(html).toContain("Watched");
    expect(html).toContain("9.5/10");
    expect(html).toContain("7:42 PM");
    expect(html).toContain('href="/title/tmdb:27205"');
  });
});
