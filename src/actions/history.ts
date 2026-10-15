"use server";

import {
  getWatchHistory,
  GetWatchHistoryOptions,
  GetWatchHistoryResult,
} from "@/lib/history/service";

export async function fetchMoreHistoryAction(
  options: GetWatchHistoryOptions,
): Promise<GetWatchHistoryResult> {
  return getWatchHistory(options);
}
