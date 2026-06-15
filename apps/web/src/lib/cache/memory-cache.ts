/**
 * Generic in-memory cache with TTL.
 * Uses a singleton Map per cache instance — safe for server-side singletons
 * because Next.js Route Handlers share the same Node.js process between requests.
 *
 * Usage:
 *   const cache = createMemoryCache<MyType>(15 * 60 * 1000); // 15 min TTL
 *   cache.set('key', value);
 *   const entry = cache.get('key'); // null if missing or expired
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export interface MemoryCache<T> {
  get(key: string): T | null;
  set(key: string, value: T): void;
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;
}

export function createMemoryCache<T>(ttlMs: number): MemoryCache<T> {
  const store = new Map<string, CacheEntry<T>>();

  return {
    get(key: string): T | null {
      const entry = store.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
      }
      return entry.data;
    },

    set(key: string, value: T): void {
      store.set(key, { data: value, expiresAt: Date.now() + ttlMs });
    },

    has(key: string): boolean {
      const entry = store.get(key);
      if (!entry) return false;
      if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return false;
      }
      return true;
    },

    delete(key: string): void {
      store.delete(key);
    },

    clear(): void {
      store.clear();
    },
  };
}
