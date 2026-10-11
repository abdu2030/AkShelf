/**
 * Resilient token bucket rate limiter with sliding window throttle and exponential backoff retry.
 * Designed to strictly adhere to external API constraints (TMDB: ~40 req/10s, AniList: ~90 req/60s).
 */

export interface RateLimiterOptions {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Duration of the sliding rate-limit window in milliseconds */
  perWindowMs: number;
  /** Maximum retry attempts on 429 (rate-limit) or 5xx server errors */
  maxRetries?: number;
  /** Initial base delay in milliseconds before first retry */
  initialRetryDelayMs?: number;
  /** Maximum retry delay in milliseconds */
  maxRetryDelayMs?: number;
}

export class RateLimiter {
  private maxRequests: number;
  private perWindowMs: number;
  private maxRetries: number;
  private initialRetryDelayMs: number;
  private maxRetryDelayMs: number;

  private timestamps: number[] = [];
  private queue: Array<() => void> = [];
  private processingQueue = false;

  constructor(options: RateLimiterOptions) {
    this.maxRequests = options.maxRequests;
    this.perWindowMs = options.perWindowMs;
    this.maxRetries = options.maxRetries ?? 3;
    this.initialRetryDelayMs = options.initialRetryDelayMs ?? 500;
    this.maxRetryDelayMs = options.maxRetryDelayMs ?? 10000;
  }

  /**
   * Acquire a rate limit slot, waiting until a slot is available under the sliding window.
   */
  private async acquireSlot(): Promise<void> {
    const now = Date.now();
    // Prune timestamps older than window
    this.timestamps = this.timestamps.filter((t) => now - t < this.perWindowMs);

    if (this.timestamps.length < this.maxRequests) {
      this.timestamps.push(Date.now());
      return;
    }

    // Calculate wait time until oldest timestamp leaves the window
    const oldest = this.timestamps[0];
    const waitMs = Math.max(0, this.perWindowMs - (now - oldest) + 15);

    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        await this.acquireSlot();
        resolve();
      }, waitMs);
    });
  }

  /**
   * Schedules an asynchronous operation within the rate limits, with automatic retry handling.
   */
  async schedule<T>(
    operation: () => Promise<T>,
    options?: {
      timeoutMs?: number;
      signal?: AbortSignal;
    },
  ): Promise<T> {
    let attempt = 0;

    while (attempt <= this.maxRetries) {
      if (options?.signal?.aborted) {
        throw new Error("Operation aborted before acquisition");
      }

      await this.acquireSlot();

      try {
        if (!options?.timeoutMs) {
          return await operation();
        }

        // Wrap with timeout if configured
        const timeoutPromise = new Promise<never>((_, reject) => {
          const timer = setTimeout(() => {
            reject(new Error(`Operation timed out after ${options.timeoutMs}ms`));
          }, options.timeoutMs);
          options?.signal?.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(new Error("Operation aborted"));
          });
        });

        return await Promise.race([operation(), timeoutPromise]);
      } catch (error: unknown) {
        attempt++;

        const isRateLimit =
          error instanceof Error &&
          (error.message.includes("429") ||
            error.message.toLowerCase().includes("rate limit") ||
            error.message.toLowerCase().includes("too many requests"));

        const isServerError =
          error instanceof Error &&
          (error.message.includes("500") ||
            error.message.includes("502") ||
            error.message.includes("503") ||
            error.message.includes("504"));

        const isNetworkFailure =
          error instanceof Error &&
          (error.message.toLowerCase().includes("fetch failed") ||
            error.message.toLowerCase().includes("network error") ||
            error.message.toLowerCase().includes("econnrefused") ||
            error.message.toLowerCase().includes("etimedout"));

        // Only retry retryable errors
        const shouldRetry =
          attempt <= this.maxRetries && (isRateLimit || isServerError || isNetworkFailure);

        if (!shouldRetry) {
          throw error;
        }

        // Exponential backoff with random jitter: base * 2^attempt + jitter
        const backoff = Math.min(
          this.maxRetryDelayMs,
          this.initialRetryDelayMs * Math.pow(2, attempt - 1),
        );
        const jitter = Math.floor(Math.random() * 150);
        const delay = backoff + jitter;

        await new Promise((res) => setTimeout(res, delay));
      }
    }

    throw new Error(`Exceeded maximum retry attempts (${this.maxRetries})`);
  }
}
