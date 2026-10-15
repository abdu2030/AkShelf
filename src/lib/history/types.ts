export interface HistoryItem {
  id: string;
  titleId: string;
  titleName: string;
  titleExternalSource: string;
  titleExternalId: string;
  mediaType: "MOVIE" | "TV" | "ANIME";
  posterUrl?: string | null;
  action: string;
  actionSentence: string;
  status?: string | null;
  rating?: number | null;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
  occurredAt: string; // ISO string for reliable client/server serialization
  timeFormatted: string; // e.g. "7:42 PM"
}

export interface HistoryDayGroup {
  dayLabel: string; // "TODAY", "YESTERDAY", "OCT 7, 2026"
  dateKey: string;
  items: HistoryItem[];
}
