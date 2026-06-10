/**
 * External dependencies.
 */
import type { PackageStats } from "@agentic-web-labs/package-analyzer-core";
import type { ProjectAnalysis } from "@agentic-web-labs/project-analyzer-core";

/**
 * Internal dependencies.
 */
import {
  buildDependencyClosure,
  type DependencyClosure,
  type ParsedManifest,
  type VersionKeyResolver,
} from "./dependencyClosure";
import {
  computeTotals,
  createInitialReport,
  emptyVulnerabilityTotals,
  licenseFindingFromStats,
  summarizeProjectAnalysis,
  vulnerabilitiesFromStats,
  type SuppressionPredicates,
} from "./projectHealthReport";
import {
  PROJECT_HEALTH_SCHEMA_VERSION,
  type HealthRunPhase,
  type LicenseFinding,
  type PackageEnrichmentStatus,
  type PackageHealthEntry,
  type ProjectHealthProgress,
  type ProjectHealthReport,
  type VulnerabilityFinding,
} from "./types";

/** Default number of dependencies analyzed concurrently in the backfill pass. */
const DEFAULT_CONCURRENCY = 5;

/** Default minimum gap between throttled progress emissions. */
const DEFAULT_EMIT_INTERVAL_MS = 300;

/**
 * The injectable collaborators the orchestrator needs. Keeping these as
 * plain functions (rather than concrete vscode-coupled classes) lets the
 * runner be unit-tested with fakes and keeps this module free of any
 * `vscode` import so it can also be reasoned about in isolation.
 */
export interface ProjectHealthRunnerDeps {
  /** Discovers and parses every package.json in the workspace. */
  listManifests: () => Promise<ParsedManifest[]>;
  /** Resolves the cache/version key for one manifest dependency. */
  resolveVersionKey: VersionKeyResolver;
  /** Fetches (or cache-reads) PackageStats for one (name, versionKey). */
  getStats: (name: string, versionKey: string) => Promise<PackageStats | null>;
  /** Runs project-level analysis (publint + circular) for one manifest. */
  analyzeManifest: (
    manifest: ParsedManifest,
  ) => Promise<ProjectAnalysis | null>;
  /** Injectable clock for deterministic tests. */
  clock?: () => number;
}

/** Per-run options that vary by invocation. */
export interface RunProjectHealthOptions {
  workspaceKey: string;
  workspaceName: string | null;
  signal?: AbortSignal;
  onProgress?: (report: ProjectHealthReport) => void;
  concurrency?: number;
  /** When false, skips the publint/circular pass (vuln + license only). */
  includeProjectAnalysis?: boolean;
  emitIntervalMs?: number;
  /** Suppression predicates applied to the totals (Phase 4 wires these). */
  suppression?: SuppressionPredicates;
}

/** The vuln + license findings computed once for a unique closure entry. */
interface EntryResult {
  vulnerabilities: VulnerabilityFinding[];
  licenseIssue: LicenseFinding | null;
}

/**
 * Runs a full Project Health analysis: discover every package.json,
 * dedup the dependency closure, analyze each unique (name, version) once
 * for vulnerabilities + license issues, run project-level analysis per
 * manifest, then fan results back onto each package. Emits throttled
 * progress snapshots via `onProgress` and supports cancellation through
 * `signal`. Returns the final report (phase "complete" or "cancelled").
 */
export async function runProjectHealth(
  deps: ProjectHealthRunnerDeps,
  options: RunProjectHealthOptions,
): Promise<ProjectHealthReport> {
  const clock = deps.clock ?? Date.now;
  const concurrency = Math.max(1, options.concurrency ?? DEFAULT_CONCURRENCY);
  const emitIntervalMs = options.emitIntervalMs ?? DEFAULT_EMIT_INTERVAL_MS;
  const includeProjectAnalysis = options.includeProjectAnalysis ?? true;
  const startedAt = clock();

  let lastEmitAt = 0;
  const entryResults = new Map<string, EntryResult>();
  const analysisByUri = new Map<
    string,
    PackageHealthEntry["projectAnalysis"]
  >();
  const analyzedManifests = new Set<string>();

  let manifests: ParsedManifest[] = [];
  let closure: DependencyClosure = {
    entries: [],
    manifests: [],
    uniqueCount: 0,
  };

  /**
   * Assembles the current report from whatever has been computed so far.
   * Called for every progress emission and for the final result.
   */
  const snapshot = (
    phase: HealthRunPhase,
    progress: ProjectHealthProgress,
  ): ProjectHealthReport => {
    const packages = assemblePackages(
      closure,
      entryResults,
      analysisByUri,
      analyzedManifests,
      includeProjectAnalysis,
    );
    return {
      schemaVersion: PROJECT_HEALTH_SCHEMA_VERSION,
      workspaceKey: options.workspaceKey,
      workspaceName: options.workspaceName,
      generatedAt: clock(),
      startedAt,
      phase,
      packages,
      totals: computeTotals(
        packages,
        closure.uniqueCount,
        options.suppression ?? {},
      ),
      progress,
      warnings: [],
      fastPassCompletedAt: null,
      backfillCompletedAt: phase === "complete" ? clock() : null,
    };
  };

  /** Emits a throttled progress snapshot, forcing through at boundaries. */
  const emit = (
    phase: HealthRunPhase,
    progress: ProjectHealthProgress,
    force: boolean,
  ): void => {
    if (!options.onProgress) {
      return;
    }
    const now = clock();
    if (!force && now - lastEmitAt < emitIntervalMs) {
      return;
    }
    lastEmitAt = now;
    options.onProgress(snapshot(phase, progress));
  };

  /**
   * Builds, emits, and returns the terminal report (phase "complete" or
   * "cancelled") with a finished progress bar. Emitting it ensures the
   * `onProgress` consumer sees the final state, not just the return value.
   */
  const terminal = (
    phase: HealthRunPhase,
    total: number,
  ): ProjectHealthReport => {
    const label =
      phase === "cancelled" ? "Analysis cancelled" : "Analysis complete";
    const progress = progressFor(phase, total, total, label);
    const report = snapshot(phase, progress);
    options.onProgress?.(report);
    return report;
  };

  if (isAborted(options.signal)) {
    return cancelledReport(options, startedAt, clock);
  }

  emit("scanning", progressFor("scanning", 0, 0, "Scanning workspace…"), true);
  manifests = await deps.listManifests();
  closure = await buildDependencyClosure(manifests, deps.resolveVersionKey);

  emit(
    "backfill",
    progressFor("backfill", 0, closure.uniqueCount, "Analyzing dependencies…"),
    true,
  );

  let completedEntries = 0;
  await mapWithConcurrency(
    closure.entries,
    concurrency,
    async (entry) => {
      const stats = await deps.getStats(entry.name, entry.versionKey);
      entryResults.set(`${entry.name}@${entry.versionKey}`, {
        vulnerabilities: vulnerabilitiesFromStats(
          entry.name,
          entry.versionKey,
          stats,
        ),
        licenseIssue: licenseFindingFromStats(
          entry.name,
          entry.versionKey,
          stats,
        ),
      });
    },
    options.signal,
    () => {
      completedEntries += 1;
      emit(
        "backfill",
        progressFor(
          "backfill",
          completedEntries,
          closure.uniqueCount,
          `Analyzing dependencies (${completedEntries}/${closure.uniqueCount})`,
        ),
        false,
      );
    },
  );

  if (isAborted(options.signal)) {
    return terminal("cancelled", closure.uniqueCount);
  }

  if (includeProjectAnalysis) {
    let completedManifests = 0;
    await mapWithConcurrency(
      manifests,
      concurrency,
      async (manifest) => {
        try {
          const analysis = await deps.analyzeManifest(manifest);
          analysisByUri.set(
            manifest.uri,
            analysis ? summarizeProjectAnalysis(analysis) : null,
          );
        } catch {
          analysisByUri.set(manifest.uri, null);
        }
        analyzedManifests.add(manifest.uri);
      },
      options.signal,
      () => {
        completedManifests += 1;
        emit(
          "backfill",
          progressFor(
            "backfill",
            completedManifests,
            manifests.length,
            `Analyzing projects (${completedManifests}/${manifests.length})`,
          ),
          false,
        );
      },
    );
  } else {
    for (const manifest of manifests) {
      analyzedManifests.add(manifest.uri);
    }
  }

  const finalPhase: HealthRunPhase = isAborted(options.signal)
    ? "cancelled"
    : "complete";
  return terminal(finalPhase, closure.uniqueCount);
}

/**
 * Builds the per-package roll-up from the deduped closure plus the
 * once-computed entry results and per-manifest analysis summaries.
 */
function assemblePackages(
  closure: DependencyClosure,
  entryResults: Map<string, EntryResult>,
  analysisByUri: Map<string, PackageHealthEntry["projectAnalysis"]>,
  analyzedManifests: Set<string>,
  includeProjectAnalysis: boolean,
): PackageHealthEntry[] {
  const byUri = new Map<string, PackageHealthEntry>();
  for (const manifest of closure.manifests) {
    byUri.set(manifest.uri, {
      uri: manifest.uri,
      relativePath: manifest.relativePath,
      name: manifest.name,
      dependencyCount: manifest.dependencies.length,
      vulnerabilities: [],
      licenseIssues: [],
      projectAnalysis: analysisByUri.get(manifest.uri) ?? null,
      status: "pending",
      warnings: [],
    });
  }

  for (const entry of closure.entries) {
    const result = entryResults.get(`${entry.name}@${entry.versionKey}`);
    if (!result) {
      continue;
    }
    for (const ref of entry.refs) {
      const target = byUri.get(ref.uri);
      if (!target) {
        continue;
      }
      target.vulnerabilities.push(...result.vulnerabilities);
      if (result.licenseIssue) {
        target.licenseIssues.push(result.licenseIssue);
      }
    }
  }

  for (const entry of byUri.values()) {
    entry.status = statusFor(
      entry,
      closure,
      entryResults,
      analyzedManifests,
      includeProjectAnalysis,
    );
  }

  return Array.from(byUri.values()).sort((a, b) =>
    a.relativePath.localeCompare(b.relativePath),
  );
}

/**
 * Decides how far analysis has progressed for one package: "enriched"
 * once every referenced dependency is analyzed and (when requested) its
 * project analysis has run; "fast" when deps are done but analysis is
 * pending; "pending" otherwise.
 */
function statusFor(
  entry: PackageHealthEntry,
  closure: DependencyClosure,
  entryResults: Map<string, EntryResult>,
  analyzedManifests: Set<string>,
  includeProjectAnalysis: boolean,
): PackageEnrichmentStatus {
  const refsDone = closure.entries
    .filter((closureEntry) =>
      closureEntry.refs.some((ref) => ref.uri === entry.uri),
    )
    .every((closureEntry) =>
      entryResults.has(`${closureEntry.name}@${closureEntry.versionKey}`),
    );
  if (!refsDone) {
    return "pending";
  }
  if (includeProjectAnalysis && !analyzedManifests.has(entry.uri)) {
    return "fast";
  }
  return "enriched";
}

/** Builds a progress descriptor. */
function progressFor(
  phase: HealthRunPhase,
  completed: number,
  total: number,
  label: string,
): ProjectHealthProgress {
  return { phase, completed, total, label };
}

/** Builds an immediately-cancelled report (no work performed). */
function cancelledReport(
  options: RunProjectHealthOptions,
  startedAt: number,
  clock: () => number,
): ProjectHealthReport {
  const base = createInitialReport(
    options.workspaceKey,
    options.workspaceName,
    startedAt,
  );
  return {
    ...base,
    phase: "cancelled",
    generatedAt: clock(),
    totals: {
      ...base.totals,
      vulnerabilities: emptyVulnerabilityTotals(),
    },
    progress: progressFor("cancelled", 0, 0, "Analysis cancelled"),
  };
}

/** True when the abort signal has fired. */
function isAborted(signal: AbortSignal | undefined): boolean {
  return signal?.aborted === true;
}

/**
 * Runs `worker` over `items` with at most `limit` in flight at once,
 * invoking `onSettled` after each item completes (for progress). Bails
 * out early when `signal` aborts. Order of execution is not guaranteed,
 * but every item is processed unless aborted.
 */
async function mapWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
  signal: AbortSignal | undefined,
  onSettled?: () => void,
): Promise<void> {
  let cursor = 0;
  const runNext = async (): Promise<void> => {
    while (cursor < items.length) {
      if (isAborted(signal)) {
        return;
      }
      const index = cursor;
      cursor += 1;
      try {
        await worker(items[index]);
      } catch {
        // Per-item failures are tolerated; the entry simply carries no
        // findings. Surfacing a hard error here would abort the whole run.
      }
      onSettled?.();
    }
  };
  const lanes = Array.from({ length: Math.min(limit, items.length) }, () =>
    runNext(),
  );
  await Promise.all(lanes);
}
