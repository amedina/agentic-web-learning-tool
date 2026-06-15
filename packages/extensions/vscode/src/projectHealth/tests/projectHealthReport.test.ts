/**
 * External dependencies.
 */
import { describe, expect, it } from "vitest";
import type { PackageStats } from "@agentic-web-labs/package-analyzer-core";
import type { ProjectAnalysis } from "@agentic-web-labs/project-analyzer-core";

/**
 * Internal dependencies.
 */
import {
  computeTotals,
  deriveAdvisoryId,
  filterReportBySeverityFloor,
  licenseFindingFromStats,
  normalizeSeverity,
  replacementsFromAnalysis,
  summarizeProjectAnalysis,
  vulnerabilitiesFromStats,
} from "../projectHealthReport";
import { isSeverityVisibleAtFloor } from "../types";
import type {
  PackageHealthEntry,
  ProjectHealthReport,
  VulnerabilityFinding,
  VulnerabilitySeverity,
} from "../types";

/** Minimal PackageStats stub carrying only the fields under test. */
function stats(partial: Partial<PackageStats>): PackageStats {
  return partial as unknown as PackageStats;
}

/** Builds a PackageHealthEntry shell with the supplied findings. */
function entry(partial: Partial<PackageHealthEntry>): PackageHealthEntry {
  return {
    uri: "a",
    relativePath: "a/package.json",
    name: "a",
    dependencyCount: 0,
    vulnerabilities: [],
    licenseIssues: [],
    projectAnalysis: null,
    replaceable: [],
    status: "enriched",
    warnings: [],
    ...partial,
  };
}

describe("normalizeSeverity", () => {
  it("maps known and aliased severities", () => {
    expect(normalizeSeverity("Critical")).toBe("critical");
    expect(normalizeSeverity("HIGH")).toBe("high");
    expect(normalizeSeverity("medium")).toBe("moderate");
    expect(normalizeSeverity("moderate")).toBe("moderate");
    expect(normalizeSeverity("low")).toBe("low");
    expect(normalizeSeverity("")).toBe("unknown");
    expect(normalizeSeverity(null)).toBe("unknown");
  });
});

describe("deriveAdvisoryId", () => {
  it("extracts a GHSA id from the advisory url", () => {
    expect(
      deriveAdvisoryId(
        "https://github.com/advisories/GHSA-abcd-ef12-3456",
        "summary",
      ),
    ).toBe("GHSA-ABCD-EF12-3456");
  });

  it("extracts a CVE id when no GHSA is present", () => {
    expect(deriveAdvisoryId("https://x/CVE-2023-1234", "s")).toBe(
      "CVE-2023-1234",
    );
  });

  it("falls back to the trimmed summary", () => {
    expect(deriveAdvisoryId("https://example.com/x", "  ReDoS in foo  ")).toBe(
      "ReDoS in foo",
    );
  });
});

describe("vulnerabilitiesFromStats", () => {
  it("maps each advisory issue to a finding with a stable id", () => {
    const result = vulnerabilitiesFromStats(
      "lodash",
      "4.17.20",
      stats({
        securityAdvisories: {
          critical: 1,
          high: 0,
          moderate: 0,
          low: 0,
          issues: [
            {
              summary: "Prototype pollution",
              severity: "critical",
              url: "https://github.com/advisories/GHSA-aaaa-bbbb-cccc",
            },
          ],
        },
      }),
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      packageName: "lodash",
      version: "4.17.20",
      severity: "critical",
      id: "GHSA-AAAA-BBBB-CCCC",
    });
  });

  it("returns an empty array when there are no advisories", () => {
    expect(vulnerabilitiesFromStats("x", "1.0.0", null)).toEqual([]);
    expect(
      vulnerabilitiesFromStats(
        "x",
        "1.0.0",
        stats({ securityAdvisories: null }),
      ),
    ).toEqual([]);
  });
});

describe("licenseFindingFromStats", () => {
  it("returns a finding only for incompatible licenses", () => {
    const incompatible = licenseFindingFromStats(
      "gpl-pkg",
      "1.0.0",
      stats({
        license: "GPL-3.0",
        licenseCompatibility: {
          isCompatible: false,
          explanation: "GPL not compatible with MIT",
        },
      }),
    );
    expect(incompatible).toMatchObject({
      packageName: "gpl-pkg",
      license: "GPL-3.0",
    });

    const compatible = licenseFindingFromStats(
      "mit-pkg",
      "1.0.0",
      stats({
        license: "MIT",
        licenseCompatibility: { isCompatible: true, explanation: null },
      }),
    );
    expect(compatible).toBeNull();

    expect(
      licenseFindingFromStats(
        "x",
        "1.0.0",
        stats({ licenseCompatibility: null }),
      ),
    ).toBeNull();
  });
});

describe("summarizeProjectAnalysis", () => {
  it("condenses severity and source counts", () => {
    const analysis = {
      summary: {
        total: 6,
        bySeverity: { error: 1, warning: 2, info: 3, hint: 0 },
        bySource: { publint: 3, replacements: 2, "circular-deps": 1 },
      },
    } as unknown as ProjectAnalysis;

    expect(summarizeProjectAnalysis(analysis)).toEqual({
      total: 6,
      errorCount: 1,
      warningCount: 2,
      publintCount: 3,
      circularCount: 1,
      replaceableCount: 2,
    });
  });
});

describe("replacementsFromAnalysis", () => {
  it("extracts replacement findings with their suggestions and doc url", () => {
    const analysis = {
      findings: [
        {
          source: "replacements",
          message: "rimraf has lighter alternatives.",
          data: {
            packageName: "rimraf",
            replacements: ["native fs.promises.rm"],
            documentationUrl: "https://e18e.dev/guide/replacements/rimraf.html",
          },
        },
        { source: "publint", message: "p", data: {} },
      ],
    } as unknown as ProjectAnalysis;

    const result = replacementsFromAnalysis(analysis);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      packageName: "rimraf",
      replacements: ["native fs.promises.rm"],
      documentationUrl: "https://e18e.dev/guide/replacements/rimraf.html",
    });
  });

  it("tolerates findings without replacement data", () => {
    const analysis = {
      findings: [{ source: "replacements", message: "x", data: undefined }],
    } as unknown as ProjectAnalysis;
    expect(replacementsFromAnalysis(analysis)).toEqual([
      {
        packageName: "",
        replacements: [],
        documentationUrl: null,
        message: "x",
      },
    ]);
  });
});

describe("computeTotals", () => {
  it("dedups a shared vulnerable dependency across packages", () => {
    const vuln = {
      packageName: "lodash",
      version: "4.17.20",
      severity: "high" as const,
      summary: "x",
      url: "u",
      id: "GHSA-1",
    };
    const packages = [
      entry({ uri: "a", vulnerabilities: [vuln] }),
      entry({ uri: "b", vulnerabilities: [vuln] }),
    ];

    const totals = computeTotals(packages, 1);

    expect(totals.vulnerabilities.high).toBe(1);
    expect(totals.vulnerabilities.total).toBe(1);
    expect(totals.packageCount).toBe(2);
    expect(totals.uniqueDependencyCount).toBe(1);
  });

  it("counts vulnerabilities and license issues across packages", () => {
    const vuln = {
      packageName: "lodash",
      version: "4.17.20",
      severity: "high" as const,
      summary: "x",
      url: "u",
      id: "GHSA-1",
    };
    const license = {
      packageName: "gpl-pkg",
      version: "1.0.0",
      license: "GPL-3.0",
      explanation: null,
    };
    const packages = [
      entry({ vulnerabilities: [vuln], licenseIssues: [license] }),
    ];

    const totals = computeTotals(packages, 2);

    expect(totals.vulnerabilities.total).toBe(1);
    expect(totals.vulnerabilities.high).toBe(1);
    expect(totals.licenseIssueCount).toBe(1);
  });
});

describe("isSeverityVisibleAtFloor", () => {
  it("keeps severities at or above the floor", () => {
    expect(isSeverityVisibleAtFloor("critical", "high")).toBe(true);
    expect(isSeverityVisibleAtFloor("high", "high")).toBe(true);
    expect(isSeverityVisibleAtFloor("moderate", "high")).toBe(false);
    expect(isSeverityVisibleAtFloor("low", "high")).toBe(false);
  });

  it("includes lower tiers once the floor is lowered", () => {
    expect(isSeverityVisibleAtFloor("moderate", "moderate")).toBe(true);
    expect(isSeverityVisibleAtFloor("low", "low")).toBe(true);
    expect(isSeverityVisibleAtFloor("low", "moderate")).toBe(false);
  });

  it("always keeps unknown-severity advisories", () => {
    expect(isSeverityVisibleAtFloor("unknown", "critical")).toBe(true);
    expect(isSeverityVisibleAtFloor("unknown", "low")).toBe(true);
  });
});

describe("filterReportBySeverityFloor", () => {
  /** Builds a VulnerabilityFinding for one severity tier. */
  function vuln(severity: VulnerabilitySeverity): VulnerabilityFinding {
    return {
      packageName: `pkg-${severity}`,
      version: "1.0.0",
      severity,
      summary: severity,
      url: `https://x/${severity}`,
      id: `ID-${severity}`,
    };
  }

  /** Wraps the given packages in a completed report shell. */
  function report(packages: PackageHealthEntry[]): ProjectHealthReport {
    return {
      schemaVersion: 1,
      workspaceKey: "ws",
      workspaceName: null,
      generatedAt: 0,
      startedAt: 0,
      phase: "complete",
      packages,
      totals: computeTotals(packages, packages.length),
      progress: { phase: "complete", completed: 0, total: 0, label: "" },
      warnings: [],
      fastPassCompletedAt: 1,
      backfillCompletedAt: null,
    };
  }

  it("drops advisories below the floor and recomputes totals", () => {
    const source = report([
      entry({
        vulnerabilities: [
          vuln("critical"),
          vuln("high"),
          vuln("moderate"),
          vuln("low"),
        ],
      }),
    ]);

    const filtered = filterReportBySeverityFloor(source, "high");

    expect(filtered.packages[0].vulnerabilities.map((v) => v.severity)).toEqual(
      ["critical", "high"],
    );
    expect(filtered.totals.vulnerabilities.total).toBe(2);
    expect(filtered.totals.vulnerabilities.moderate).toBe(0);
    expect(filtered.totals.vulnerabilities.low).toBe(0);
  });

  it("keeps unknown-severity advisories regardless of the floor", () => {
    const source = report([
      entry({ vulnerabilities: [vuln("low"), vuln("unknown")] }),
    ]);

    const filtered = filterReportBySeverityFloor(source, "critical");

    expect(filtered.packages[0].vulnerabilities.map((v) => v.severity)).toEqual(
      ["unknown"],
    );
    expect(filtered.totals.vulnerabilities.unknown).toBe(1);
    expect(filtered.totals.vulnerabilities.total).toBe(1);
  });

  it("returns untouched packages by reference", () => {
    const original = entry({
      uri: "keep",
      vulnerabilities: [vuln("critical")],
    });
    const source = report([original]);

    const filtered = filterReportBySeverityFloor(source, "high");

    expect(filtered.packages[0]).toBe(original);
  });

  it("leaves license issues and replaceable counts intact", () => {
    const source = report([
      entry({
        vulnerabilities: [vuln("low")],
        licenseIssues: [
          {
            packageName: "gpl",
            version: "1.0.0",
            license: "GPL-3.0",
            explanation: null,
          },
        ],
      }),
    ]);

    const filtered = filterReportBySeverityFloor(source, "high");

    expect(filtered.totals.vulnerabilities.total).toBe(0);
    expect(filtered.totals.licenseIssueCount).toBe(1);
  });
});
