import { prisma } from "@/lib/db";
import { demoTitles } from "@/lib/data/demo-titles";

export interface DashboardStats {
  totalTracked: number;
  watched: number;
  watching: number;
  planToWatch: number;
  onHold: number;
  dropped: number;
}

/**
 * Pure function to aggregate status counts from an array of title status items.
 */
export function computeDashboardStats(
  items: Array<{ status: string | null | undefined }>,
): DashboardStats {
  let totalTracked = 0;
  let watched = 0;
  let watching = 0;
  let planToWatch = 0;
  let onHold = 0;
  let dropped = 0;

  for (const item of items) {
    if (!item.status) continue;
    totalTracked++;

    switch (item.status) {
      case "WATCHED":
        watched++;
        break;
      case "WATCHING":
        watching++;
        break;
      case "PLAN_TO_WATCH":
        planToWatch++;
        break;
      case "ON_HOLD":
        onHold++;
        break;
      case "DROPPED":
        dropped++;
        break;
    }
  }

  return {
    totalTracked,
    watched,
    watching,
    planToWatch,
    onHold,
    dropped,
  };
}

/**
 * Retrieve live dashboard statistics for the given user from PostgreSQL.
 * If no userId is supplied (guest/demo mode), falls back to demo title counts.
 */
export async function getDashboardStats(params: {
  userId?: string | null;
}): Promise<DashboardStats> {
  const { userId } = params;

  if (!userId) {
    // Guest or demo mode: aggregate counts from demo titles
    return computeDashboardStats(demoTitles);
  }

  try {
    const statusGroups = await prisma.userTitle.groupBy({
      by: ["status"],
      where: { userId },
      _count: { status: true },
    });

    let totalTracked = 0;
    let watched = 0;
    let watching = 0;
    let planToWatch = 0;
    let onHold = 0;
    let dropped = 0;

    for (const group of statusGroups) {
      const count = group._count.status;
      totalTracked += count;

      switch (group.status) {
        case "WATCHED":
          watched += count;
          break;
        case "WATCHING":
          watching += count;
          break;
        case "PLAN_TO_WATCH":
          planToWatch += count;
          break;
        case "ON_HOLD":
          onHold += count;
          break;
        case "DROPPED":
          dropped += count;
          break;
      }
    }

    return {
      totalTracked,
      watched,
      watching,
      planToWatch,
      onHold,
      dropped,
    };
  } catch (error) {
    console.error("[DashboardService] Failed to fetch live dashboard stats from DB:", error);
    // Return empty fallback on database error to avoid breaking page render
    return {
      totalTracked: 0,
      watched: 0,
      watching: 0,
      planToWatch: 0,
      onHold: 0,
      dropped: 0,
    };
  }
}
