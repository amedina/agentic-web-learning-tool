/**
 * Internal dependencies.
 */
import { LruTtlCache } from "./lruCache";

/**
 * Marker prefix included in error messages so a host that only receives the
 * serialised error string (e.g. the Chrome extension across the service-worker
 * message boundary) can still detect an upstream rate-limit failure.
 */
export const UPSTREAM_RATE_LIMIT_ERROR_MARKER = "UPSTREAM_RATE_LIMIT";

/**
 * Thrown by {@link fetchWithCache} for any non-OK response other than 404.
 * Carries the HTTP status so callers can tell a rate-limit (429) apart from a
 * generic server error and surface the right message to the user.
 */
export class UpstreamFetchError extends Error {
  readonly url: string;
  readonly status: number;

  /**
   * @param url - The URL that failed.
   * @param status - The HTTP status code of the failing response.
   * @param statusText - The HTTP status text, included in the message.
   */
  constructor(url: string, status: number, statusText: string) {
    const ratePrefix =
      status === 429 ? `${UPSTREAM_RATE_LIMIT_ERROR_MARKER}: ` : "";
    super(`${ratePrefix}Failed to fetch ${url}: ${status} ${statusText}`);
    this.name = "UpstreamFetchError";
    this.url = url;
    this.status = status;
  }

  /** True when the upstream responded with HTTP 429 (Too Many Requests). */
  get isRateLimited(): boolean {
    return this.status === 429;
  }
}

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
 * @throws {UpstreamFetchError} On any other non-OK response.
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
        throw new UpstreamFetchError(url, response.status, response.statusText);
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
