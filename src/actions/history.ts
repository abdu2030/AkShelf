"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  getWatchHistory,
  clearWatchHistory,
  GetWatchHistoryOptions,
  GetWatchHistoryResult,
} from "@/lib/history/service";

export async function fetchMoreHistoryAction(
  options: GetWatchHistoryOptions,
): Promise<GetWatchHistoryResult> {
  return getWatchHistory(options);
}

export interface ClearWatchHistoryResult {
  success: boolean;
  error?: string;
  count?: number;
}

export async function clearWatchHistoryAction(): Promise<ClearWatchHistoryResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      success: false,
      error: "Authentication required to clear watch history.",
    };
  }

  const result = await clearWatchHistory(userId);
  if (!result.success) {
    return {
      success: false,
      error: "Database error occurred while clearing watch history.",
    };
  }

  revalidatePath("/history");
  revalidatePath("/");

  return {
    success: true,
    count: result.count,
  };
}
