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
 * Hard ceiling on a single network round-trip. Without it a stalled
 * connection (DNS black-hole, half-open socket) leaves the underlying
 * `fetch` pending forever — and because the result is single-flighted,
 * every caller awaiting that key hangs too. Callers wrap their own
 * `try/catch`, but a never-settling promise never reaches it; the
 * timeout converts that into a rejection they can actually handle.
 */
const DEFAULT_FETCH_TIMEOUT_MS = 15_000;

/**
 * Builds the AbortSignal applied to the underlying `fetch`: always a
 * timeout, combined with any `RequestInit.signal` the caller passed
 * (when the runtime exposes `AbortSignal.any`). The timeout aborts the
 * shared fetch, which is correct — a stalled request is stalled for
 * every caller, not just one. The per-caller abort handled by
 * `getOrFetch` is deliberately kept separate so one caller navigating
 * away never tears down the shared fetch other callers depend on.
 */
function buildFetchSignal(requestSignal?: AbortSignal | null): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(DEFAULT_FETCH_TIMEOUT_MS);
  if (requestSignal && typeof AbortSignal.any === "function") {
    return AbortSignal.any([requestSignal, timeoutSignal]);
  }
  return timeoutSignal;
}

/**
 * Fetch a URL and cache the result. Subsequent reads of the same URL
 * within the cache's TTL return the cached value without a network
 * round-trip. Concurrent reads of the same URL share one in-flight
 * promise.
 *
 * @param url - Absolute URL to fetch.
 * @param options - Optional fetch init; forwarded as-is.
 * @param signal - Optional {@link AbortSignal}. When the signal aborts,
 *   *this caller's* await rejects with the signal's reason; the shared
 *   underlying fetch keeps running so concurrent callers waiting on
 *   the same key still receive the value.
 * @returns The parsed JSON body, or `null` for a 404 response.
 * @throws On any other non-OK response.
 */
export async function fetchWithCache(
  url: string,
  options?: RequestInit,
  signal?: AbortSignal,
): Promise<unknown> {
  return cache.getOrFetch(
    url,
    async () => {
      const response = await fetch(url, {
        ...options,
        signal: buildFetchSignal(options?.signal),
      });
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }
      return await response.json();
    },
    signal,
  );
}

/**
 * Drop every cached response. Used by the manual refresh path so the
 * next read forces a fresh network fetch.
 */
export function clearCache(): void {
  cache.clear();
}
