/**
 * Internal dependencies.
 */
import { LruTtlCache } from "./lruCache";

/**
 * Process-wide cache backing every analyzer-core fetch. Bounded so a
 * long-lived host (Chrome service worker, MCP HTTP server) can't grow
 * the cache unbounded, expired entries are re-fetched on next read,
 * and concurrent identical requests share one network round-trip
 * (single-flight).
 */
const cache = new LruTtlCache<unknown>();

/**
 * Fetch a URL and cache the result. Subsequent reads of the same URL
 * within the cache's TTL return the cached value without a network
 * round-trip. Concurrent reads of the same URL share one in-flight
 * promise.
 *
 * @param url - Absolute URL to fetch.
 * @param options - Optional fetch init; forwarded as-is.
 * @returns The parsed JSON body, or `null` for a 404 response.
 * @throws On any other non-OK response.
 */
export async function fetchWithCache(
  url: string,
  options?: RequestInit,
): Promise<unknown> {
  return cache.getOrFetch(url, async () => {
    const response = await fetch(url, options);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    return await response.json();
  });
}

/**
 * Drop every cached response. Used by the manual refresh path so the
 * next read forces a fresh network fetch.
 */
export function clearCache(): void {
  cache.clear();
}
