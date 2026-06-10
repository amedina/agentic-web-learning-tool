/**
 * External dependencies.
 */
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
import type { LicenseFetcher, VulnerabilityFetcher } from "./findingSources";
import {
  computeTotals,
  createInitialReport,
  emptyVulnerabilityTotals,
  replacementsFromAnalysis,
  summarizeProjectAnalysis,
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
  type ReplaceableSuggestion,
  type VulnerabilityFinding,
} from "./types";

/** Default number of dependencies / manifests processed concurrently. */
const DEFAULT_CONCURRENCY = 6;

/** Default minimum gap between throttled progress emissions. */
const DEFAULT_EMIT_INTERVAL_MS = 300;

/**
 * The injectable collaborators the orchestrator needs. Keeping these as
 * plain functions (rather than concrete vscode-coupled classes) lets the
 * runner be unit-tested with fakes and keeps this module free of any
 * `vscode` import. The fast pass uses `fetchVulnerabilities` (one OSV
 * batch) plus `fetchLicenseIssue` (light registry reads); the backfill
 * uses `analyzeManifest` (publint + circular dependencies).
 */
export interface ProjectHealthRunnerDeps {
  /** Discovers and parses every package.json in the workspace. */
  listManifests: () => Promise<ParsedManifest[]>;
  /** Resolves the cache/version key for one manifest dependency. */
  resolveVersionKey: VersionKeyResolver;
  /** Batched vulnerability lookup across the whole dependency closure. */
  fetchVulnerabilities: VulnerabilityFetcher;
  /** Per-dependency license-issue lookup. */
  fetchLicenseIssue: LicenseFetcher;
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
  /** When false, skips the OSV + license fast pass. Default true. */
  includeDependencies?: boolean;
  /** When false, skips the publint/circular pass (vuln + license only). */
  includeProjectAnalysis?: boolean;
  emitIntervalMs?: number;
  /** Suppression predicates applied to the totals (Phase 4 wires these). */
  suppression?: SuppressionPredicates;
  /**
   * Previous report whose findings seed the scopes this run skips, so a
   * dependencies-only or project-only run preserves the other scope's
   * data instead of blanking it.
   */
  baseReport?: ProjectHealthReport;
}

/** The vuln + license findings computed once for a unique closure entry. */
interface EntryResult {
  vulnerabilities: VulnerabilityFinding[];
  licenseIssue: LicenseFinding | null;
}

/**
 * Runs a full Project Health analysis: discover every package.json,
 * dedup the dependency closure, run a fast pass (batched OSV
 * vulnerabilities + light license checks) over each unique (name,
 * version) once, then a backfill pass of project-level analysis per
 * manifest, fanning results back onto each package. Emits throttled
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
  const includeDependencies = options.includeDependencies ?? true;
  const includeProjectAnalysis = options.includeProjectAnalysis ?? true;
  const startedAt = clock();
  // Seed the scopes this run skips from the previous report, keyed by uri.
  const baseByUri = new Map<string, PackageHealthEntry>();
  for (const entry of options.baseReport?.packages ?? []) {
    baseByUri.set(entry.uri, entry);
  }

  let lastEmitAt = 0;
  // Skipped scopes keep the previous run's completion timestamp.
  let fastPassCompletedAt: number | null = includeDependencies
    ? null
    : (options.baseReport?.fastPassCompletedAt ?? null);
  let backfillCompletedAt: number | null = includeProjectAnalysis
    ? null
    : (options.baseReport?.backfillCompletedAt ?? null);
  const entryResults = new Map<string, EntryResult>();
  const analysisByUri = new Map<
    string,
    PackageHealthEntry["projectAnalysis"]
  >();
  const replaceableByUri = new Map<string, ReplaceableSuggestion[]>();
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
      replaceableByUri,
      analyzedManifests,
      includeDependencies,
      includeProjectAnalysis,
      baseByUri,
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
      fastPassCompletedAt,
      backfillCompletedAt,
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
    const report = snapshot(phase, progressFor(phase, total, total, label));
    options.onProgress?.(report);
    return report;
  };

  if (isAborted(options.signal)) {
    return cancelledReport(options, startedAt, clock);
  }

  emit("scanning", progressFor("scanning", 0, 0, "Scanning workspace…"), true);
  manifests = await deps.listManifests();
  closure = await buildDependencyClosure(manifests, deps.resolveVersionKey);

  // Fast pass: one batched OSV vulnerability lookup, then a concurrent
  // sweep of light license checks. Produces the vuln + license findings
  // (the critical daily signal) before the slower project analysis. Run
  // only when this invocation's scope includes dependencies.
  if (includeDependencies) {
    emit(
      "fast-pass",
      progressFor(
        "fast-pass",
        0,
        closure.uniqueCount,
        "Checking dependencies…",
      ),
      true,
    );
    const vulnerabilitiesByEntry = await deps.fetchVulnerabilities(
      closure.entries.map((entry) => ({
        name: entry.name,
        versionKey: entry.versionKey,
      })),
      options.signal,
    );

    if (isAborted(options.signal)) {
      return terminal("cancelled", closure.uniqueCount);
    }

    let completedEntries = 0;
    await mapWithConcurrency(
      closure.entries,
      concurrency,
      async (entry) => {
        const key = `${entry.name}@${entry.versionKey}`;
        const licenseIssue = await deps.fetchLicenseIssue(
          entry.name,
          entry.versionKey,
          options.signal,
        );
        entryResults.set(key, {
          vulnerabilities: vulnerabilitiesByEntry.get(key) ?? [],
          licenseIssue,
        });
      },
      options.signal,
      () => {
        completedEntries += 1;
        emit(
          "fast-pass",
          progressFor(
            "fast-pass",
            completedEntries,
            closure.uniqueCount,
            `Checking dependencies (${completedEntries}/${closure.uniqueCount})`,
          ),
          false,
        );
      },
    );
    fastPassCompletedAt = clock();
  }

  if (isAborted(options.signal)) {
    return terminal("cancelled", closure.uniqueCount);
  }

  if (includeProjectAnalysis) {
    emit(
      "backfill",
      progressFor("backfill", 0, manifests.length, "Analyzing projects…"),
      true,
    );
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
          replaceableByUri.set(
            manifest.uri,
            analysis ? replacementsFromAnalysis(analysis) : [],
          );
        } catch {
          analysisByUri.set(manifest.uri, null);
          replaceableByUri.set(manifest.uri, []);
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
    if (!isAborted(options.signal)) {
      backfillCompletedAt = clock();
    }
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
  replaceableByUri: Map<string, ReplaceableSuggestion[]>,
  analyzedManifests: Set<string>,
  includeDependencies: boolean,
  includeProjectAnalysis: boolean,
  baseByUri: Map<string, PackageHealthEntry>,
): PackageHealthEntry[] {
  const byUri = new Map<string, PackageHealthEntry>();
  for (const manifest of closure.manifests) {
    const base = baseByUri.get(manifest.uri);
    byUri.set(manifest.uri, {
      uri: manifest.uri,
      relativePath: manifest.relativePath,
      name: manifest.name,
      dependencyCount: manifest.dependencies.length,
      // Dependency findings are filled below when this run includes the
      // fast pass; otherwise they are preserved from the previous report.
      vulnerabilities: includeDependencies
        ? []
        : [...(base?.vulnerabilities ?? [])],
      licenseIssues: includeDependencies
        ? []
        : [...(base?.licenseIssues ?? [])],
      projectAnalysis: includeProjectAnalysis
        ? (analysisByUri.get(manifest.uri) ?? null)
        : (base?.projectAnalysis ?? null),
      replaceable: includeProjectAnalysis
        ? (replaceableByUri.get(manifest.uri) ?? [])
        : [...(base?.replaceable ?? [])],
      status: "pending",
      warnings: [],
    });
  }

  if (includeDependencies) {
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
  }

  for (const entry of byUri.values()) {
    entry.status = statusFor(
      entry,
      closure,
      entryResults,
      analyzedManifests,
      includeDependencies,
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
 * pending; "pending" otherwise. Scopes skipped by this run are treated
 * as already done (their data is seeded from the previous report).
 */
function statusFor(
  entry: PackageHealthEntry,
  closure: DependencyClosure,
  entryResults: Map<string, EntryResult>,
  analyzedManifests: Set<string>,
  includeDependencies: boolean,
  includeProjectAnalysis: boolean,
): PackageEnrichmentStatus {
  const refsDone =
    !includeDependencies ||
    closure.entries
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
