import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkDatabaseConnection } from "./health";
import { prisma } from "./prisma";

describe("checkDatabaseConnection", () => {
  const originalEnv = process.env.DATABASE_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalEnv;
  });

  it("returns error when DATABASE_URL is not set", async () => {
    delete process.env.DATABASE_URL;
    const result = await checkDatabaseConnection();

    expect(result.connected).toBe(false);
    expect(result.error).toContain("DATABASE_URL");
  });

  it("returns connected: true when query succeeds", async () => {
    process.env.DATABASE_URL = "postgresql://mock:mock@localhost:5432/mock";
    vi.spyOn(prisma, "$queryRaw").mockResolvedValueOnce([{ result: 1 }]);

    const result = await checkDatabaseConnection();
    expect(result.connected).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("handles database connection failure gracefully", async () => {
    process.env.DATABASE_URL = "postgresql://mock:mock@localhost:5432/mock";
    vi.spyOn(prisma, "$queryRaw").mockRejectedValueOnce(
      new Error("Connection refused at localhost:5432"),
    );

    const result = await checkDatabaseConnection();
    expect(result.connected).toBe(false);
    expect(result.error).toContain("Connection refused");
  });
});
