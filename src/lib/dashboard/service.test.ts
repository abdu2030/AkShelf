import { beforeEach, describe, expect, it, vi } from "vitest";
import { computeDashboardStats, getDashboardStats } from "./service";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => {
  const mockPrisma = {
    userTitle: {
      groupBy: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

describe("Dashboard Service (Day 36)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("computeDashboardStats (Pure Function)", () => {
    it("aggregates status counts correctly from an array of items", () => {
      const items = [
        { status: "WATCHED" },
        { status: "WATCHED" },
        { status: "WATCHING" },
        { status: "PLAN_TO_WATCH" },
        { status: "PLAN_TO_WATCH" },
        { status: "PLAN_TO_WATCH" },
        { status: "ON_HOLD" },
        { status: "DROPPED" },
        { status: null },
      ];

      const stats = computeDashboardStats(items);

      expect(stats.totalTracked).toBe(8);
      expect(stats.watched).toBe(2);
      expect(stats.watching).toBe(1);
      expect(stats.planToWatch).toBe(3);
      expect(stats.onHold).toBe(1);
      expect(stats.dropped).toBe(1);
    });

    it("returns zero counts for an empty array", () => {
      const stats = computeDashboardStats([]);

      expect(stats.totalTracked).toBe(0);
      expect(stats.watched).toBe(0);
      expect(stats.watching).toBe(0);
      expect(stats.planToWatch).toBe(0);
      expect(stats.onHold).toBe(0);
      expect(stats.dropped).toBe(0);
    });
  });

  describe("getDashboardStats (Database Integration)", () => {
    it("queries PostgreSQL groupBy for authenticated user and returns accurate live counts", async () => {
      vi.mocked(prisma.userTitle.groupBy).mockResolvedValueOnce([
        { status: "WATCHED", _count: { status: 15 } },
        { status: "WATCHING", _count: { status: 4 } },
        { status: "PLAN_TO_WATCH", _count: { status: 9 } },
        { status: "ON_HOLD", _count: { status: 2 } },
      ] as unknown as never);

      const stats = await getDashboardStats({ userId: "owner-123" });

      expect(prisma.userTitle.groupBy).toHaveBeenCalledWith({
        by: ["status"],
        where: { userId: "owner-123" },
        _count: { status: true },
      });

      expect(stats.totalTracked).toBe(30);
      expect(stats.watched).toBe(15);
      expect(stats.watching).toBe(4);
      expect(stats.planToWatch).toBe(9);
      expect(stats.onHold).toBe(2);
      expect(stats.dropped).toBe(0);
    });

    it("returns zero counts for a new user with zero tracked titles", async () => {
      vi.mocked(prisma.userTitle.groupBy).mockResolvedValueOnce([] as unknown as never);

      const stats = await getDashboardStats({ userId: "new-user-001" });

      expect(stats.totalTracked).toBe(0);
      expect(stats.watched).toBe(0);
      expect(stats.watching).toBe(0);
      expect(stats.planToWatch).toBe(0);
      expect(stats.onHold).toBe(0);
      expect(stats.dropped).toBe(0);
    });

    it("falls back to demo title counts when no userId is supplied (guest mode)", async () => {
      const stats = await getDashboardStats({ userId: null });

      // Demo dataset has titles tracked
      expect(stats.totalTracked).toBeGreaterThan(0);
      expect(stats.watched).toBeGreaterThan(0);
      expect(prisma.userTitle.groupBy).not.toHaveBeenCalled();
    });

    it("handles database query errors safely and returns zero fallback", async () => {
      vi.mocked(prisma.userTitle.groupBy).mockRejectedValueOnce(new Error("Connection timeout"));

      const stats = await getDashboardStats({ userId: "owner-123" });

      expect(stats.totalTracked).toBe(0);
      expect(stats.watched).toBe(0);
      expect(stats.watching).toBe(0);
      expect(stats.planToWatch).toBe(0);
    });
  });
});
