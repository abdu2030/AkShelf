import { describe, expect, it, vi } from "vitest";
import { isTransientDbError, withDbRetry } from "./retry";

describe("Database Retry Utility (withDbRetry)", () => {
  it("returns operation result immediately on success", async () => {
    const fn = vi.fn().mockResolvedValue("success");
    const result = await withDbRetry(fn);

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on transient Prisma connection errors and succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ code: "P1001", message: "Can't reach database server at host:6543" })
      .mockResolvedValueOnce("recovered");

    const result = await withDbRetry(fn, { delayMs: 10, retries: 2, label: "test-query" });

    expect(result).toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("retries on transient timeout errors and succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(
        new Error("Timed out fetching a new connection from the connection pool"),
      )
      .mockResolvedValueOnce(42);

    const result = await withDbRetry(fn, { delayMs: 10, retries: 2 });

    expect(result).toBe(42);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("re-throws immediately on non-transient errors (e.g. unique constraint violation)", async () => {
    const nonTransientError = { code: "P2002", message: "Unique constraint failed" };
    const fn = vi.fn().mockRejectedValue(nonTransientError);

    await expect(withDbRetry(fn, { retries: 2 })).rejects.toEqual(nonTransientError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("re-throws last error if all retries are exhausted", async () => {
    const transientError = { code: "P1001", message: "Can't reach database server" };
    const fn = vi.fn().mockRejectedValue(transientError);

    await expect(withDbRetry(fn, { delayMs: 10, retries: 2 })).rejects.toEqual(transientError);
    expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });
});

describe("isTransientDbError", () => {
  it("detects known transient Prisma error codes", () => {
    expect(isTransientDbError({ code: "P1001" })).toBe(true);
    expect(isTransientDbError({ code: "P1002" })).toBe(true);
    expect(isTransientDbError({ code: "P1008" })).toBe(true);
    expect(isTransientDbError({ code: "P1017" })).toBe(true);
    expect(isTransientDbError({ code: "P2024" })).toBe(true);
  });

  it("detects transient error messages", () => {
    expect(isTransientDbError(new Error("Can't reach database server at aws-0..."))).toBe(true);
    expect(isTransientDbError(new Error("Timed out fetching a new connection from the pool"))).toBe(
      true,
    );
    expect(isTransientDbError(new Error("connection reset by peer"))).toBe(true);
    expect(isTransientDbError(new Error("connect ECONNREFUSED 127.0.0.1:5432"))).toBe(true);
  });

  it("returns false for non-transient errors", () => {
    expect(isTransientDbError({ code: "P2002" })).toBe(false);
    expect(isTransientDbError(new Error("Invalid record cuid"))).toBe(false);
    expect(isTransientDbError(null)).toBe(false);
    expect(isTransientDbError(undefined)).toBe(false);
  });
});
