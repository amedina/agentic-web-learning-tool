/**
 * External dependencies.
 */
import { describe, expect, it, vi } from "vitest";
import type { PackageStats } from "@agentic-web-labs/package-analyzer-core";
import type { ProjectAnalysis } from "@agentic-web-labs/project-analyzer-core";

/**
 * Internal dependencies.
 */
import type { ParsedManifest } from "../dependencyClosure";
import {
  runProjectHealth,
  type ProjectHealthRunnerDeps,
} from "../projectHealthRunner";

/** Builds a ParsedManifest with the given single-section deps. */
function manifest(uri: string, deps: Array<[string, string]>): ParsedManifest {
  return {
    uri,
    relativePath: `${uri}/package.json`,
    name: uri,
    dependencies: deps.map(([name, range]) => ({
      name,
      category: "dependencies",
      range,
    })),
  };
}

/** A PackageStats stub carrying one critical advisory for `name`. */
function vulnerableStats(name: string): PackageStats {
  return {
    packageName: name,
    securityAdvisories: {
      critical: 1,
      high: 0,
      moderate: 0,
      low: 0,
      issues: [
        {
          summary: "boom",
          severity: "critical",
          url: "https://github.com/advisories/GHSA-aaaa-bbbb-cccc",
        },
      ],
    },
  } as unknown as PackageStats;
}

/** An empty ProjectAnalysis stub. */
function emptyAnalysis(rootPath: string): ProjectAnalysis {
  return {
    rootPath,
    findings: [],
    summary: {
      total: 0,
      bySeverity: { error: 0, warning: 0, info: 0, hint: 0 },
      bySource: { publint: 0, replacements: 0, "circular-deps": 0 },
    },
    warnings: [],
  } as unknown as ProjectAnalysis;
}

/** Builds runner deps with the supplied manifests and a fixed clock. */
function makeDeps(
  manifests: ParsedManifest[],
  getStats: ProjectHealthRunnerDeps["getStats"],
  analyzeManifest?: ProjectHealthRunnerDeps["analyzeManifest"],
): ProjectHealthRunnerDeps {
  return {
    listManifests: vi.fn().mockResolvedValue(manifests),
    resolveVersionKey: vi.fn((_, dep) => Promise.resolve(dep.range)),
    getStats,
    analyzeManifest:
      analyzeManifest ??
      vi.fn((manifestArg) => Promise.resolve(emptyAnalysis(manifestArg.uri))),
    clock: () => 1000,
  };
}

describe("runProjectHealth", () => {
  it("analyzes each unique dependency once and fans findings to every package", async () => {
    const manifests = [
      manifest("a", [["lodash", "4.17.20"]]),
      manifest("b", [["lodash", "4.17.20"]]),
    ];
    const getStats = vi.fn().mockResolvedValue(vulnerableStats("lodash"));
    const deps = makeDeps(manifests, getStats);

    const report = await runProjectHealth(deps, {
      workspaceKey: "ws",
      workspaceName: "ws",
    });

    expect(getStats).toHaveBeenCalledTimes(1);
    expect(report.phase).toBe("complete");
    expect(report.totals.uniqueDependencyCount).toBe(1);
    expect(report.totals.vulnerabilities.total).toBe(1);
    expect(report.totals.vulnerabilities.critical).toBe(1);
    expect(report.totals.packageCount).toBe(2);
    for (const pkg of report.packages) {
      expect(pkg.vulnerabilities).toHaveLength(1);
      expect(pkg.status).toBe("enriched");
    }
  });

  it("skips project analysis when includeProjectAnalysis is false", async () => {
    const manifests = [manifest("a", [["lodash", "4.17.20"]])];
    const analyzeManifest = vi.fn();
    const deps = makeDeps(
      manifests,
      vi.fn().mockResolvedValue(null),
      analyzeManifest,
    );

    const report = await runProjectHealth(deps, {
      workspaceKey: "ws",
      workspaceName: null,
      includeProjectAnalysis: false,
    });

    expect(analyzeManifest).not.toHaveBeenCalled();
    expect(report.phase).toBe("complete");
    expect(report.packages[0].projectAnalysis).toBeNull();
  });

  it("emits progress snapshots during the run", async () => {
    const manifests = [manifest("a", [["lodash", "4.17.20"]])];
    const deps = makeDeps(manifests, vi.fn().mockResolvedValue(null));
    const onProgress = vi.fn();

    await runProjectHealth(deps, {
      workspaceKey: "ws",
      workspaceName: null,
      onProgress,
      emitIntervalMs: 0,
    });

    expect(onProgress).toHaveBeenCalled();
    const phases = onProgress.mock.calls.map((call) => call[0].phase);
    expect(phases).toContain("scanning");
    expect(phases.at(-1)).toBe("complete");
  });

  it("returns a cancelled report when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const manifests = [manifest("a", [["lodash", "4.17.20"]])];
    const getStats = vi.fn();
    const deps = makeDeps(manifests, getStats);

    const report = await runProjectHealth(deps, {
      workspaceKey: "ws",
      workspaceName: null,
      signal: controller.signal,
    });

    expect(report.phase).toBe("cancelled");
    expect(getStats).not.toHaveBeenCalled();
  });
});
