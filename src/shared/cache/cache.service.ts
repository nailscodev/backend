import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
  hits: number;
}

/**
 * Simple in-memory TTL cache service.
 * No additional dependencies required — uses a plain Map.
 *
 * Usage:
 *   const cached = this.cache.get<MyType>('key');
 *   if (!cached) {
 *     const fresh = await this.fetchData();
 *     this.cache.set('key', fresh, 300); // 300 seconds TTL
 *   }
 */
@Injectable()
export class AppCacheService {
  private readonly logger = new Logger(AppCacheService.name);
  private readonly store = new Map<string, CacheEntry<unknown>>();

  /** Get a cached value; returns null on miss or expiry */
  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    entry.hits++;
    return entry.data;
  }

  /** Store a value with a TTL in seconds */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
      createdAt: Date.now(),
      hits: 0,
    });
  }

  /** Remove a single key */
  delete(key: string): void {
    this.store.delete(key);
  }

  /** Remove all keys starting with a prefix (e.g. 'services:') */
  deleteByPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /** Flush all cache entries */
  flush(): void {
    this.store.clear();
    this.logger.log('Cache flushed');
  }

  /** Returns cache statistics */
  stats(): { entries: number; keys: string[] } {
    const now = Date.now();
    const validKeys: string[] = [];
    for (const [key, entry] of this.store.entries()) {
      if (now <= entry.expiresAt) validKeys.push(key);
    }
    return { entries: validKeys.length, keys: validKeys };
  }
}
