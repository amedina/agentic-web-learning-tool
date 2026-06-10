/**
 * External dependencies.
 */
import { describe, expect, it, vi } from "vitest";
import type { ProjectAnalysis } from "@agentic-web-labs/project-analyzer-core";

/**
 * Internal dependencies.
 */
import type { ParsedManifest } from "../dependencyClosure";
import type { VulnerabilityFetcher } from "../findingSources";
import {
  runProjectHealth,
  type ProjectHealthRunnerDeps,
} from "../projectHealthRunner";
import type { ProjectHealthReport, VulnerabilityFinding } from "../types";

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

/** A critical vulnerability finding for `name@version`. */
function vuln(name: string, version: string): VulnerabilityFinding {
  return {
    packageName: name,
    version,
    severity: "critical",
    summary: "boom",
    url: "https://github.com/advisories/GHSA-aaaa-bbbb-cccc",
    id: "GHSA-AAAA-BBBB-CCCC",
  };
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

/** Builds runner deps with the supplied manifests + fetchers and a fixed clock. */
function makeDeps(
  manifests: ParsedManifest[],
  fetchVulnerabilities: VulnerabilityFetcher,
  fetchLicenseIssue?: ProjectHealthRunnerDeps["fetchLicenseIssue"],
  analyzeManifest?: ProjectHealthRunnerDeps["analyzeManifest"],
): ProjectHealthRunnerDeps {
  return {
    listManifests: vi.fn().mockResolvedValue(manifests),
    resolveVersionKey: vi.fn((_, dep) => Promise.resolve(dep.range)),
    fetchVulnerabilities,
    fetchLicenseIssue: fetchLicenseIssue ?? vi.fn().mockResolvedValue(null),
    analyzeManifest:
      analyzeManifest ??
      vi.fn((manifestArg) => Promise.resolve(emptyAnalysis(manifestArg.uri))),
    clock: () => 1000,
  };
}

/**
 * A VulnerabilityFetcher mock that returns the given finding for every
 * entry. Returns the `vi.fn` directly (not widened to the plain function
 * type) so tests can assert on its `.mock` calls.
 */
function vulnerableFetcher() {
  return vi.fn(async (entries: Array<{ name: string; versionKey: string }>) => {
    const map = new Map<string, VulnerabilityFinding[]>();
    for (const entry of entries) {
      map.set(`${entry.name}@${entry.versionKey}`, [
        vuln(entry.name, entry.versionKey),
      ]);
    }
    return map;
  });
}

describe("runProjectHealth", () => {
  it("checks each unique dependency once and fans findings to every package", async () => {
    const manifests = [
      manifest("a", [["lodash", "4.17.20"]]),
      manifest("b", [["lodash", "4.17.20"]]),
    ];
    const fetchVulnerabilities = vulnerableFetcher();
    const deps = makeDeps(manifests, fetchVulnerabilities);

    const report = await runProjectHealth(deps, {
      workspaceKey: "ws",
      workspaceName: "ws",
    });

    // One batched call, with a single deduped entry.
    expect(fetchVulnerabilities).toHaveBeenCalledTimes(1);
    expect(fetchVulnerabilities.mock.calls[0][0]).toHaveLength(1);
    expect(report.phase).toBe("complete");
    expect(report.totals.uniqueDependencyCount).toBe(1);
    expect(report.totals.vulnerabilities.total).toBe(1);
    expect(report.totals.vulnerabilities.critical).toBe(1);
    expect(report.totals.packageCount).toBe(2);
    expect(report.fastPassCompletedAt).not.toBeNull();
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
      vi.fn(async () => new Map()),
      undefined,
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

  it("emits progress snapshots through the fast pass and completion", async () => {
    const manifests = [manifest("a", [["lodash", "4.17.20"]])];
    const deps = makeDeps(
      manifests,
      vi.fn(async () => new Map()),
    );
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
    expect(phases).toContain("fast-pass");
    expect(phases.at(-1)).toBe("complete");
  });

  it("project scope skips the fast pass and seeds vuln/license from the base", async () => {
    const manifests = [manifest("a", [["lodash", "4.17.20"]])];
    const fetchVulnerabilities = vulnerableFetcher();
    const analyzeManifest = vi.fn((manifestArg) =>
      Promise.resolve(emptyAnalysis(manifestArg.uri)),
    );
    const deps = makeDeps(
      manifests,
      fetchVulnerabilities,
      undefined,
      analyzeManifest,
    );
    const baseReport = {
      packages: [
        {
          uri: "a",
          relativePath: "a/package.json",
          name: "a",
          dependencyCount: 1,
          vulnerabilities: [vuln("lodash", "4.17.20")],
          licenseIssues: [],
          projectAnalysis: null,
          replaceable: [],
          status: "enriched",
          warnings: [],
        },
      ],
      fastPassCompletedAt: 500,
    } as unknown as ProjectHealthReport;

    const report = await runProjectHealth(deps, {
      workspaceKey: "ws",
      workspaceName: null,
      includeDependencies: false,
      baseReport,
    });

    // The fast pass was skipped, but vuln data is preserved from the base.
    expect(fetchVulnerabilities).not.toHaveBeenCalled();
    expect(analyzeManifest).toHaveBeenCalled();
    expect(report.packages[0].vulnerabilities).toHaveLength(1);
    expect(report.totals.vulnerabilities.total).toBe(1);
    // The preserved fast-pass timestamp carries over.
    expect(report.fastPassCompletedAt).toBe(500);
    expect(report.backfillCompletedAt).not.toBeNull();
  });

  it("dependencies scope skips project analysis and seeds it from the base", async () => {
    const manifests = [manifest("a", [["lodash", "4.17.20"]])];
    const analyzeManifest = vi.fn();
    const deps = makeDeps(
      manifests,
      vulnerableFetcher(),
      undefined,
      analyzeManifest,
    );
    const baseReport = {
      packages: [
        {
          uri: "a",
          relativePath: "a/package.json",
          name: "a",
          dependencyCount: 1,
          vulnerabilities: [],
          licenseIssues: [],
          projectAnalysis: {
            total: 1,
            errorCount: 0,
            warningCount: 0,
            publintCount: 1,
            circularCount: 0,
            replaceableCount: 0,
          },
          replaceable: [],
          status: "enriched",
          warnings: [],
        },
      ],
      backfillCompletedAt: 900,
    } as unknown as ProjectHealthReport;

    const report = await runProjectHealth(deps, {
      workspaceKey: "ws",
      workspaceName: null,
      includeProjectAnalysis: false,
      baseReport,
    });

    expect(analyzeManifest).not.toHaveBeenCalled();
    expect(report.packages[0].projectAnalysis?.publintCount).toBe(1);
    expect(report.packages[0].vulnerabilities).toHaveLength(1);
    expect(report.backfillCompletedAt).toBe(900);
  });

  it("returns a cancelled report when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const manifests = [manifest("a", [["lodash", "4.17.20"]])];
    const fetchVulnerabilities = vulnerableFetcher();
    const deps = makeDeps(manifests, fetchVulnerabilities);

    const report = await runProjectHealth(deps, {
      workspaceKey: "ws",
      workspaceName: null,
      signal: controller.signal,
    });

    expect(report.phase).toBe("cancelled");
    expect(fetchVulnerabilities).not.toHaveBeenCalled();
  });
});
