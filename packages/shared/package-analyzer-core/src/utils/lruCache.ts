export interface LruTtlCacheOptions {
  /** Maximum number of entries before the least-recently-used is evicted. */
  maxSize?: number;
  /** Per-entry lifetime in milliseconds. */
  ttlMs?: number;
  /** Override for the wall clock; tests pin this so they don't sleep. */
  clock?: () => number;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const DEFAULT_MAX_SIZE = 500;
const DEFAULT_TTL_MS = 10 * 60 * 1000;

/**
 * Bounded LRU + TTL cache with built-in single-flight semantics. Backs
 * the in-memory caches in `fetchWithCache` and `githubFetch`. Three
 * properties that the previous bare-`Map` caches lacked:
 *
 *  - **Bounded**: never grows past `maxSize`; oldest entry is evicted
 *    when the cap is hit. Important inside long-lived hosts (the Chrome
 *    service worker, the MCP HTTP server) where a session can fetch
 *    thousands of distinct package names over its lifetime.
 *  - **TTL**: entries expire after `ttlMs` so a long-running process
 *    doesn't serve day-old data forever. Expiry is checked lazily on
 *    each read.
 *  - **Single-flight**: concurrent reads of the same key share one
 *    in-flight promise. Without it, two views rendering the same
 *    package at the same time both miss the cache and both fire the
 *    network request. With it, the second caller awaits the first.
 *
 * The class is generic so it can hold any value, including `null` (a
 * cached "404"). `has()` distinguishes "no entry" from "entry whose
 * value is null".
 */
export class LruTtlCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();
  private readonly inFlight = new Map<string, Promise<T>>();
  private readonly maxSize: number;
  private readonly ttlMs: number;
  private readonly clock: () => number;

  constructor(options: LruTtlCacheOptions = {}) {
    this.maxSize = options.maxSize ?? DEFAULT_MAX_SIZE;
    this.ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
    this.clock = options.clock ?? Date.now;
  }

  /**
   * Return the cached value for `key`, or `undefined` when the key is
   * absent or its entry has expired. Side-effect: a successful read
   * promotes the entry to most-recently-used.
   */
  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) {
      return undefined;
    }
    if (this.clock() > entry.expiresAt) {
      this.entries.delete(key);
      return undefined;
    }
    // Promote to MRU by re-inserting at the tail of the Map.
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }

  /**
   * Check whether `key` is present and unexpired without bumping its
   * recency. Useful for callers that want to detect a cached `null`
   * value as distinct from a missing entry.
   */
  has(key: string): boolean {
    const entry = this.entries.get(key);
    if (!entry) {
      return false;
    }
    if (this.clock() > entry.expiresAt) {
      this.entries.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Insert or update an entry. When the cache is at capacity, the
   * least-recently-used entry is evicted.
   */
  set(key: string, value: T): void {
    // Delete-then-set to ensure the new entry lands at the tail of the
    // Map (MRU). Without the delete, a re-insertion would keep the
    // entry at its original position.
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAt: this.clock() + this.ttlMs });
    while (this.entries.size > this.maxSize) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) {
        break;
      }
      this.entries.delete(oldest);
    }
  }

  /**
   * Remove the entry for `key` if present. Returns `true` when an
   * entry was actually removed.
   */
  delete(key: string): boolean {
    return this.entries.delete(key);
  }

  /**
   * Drop every entry and discard every in-flight promise. The
   * in-flight map is cleared so abandoned promises don't keep
   * resurrecting cleared entries when they resolve later.
   */
  clear(): void {
    this.entries.clear();
    this.inFlight.clear();
  }

  /** Number of stored entries (does not include in-flight promises). */
  get size(): number {
    return this.entries.size;
  }

  /**
   * Single-flight wrapper: returns the cached value when present;
   * otherwise calls `fetcher()` once and caches the result, sharing the
   * same promise with any concurrent caller for the same key. On
   * rejection the in-flight entry is dropped so the next call retries
   * instead of replaying the failure.
   *
   * An optional {@link AbortSignal} controls *this caller's* await
   * only: when the signal aborts, this call's promise rejects with the
   * signal's reason but the underlying fetch keeps running so any
   * other concurrent caller still receives the value (and the cache
   * still gets populated). This isolation matters because two views
   * can want the same package; if one navigates away, the other
   * shouldn't lose its fetch.
   */
  async getOrFetch(
    key: string,
    fetcher: () => Promise<T>,
    signal?: AbortSignal,
  ): Promise<T> {
    throwIfAborted(signal);
    if (this.has(key)) {
      return this.get(key) as T;
    }
    let promise = this.inFlight.get(key);
    if (!promise) {
      promise = (async () => {
        try {
          const value = await fetcher();
          this.set(key, value);
          return value;
        } finally {
          this.inFlight.delete(key);
        }
      })();
      this.inFlight.set(key, promise);
    }
    return raceWithAbort(promise, signal);
  }
}

/**
 * Throw an `AbortError`-shaped error when the supplied signal is
 * already aborted. Mirrors the standard `signal.throwIfAborted` from
 * recent Web APIs but works in older Node runtimes too.
 */
function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw abortReason(signal);
  }
}

/**
 * Race a promise against an abort signal. When the signal aborts, the
 * returned promise rejects with the signal's reason while the original
 * promise keeps running. When the original resolves or rejects first,
 * the abort listener is detached so it can't fire later.
 */
function raceWithAbort<T>(
  promise: Promise<T>,
  signal: AbortSignal | undefined,
): Promise<T> {
  if (!signal) {
    return promise;
  }
  if (signal.aborted) {
    return Promise.reject(abortReason(signal));
  }
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      reject(abortReason(signal));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
}

/**
 * Return the abort reason exposed by recent runtimes, falling back to
 * a synthetic DOMException so older Node versions still get a
 * recognisable AbortError to throw.
 */
function abortReason(signal: AbortSignal): unknown {
  const reason = (signal as { reason?: unknown }).reason;
  if (reason !== undefined) {
    return reason;
  }
  return new DOMException("The operation was aborted.", "AbortError");
}
