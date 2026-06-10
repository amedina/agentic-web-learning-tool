/**
 * External dependencies.
 */
import { describe, expect, it } from "vitest";

/**
 * Internal dependencies.
 */
import {
  buildAggregateFixPrompt,
  entryMatchesFilter,
  isLikelyPackageName,
  npmPackageUrl,
  reportHasActionableFindings,
} from "../helpers";
import type {
  PackageHealthEntry,
  ProjectHealthReport,
  SuppressionEntry,
} from "../../../projectHealth/types";

/** Builds a package entry with the supplied findings. */
function entry(partial: Partial<PackageHealthEntry>): PackageHealthEntry {
  return {
    uri: "a",
    relativePath: "packages/a/package.json",
    name: "@scope/a",
    dependencyCount: 1,
    vulnerabilities: [],
    licenseIssues: [],
    projectAnalysis: null,
    replaceable: [],
    status: "enriched",
    warnings: [],
    ...partial,
  };
}

/** Wraps entries into a minimal terminal report. */
function report(packages: PackageHealthEntry[]): ProjectHealthReport {
  return {
    schemaVersion: 1,
    workspaceKey: "ws",
    workspaceName: "ws",
    generatedAt: 1,
    startedAt: 0,
    phase: "complete",
    packages,
    totals: {
      packageCount: packages.length,
      uniqueDependencyCount: 1,
      vulnerabilities: {
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0,
        unknown: 0,
        total: 0,
      },
      licenseIssueCount: 0,
      replaceableCount: 0,
      suppressedCount: 0,
    },
    progress: { phase: "complete", completed: 1, total: 1, label: "done" },
    warnings: [],
    fastPassCompletedAt: 1,
    backfillCompletedAt: 1,
  };
}

const VULN = {
  packageName: "lodash",
  version: "4.17.20",
  severity: "high" as const,
  summary: "Prototype pollution",
  url: "u",
  id: "GHSA-1",
};

describe("entryMatchesFilter", () => {
  it("excludes a package whose only vulnerability is suppressed", () => {
    const pkg = entry({ vulnerabilities: [VULN] });
    const suppressions: SuppressionEntry[] = [
      { kind: "vuln", packageName: "lodash", id: "GHSA-1", mutedAt: 0 },
    ];
    expect(entryMatchesFilter(pkg, "vuln", suppressions)).toBe(false);
    expect(entryMatchesFilter(pkg, "suppressed", suppressions)).toBe(true);
  });

  it("matches an active vulnerability", () => {
    const pkg = entry({ vulnerabilities: [VULN] });
    expect(entryMatchesFilter(pkg, "vuln", [])).toBe(true);
  });

  it("matches publint and circular filters from the analysis summary", () => {
    const pkg = entry({
      projectAnalysis: {
        total: 2,
        errorCount: 0,
        warningCount: 0,
        publintCount: 1,
        circularCount: 1,
        replaceableCount: 0,
      },
    });
    expect(entryMatchesFilter(pkg, "publint", [])).toBe(true);
    expect(entryMatchesFilter(pkg, "circular", [])).toBe(true);
    expect(entryMatchesFilter(pkg, "replaceable", [])).toBe(false);
  });
});

describe("npm helpers", () => {
  it("recognizes package names and ignores free-text approaches", () => {
    expect(isLikelyPackageName("lodash")).toBe(true);
    expect(isLikelyPackageName("@scope/pkg")).toBe(true);
    expect(isLikelyPackageName("use optional chaining")).toBe(false);
  });

  it("builds the npmjs.com url", () => {
    expect(npmPackageUrl("lodash")).toBe(
      "https://www.npmjs.com/package/lodash",
    );
  });
});

describe("reportHasActionableFindings", () => {
  it("is false for a clean workspace", () => {
    expect(reportHasActionableFindings(report([entry({})]), [])).toBe(false);
  });

  it("is true when a package has an active vulnerability", () => {
    expect(
      reportHasActionableFindings(
        report([entry({ vulnerabilities: [VULN] })]),
        [],
      ),
    ).toBe(true);
  });
});

describe("scoped fix prompt + actionable findings", () => {
  const packages = [
    entry({
      vulnerabilities: [VULN],
      projectAnalysis: {
        total: 1,
        errorCount: 0,
        warningCount: 0,
        publintCount: 1,
        circularCount: 0,
        replaceableCount: 0,
      },
    }),
  ];

  it("dependency scope keeps vulnerabilities and drops project lines", () => {
    const prompt = buildAggregateFixPrompt(
      report(packages),
      [],
      "dependencies",
    );
    expect(prompt).toContain("Vulnerabilities");
    expect(prompt).not.toContain("Publishing (publint)");
  });

  it("project scope keeps project lines and drops vulnerabilities", () => {
    const prompt = buildAggregateFixPrompt(report(packages), [], "project");
    expect(prompt).toContain("Publishing (publint)");
    expect(prompt).not.toContain("Vulnerabilities");
  });

  it("reportHasActionableFindings respects the scope", () => {
    const onlyProject = report([
      entry({
        projectAnalysis: {
          total: 1,
          errorCount: 0,
          warningCount: 0,
          publintCount: 1,
          circularCount: 0,
          replaceableCount: 0,
        },
      }),
    ]);
    expect(reportHasActionableFindings(onlyProject, [], "dependencies")).toBe(
      false,
    );
    expect(reportHasActionableFindings(onlyProject, [], "project")).toBe(true);
  });
});

describe("buildAggregateFixPrompt", () => {
  it("groups findings by package and excludes suppressed ones", () => {
    const packages = [
      entry({
        uri: "a",
        relativePath: "packages/a/package.json",
        vulnerabilities: [VULN],
        projectAnalysis: {
          total: 2,
          errorCount: 0,
          warningCount: 0,
          publintCount: 1,
          circularCount: 0,
          replaceableCount: 1,
        },
      }),
      entry({
        uri: "b",
        relativePath: "packages/b/package.json",
        name: null,
        vulnerabilities: [VULN],
      }),
    ];

    const prompt = buildAggregateFixPrompt(report(packages), [
      { kind: "vuln", packageName: "lodash", id: "GHSA-1", mutedAt: 0 },
    ]);

    // Package a still lists its publint + replaceable lines.
    expect(prompt).toContain("## packages/a/package.json (@scope/a)");
    expect(prompt).toContain("Publishing (publint) issues: 1");
    expect(prompt).toContain("Replaceable dependencies");
    // The suppressed vulnerability is excluded, so package b (vuln-only)
    // drops out entirely.
    expect(prompt).not.toContain("packages/b/package.json");
    expect(prompt).not.toContain("GHSA-1");
  });
});
