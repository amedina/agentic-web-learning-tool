/**
 * External dependencies.
 */
import * as vscode from "vscode";
import type { PackageStats } from "@agentic-web-labs/package-analyzer-core";

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_FAILURE_TTL_MS = 5 * 60 * 1000;
const STORAGE_KEY_PREFIX = "stats.v1:";

export interface StatsCacheChange {
  name: string;
  version: string;
}

interface CacheEntry {
  stats: PackageStats | null;
  fetchedAt: number;
}

export interface StatsCacheOptions {
  ttlMs?: number;
  failureTtlMs?: number;
  clock?: () => number;
}

export interface StatsCacheDeps {
  storage: vscode.Memento;
  fetcher: (name: string) => Promise<PackageStats | null>;
  options?: StatsCacheOptions;
}

/**
 * Persistent, stale-while-revalidate cache for PackageStats lookups.
 * Backed by a vscode.Memento so entries survive across editor sessions,
 * with in-memory dedup of concurrent fetches and a short negative-cache
 * window for fetch failures.
 */
export class StatsCache {
  private readonly storage: vscode.Memento;
  private readonly fetcher: (name: string) => Promise<PackageStats | null>;
  private readonly ttlMs: number;
  private readonly failureTtlMs: number;
  private readonly clock: () => number;
  private readonly inFlight = new Map<string, Promise<PackageStats | null>>();
  private readonly emitter = new vscode.EventEmitter<StatsCacheChange>();

  readonly onDidChange = this.emitter.event;

  /**
   * Wires the cache to its storage backend, network fetcher, and
   * (optionally) custom TTL / clock for tests.
   */
  constructor(deps: StatsCacheDeps) {
    this.storage = deps.storage;
    this.fetcher = deps.fetcher;
    this.ttlMs = deps.options?.ttlMs ?? DEFAULT_TTL_MS;
    this.failureTtlMs = deps.options?.failureTtlMs ?? DEFAULT_FAILURE_TTL_MS;
    this.clock = deps.options?.clock ?? Date.now;
  }

  /**
   * Returns stats for a (name, version) pair. On a fresh cache hit,
   * returns the cached value synchronously. On a stale hit, returns the
   * stale value immediately and kicks off a background refresh that
   * fires onDidChange when fresh data lands. On a miss, awaits the
   * fetcher.
   */
  async get(name: string, version: string): Promise<PackageStats | null> {
    const key = makeKey(name, version);
    const entry = this.storage.get<CacheEntry>(key);

    if (entry) {
      const ttl = entry.stats === null ? this.failureTtlMs : this.ttlMs;
      const isFresh = this.clock() - entry.fetchedAt < ttl;

      if (isFresh) {
        return entry.stats;
      }

      void this.refresh(name, version, key);
      return entry.stats;
    }

    return this.refresh(name, version, key);
  }

  /**
   * Synchronously returns the cached PackageStats for a (name, version)
   * pair without triggering any fetch or refresh. Returns undefined when
   * nothing is cached. Used by the webview provider to pre-populate the
   * init payload so the React app doesn't have to round-trip back to
   * the host for entries we already have on disk.
   */
  peek(name: string, version: string): PackageStats | null | undefined {
    const entry = this.storage.get<CacheEntry>(makeKey(name, version));
    return entry?.stats;
  }

  /**
   * Drop every entry written by this cache from persistent storage.
   * Returns the number of entries removed. Fires onDidChange with a
   * sentinel ("*", "*") so listeners can refresh affected views.
   */
  async clearAll(): Promise<number> {
    const keys = this.storage
      .keys()
      .filter((key) => key.startsWith(STORAGE_KEY_PREFIX));
    await Promise.all(keys.map((key) => this.storage.update(key, undefined)));
    this.emitter.fire({ name: "*", version: "*" });
    return keys.length;
  }

  /**
   * Releases the onDidChange emitter. Call when the extension
   * deactivates (typically via context.subscriptions).
   */
  dispose(): void {
    this.emitter.dispose();
  }

  /**
   * Triggers a fetch for the given key, deduping against any in-flight
   * call for the same key. Used by both the miss path and the SWR
   * background-refresh path.
   */
  private async refresh(
    name: string,
    version: string,
    key: string,
  ): Promise<PackageStats | null> {
    const existing = this.inFlight.get(key);
    if (existing) {
      return existing;
    }

    const promise = this.fetchAndStore(name, version, key);
    this.inFlight.set(key, promise);
    try {
      return await promise;
    } finally {
      this.inFlight.delete(key);
    }
  }

  /**
   * Calls the configured fetcher, persists the result (treating throws
   * as a null result so failures get negative-cached too), and fires
   * onDidChange so SWR consumers can refresh.
   */
  private async fetchAndStore(
    name: string,
    version: string,
    key: string,
  ): Promise<PackageStats | null> {
    let stats: PackageStats | null = null;
    try {
      stats = await this.fetcher(name);
    } catch {
      stats = null;
    }
    const entry: CacheEntry = { stats, fetchedAt: this.clock() };
    await this.storage.update(key, entry);
    this.emitter.fire({ name, version });
    return stats;
  }
}

/** Builds the storage key for a (name, version) pair. */
function makeKey(name: string, version: string): string {
  return `${STORAGE_KEY_PREFIX}${name}::${version}`;
}
