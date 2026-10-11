interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
}

export interface MetadataCacheOptions {
  /** Default Time-to-Live in milliseconds. Defaults to 30 minutes (1,800,000 ms). */
  defaultTtlMs?: number;
  /** Maximum number of cached items before LRU eviction triggers. Defaults to 500. */
  maxEntries?: number;
}

/**
 * High-performance in-memory cache with TTL expiration and LRU eviction.
 * Designed for server-side caching of external metadata requests, searches,
 * and title detail responses.
 */
export class MetadataCache<T = unknown> {
  private store = new Map<string, CacheEntry<T>>();
  private defaultTtlMs: number;
  private maxEntries: number;
  private accessCounter = 0;

  constructor(options: MetadataCacheOptions = {}) {
    this.defaultTtlMs = options.defaultTtlMs ?? 30 * 60 * 1000; // 30 minutes
    this.maxEntries = options.maxEntries ?? 500;
  }

  /**
   * Retrieves a cached value if present and not expired.
   */
  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    // Update monotonic counter for deterministic LRU tracking
    entry.lastAccessed = ++this.accessCounter;
    return entry.value;
  }

  /**
   * Stores a value in cache with an optional custom TTL.
   */
  set(key: string, value: T, ttlMs?: number): void {
    const now = Date.now();
    const effectiveTtl = ttlMs !== undefined ? ttlMs : this.defaultTtlMs;

    // If max entries reached and key is new, evict oldest / expired entry
    if (!this.store.has(key) && this.store.size >= this.maxEntries) {
      this.evict();
    }

    this.store.set(key, {
      value,
      expiresAt: now + effectiveTtl,
      lastAccessed: ++this.accessCounter,
    });
  }

  /**
   * Checks whether a valid (non-expired) key exists in the cache.
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Removes a specific key from the cache.
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Clears all stored items from the cache.
   */
  clear(): void {
    this.store.clear();
    this.accessCounter = 0;
  }

  /**
   * Returns current count of valid cached entries (prunes expired first).
   */
  size(): number {
    this.prune();
    return this.store.size;
  }

  /**
   * Purges all expired entries from cache and returns count of removed items.
   */
  prune(): number {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        removed++;
      }
    }
    return removed;
  }

  /**
   * Retrieves an item if present, otherwise executes the async fetcher,
   * caches the result, and returns it.
   */
  async getOrSet<R = T>(key: string, fetcher: () => Promise<R>, ttlMs?: number): Promise<R> {
    const cached = this.get(key) as R | undefined;
    if (cached !== undefined) {
      return cached;
    }

    const value = await fetcher();
    this.set(key, value as unknown as T, ttlMs);
    return value;
  }

  /**
   * Internal eviction strategy: first tries to evict any expired item.
   * If none are expired, evicts the least recently accessed item.
   */
  private evict(): void {
    const now = Date.now();

    // 1. Look for an expired entry to drop
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        return;
      }
    }

    // 2. Otherwise drop the least recently accessed entry
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.store.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.store.delete(oldestKey);
    }
  }
}

/**
 * Shared global singleton metadata cache.
 */
export const metadataCache = new MetadataCache();
