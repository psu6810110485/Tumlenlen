export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Lightweight in-memory TTL cache with max-size eviction.
 * Suitable for short-term Google Places API response caching.
 */
export class MemoryTtlCache<T = unknown> {
  private readonly store = new Map<string, CacheEntry<T>>();
  private readonly maxEntries: number;

  constructor(maxEntries = 250) {
    this.maxEntries = maxEntries;
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    if (ttlMs <= 0) return;

    // Evict expired entries first, then oldest entry if still at capacity
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      const now = Date.now();
      for (const [k, entry] of this.store.entries()) {
        if (now >= entry.expiresAt) {
          this.store.delete(k);
        }
      }
      if (this.store.size >= this.maxEntries) {
        const oldestKey = this.store.keys().next().value;
        if (oldestKey !== undefined) {
          this.store.delete(oldestKey);
        }
      }
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

const globalForCache = globalThis as unknown as {
  placesMemoryCache: MemoryTtlCache | undefined;
};

export const placesCache =
  globalForCache.placesMemoryCache ?? new MemoryTtlCache(300);

if (process.env.NODE_ENV !== "production") {
  globalForCache.placesMemoryCache = placesCache;
}
