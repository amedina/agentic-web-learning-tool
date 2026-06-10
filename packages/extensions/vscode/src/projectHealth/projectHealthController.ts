/**
 * External dependencies.
 */
import * as path from "node:path";
import * as vscode from "vscode";
import { analyzeProject } from "@agentic-web-labs/project-analyzer-core";

/**
 * Internal dependencies.
 */
import type { NpmAdvisorSettings } from "../diagnostics/settings";
import type { LockfileResolver } from "../workspace/lockfileResolver";
import type { PackageJsonScanner } from "../workspace/packageJsonScanner";
import type { ParsedManifest } from "./dependencyClosure";
import {
  createLicenseFetcher,
  createVulnerabilityFetcher,
} from "./findingSources";
import { readManifest } from "./manifestReader";
import type { ProjectHealthCache } from "./projectHealthCache";
import { notifyReportSummary } from "./projectHealthNotifications";
import {
  runProjectHealth,
  type ProjectHealthRunnerDeps,
} from "./projectHealthRunner";
import type { ProjectHealthReport } from "./types";

/** Upper bound on a single manifest's project-level analysis. */
const ANALYSIS_TIMEOUT_MS = 60_000;

export interface ProjectHealthControllerDeps {
  scanner: PackageJsonScanner;
  lockfileResolver: LockfileResolver;
  settingsProvider: () => NpmAdvisorSettings;
  reportCache: ProjectHealthCache;
}

/** Options that vary per `run` invocation. */
export interface RunOptions {
  /** When false, skips the publint/circular pass (vuln + license only). */
  includeProjectAnalysis?: boolean;
  /**
   * When true, shows a VSCode notification summarizing the completed
   * report. Set by the scheduler for daily runs; left false for manual
   * runs (which already show their results in the open panel).
   */
  notify?: boolean;
}

/**
 * Owns a single workspace-wide Project Health run at a time. Builds the
 * runner's injectable collaborators from quota-safe sources (OSV batch
 * for vulnerabilities, npm registry for licenses, the project analyzer
 * for publint + circular dependencies), enforces single-flight +
 * cancellation, persists each completed report to the durable cache, and
 * re-broadcasts every progress snapshot via `onDidUpdate`.
 */
export class ProjectHealthController implements vscode.Disposable {
  private readonly scanner: PackageJsonScanner;
  private readonly lockfileResolver: LockfileResolver;
  private readonly settingsProvider: () => NpmAdvisorSettings;
  private readonly reportCache: ProjectHealthCache;
  private readonly emitter = new vscode.EventEmitter<ProjectHealthReport>();
  private active: {
    abort: AbortController;
    promise: Promise<ProjectHealthReport>;
  } | null = null;

  /** Fires for every progress snapshot and for the terminal report. */
  readonly onDidUpdate = this.emitter.event;

  /** Stores the collaborators used to build runner deps per invocation. */
  constructor(deps: ProjectHealthControllerDeps) {
    this.scanner = deps.scanner;
    this.lockfileResolver = deps.lockfileResolver;
    this.settingsProvider = deps.settingsProvider;
    this.reportCache = deps.reportCache;
  }

  /** True while a run is in flight. */
  get isRunning(): boolean {
    return this.active !== null;
  }

  /**
   * A stable key identifying the current workspace, built from the sorted
   * set of open folder URIs. Used to scope the durable report cache.
   */
  workspaceKey(): string {
    const folders = vscode.workspace.workspaceFolders ?? [];
    if (folders.length === 0) {
      return "no-workspace";
    }
    return folders
      .map((folder) => folder.uri.toString())
      .sort()
      .join("|");
  }

  /** Human-readable workspace name for the report header. */
  workspaceName(): string | null {
    return vscode.workspace.name ?? null;
  }

  /** Returns the most recently persisted report, or null when none exists. */
  getCached(): ProjectHealthReport | null {
    return this.reportCache.get(this.workspaceKey()) ?? null;
  }

  /** True when a fresh run is due per the durable cache's freshness window. */
  isRunDue(dueAfterMs?: number): boolean {
    return this.reportCache.isRunDue(this.workspaceKey(), dueAfterMs);
  }

  /**
   * Starts a run, or returns the in-flight run's promise when one is
   * already active (single-flight). Progress streams via `onDidUpdate`;
   * the resolved value is the terminal report, also persisted to cache.
   */
  async run(options: RunOptions = {}): Promise<ProjectHealthReport> {
    if (this.active) {
      return this.active.promise;
    }
    const abort = new AbortController();
    const promise = this.execute(abort.signal, options).finally(() => {
      this.active = null;
    });
    this.active = { abort, promise };
    return promise;
  }

  /** Aborts the in-flight run, if any. */
  cancel(): void {
    this.active?.abort.abort();
  }

  /** Releases the update emitter and cancels any in-flight run. */
  dispose(): void {
    this.cancel();
    this.emitter.dispose();
  }

  /**
   * Runs the orchestrator with host-built collaborators, persisting the
   * terminal report and optionally notifying. Progress snapshots are
   * re-broadcast as they arrive.
   */
  private async execute(
    signal: AbortSignal,
    options: RunOptions,
  ): Promise<ProjectHealthReport> {
    const report = await runProjectHealth(this.buildRunnerDeps(), {
      workspaceKey: this.workspaceKey(),
      workspaceName: this.workspaceName(),
      signal,
      includeProjectAnalysis: options.includeProjectAnalysis ?? true,
      onProgress: (snapshot) => this.emitter.fire(snapshot),
    });
    await this.reportCache.set(report);
    if (options.notify && report.phase === "complete") {
      void notifyReportSummary(report);
    }
    return report;
  }

  /** Builds the runner's injectable deps from quota-safe sources. */
  private buildRunnerDeps(): ProjectHealthRunnerDeps {
    const targetLicense = this.settingsProvider().targetLicense;
    return {
      listManifests: async () => {
        const files = await this.scanner.list();
        return Promise.all(files.map((file) => readManifest(file)));
      },
      resolveVersionKey: async (manifestUri, dependency) => {
        let resolved: string | undefined;
        try {
          resolved = await this.lockfileResolver.resolveVersion(
            vscode.Uri.parse(manifestUri),
            dependency.name,
          );
        } catch {
          resolved = undefined;
        }
        return resolved && isCleanSemver(resolved) ? resolved : "latest";
      },
      fetchVulnerabilities: createVulnerabilityFetcher(),
      fetchLicenseIssue: createLicenseFetcher(targetLicense),
      analyzeManifest: (manifest) => this.analyzeManifest(manifest),
    };
  }

  /**
   * Runs project-level analysis for one manifest with a per-call timeout
   * so one pathological project can't stall the whole workspace run.
   * Returns null on timeout or failure; the package then carries no
   * project-analysis summary rather than aborting the run.
   */
  private async analyzeManifest(manifest: ParsedManifest) {
    const rootPath = path.dirname(vscode.Uri.parse(manifest.uri).fsPath);
    try {
      return await withTimeout(
        analyzeProject({ rootPath, publintMode: "source" }),
        ANALYSIS_TIMEOUT_MS,
      );
    } catch {
      return null;
    }
  }
}

/**
 * Test whether a string is a clean semver version (e.g. `4.17.20`),
 * not a range like `^4.17.0`, a wildcard, or a tag. Mirrors the helper
 * in extension.ts so only clean semver becomes a resolved version key.
 */
function isCleanSemver(version: string): boolean {
  return /^\d+\.\d+\.\d+(?:[-+][\w.+-]+)?$/.test(version);
}

/**
 * Rejects with a timeout error if `promise` hasn't settled within
 * `timeoutMs`. The underlying analysis can't be cancelled, but the
 * caller unblocks instead of waiting indefinitely. The timer is cleared
 * on settle so a resolved run doesn't leak a pending handle.
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(
      () =>
        reject(new Error(`Project analysis timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
