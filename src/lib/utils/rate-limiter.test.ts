import { describe, expect, it } from "vitest";
import { RateLimiter } from "./rate-limiter";

describe("RateLimiter utility", () => {
  it("executes operations synchronously within maxRequests limit", async () => {
    const limiter = new RateLimiter({
      maxRequests: 5,
      perWindowMs: 1000,
    });

    const results: number[] = [];
    const tasks = [1, 2, 3].map((val) =>
      limiter.schedule(async () => {
        results.push(val);
        return val * 2;
      }),
    );

    const resolved = await Promise.all(tasks);
    expect(resolved).toEqual([2, 4, 6]);
    expect(results).toEqual([1, 2, 3]);
  });

  it("retries on 429 rate limit errors with backoff", async () => {
    const limiter = new RateLimiter({
      maxRequests: 10,
      perWindowMs: 1000,
      maxRetries: 2,
      initialRetryDelayMs: 20,
    });

    let calls = 0;
    const result = await limiter.schedule(async () => {
      calls++;
      if (calls < 2) {
        throw new Error("HTTP 429: Too Many Requests");
      }
      return "recovered";
    });

    expect(result).toBe("recovered");
    expect(calls).toBe(2);
  });

  it("retries on server 500 error", async () => {
    const limiter = new RateLimiter({
      maxRequests: 10,
      perWindowMs: 1000,
      maxRetries: 3,
      initialRetryDelayMs: 10,
    });

    let calls = 0;
    const result = await limiter.schedule(async () => {
      calls++;
      if (calls === 1) {
        throw new Error("503 Service Unavailable");
      }
      return "success";
    });

    expect(result).toBe("success");
    expect(calls).toBe(2);
  });

  it("does not retry on client 404 or 400 errors", async () => {
    const limiter = new RateLimiter({
      maxRequests: 10,
      perWindowMs: 1000,
      maxRetries: 3,
      initialRetryDelayMs: 10,
    });

    let calls = 0;
    await expect(
      limiter.schedule(async () => {
        calls++;
        throw new Error("404 Not Found");
      }),
    ).rejects.toThrow("404 Not Found");

    expect(calls).toBe(1);
  });

  it("times out if operation exceeds configured timeoutMs", async () => {
    const limiter = new RateLimiter({
      maxRequests: 10,
      perWindowMs: 1000,
      maxRetries: 0,
    });

    await expect(
      limiter.schedule(
        async () => {
          await new Promise((res) => setTimeout(res, 200));
          return "too late";
        },
        { timeoutMs: 50 },
      ),
    ).rejects.toThrow("Operation timed out after 50ms");
  });

  it("clears timeout timer upon successful operation resolution", async () => {
    const limiter = new RateLimiter({
      maxRequests: 10,
      perWindowMs: 1000,
    });

    const result = await limiter.schedule(
      async () => {
        return "immediate-success";
      },
      { timeoutMs: 50 },
    );

    expect(result).toBe("immediate-success");
    // Wait past the timeout to ensure no orphan timer fires
    await new Promise((res) => setTimeout(res, 70));
  });
});
