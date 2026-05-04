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

export class StatsCache {
  private readonly storage: vscode.Memento;
  private readonly fetcher: (name: string) => Promise<PackageStats | null>;
  private readonly ttlMs: number;
  private readonly failureTtlMs: number;
  private readonly clock: () => number;
  private readonly inFlight = new Map<string, Promise<PackageStats | null>>();
  private readonly emitter = new vscode.EventEmitter<StatsCacheChange>();

  readonly onDidChange = this.emitter.event;

  constructor(deps: StatsCacheDeps) {
    this.storage = deps.storage;
    this.fetcher = deps.fetcher;
    this.ttlMs = deps.options?.ttlMs ?? DEFAULT_TTL_MS;
    this.failureTtlMs = deps.options?.failureTtlMs ?? DEFAULT_FAILURE_TTL_MS;
    this.clock = deps.options?.clock ?? Date.now;
  }

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

  dispose(): void {
    this.emitter.dispose();
  }

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

function makeKey(name: string, version: string): string {
  return `${STORAGE_KEY_PREFIX}${name}::${version}`;
}
