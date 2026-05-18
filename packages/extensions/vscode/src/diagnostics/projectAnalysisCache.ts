/**
 * External dependencies.
 */
import type { ProjectAnalysis } from "@agentic-web-labs/project-analyzer-core";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export interface CachedProjectAnalysis {
  analysis: ProjectAnalysis;
  /** `Date.now()` at the moment the analysis finished. */
  finishedAt: number;
}

/**
 * In-memory cache for the result of the most recent `analyzeProject`
 * run per project root. Lives on the extension host (not the webview)
 * so the cache survives both webview tab switches and full webview
 * re-mounts (VS Code drops the webview's script context every time
 * its visibility flips). Entries expire after `ttlMs` so users see
 * fresh results the next day even if they never re-run manually.
 *
 * Deliberately not persisted to disk: results reference absolute
 * filesystem paths and snapshot a moment-in-time view of package.json,
 * and the project may have changed substantially between sessions.
 */
export class ProjectAnalysisCache {
  private readonly ttlMs: number;
  private readonly entries = new Map<string, CachedProjectAnalysis>();

  /**
   * Constructs an empty cache with the configured TTL. Defaults to 24
   * hours, which matches the "should be cached for a day" guidance from
   * the design discussion.
   */
  constructor({ ttlMs = TWENTY_FOUR_HOURS_MS }: { ttlMs?: number } = {}) {
    this.ttlMs = ttlMs;
  }

  /**
   * Returns the cached analysis for the given project root if it
   * exists and is still within the TTL window. Stale entries are
   * dropped on read.
   */
  get(rootPath: string): CachedProjectAnalysis | undefined {
    const entry = this.entries.get(rootPath);
    if (!entry) {
      return undefined;
    }
    if (Date.now() - entry.finishedAt > this.ttlMs) {
      this.entries.delete(rootPath);
      return undefined;
    }
    return entry;
  }

  /**
   * Stores the most recent analysis for the given project root. Called
   * by the project-analysis runner immediately after a successful run.
   */
  set(rootPath: string, analysis: ProjectAnalysis): void {
    this.entries.set(rootPath, { analysis, finishedAt: Date.now() });
  }

  /** Removes a single entry — used by Re-run before refetching. */
  invalidate(rootPath: string): void {
    this.entries.delete(rootPath);
  }

  /** Removes every entry. Used by tests; no UI surface today. */
  clear(): void {
    this.entries.clear();
  }
}
