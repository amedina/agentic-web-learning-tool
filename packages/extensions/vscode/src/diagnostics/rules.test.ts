/**
 * Internal dependencies.
 */
import type { PackageJsonDependency } from "../packageJson/parse";
import { Position, Range } from "../test/vscodeMock";
import { evaluateDiagnostics } from "./rules";
import type { NpmAdvisorSettings } from "./settings";

/**
 * External dependencies.
 */
import { describe, expect, it } from "vitest";
import * as vscode from "vscode";
import type { PackageStats } from "@agentic-web-labs/package-analyzer-core";

const NOW = () => new Date("2026-05-01T00:00:00Z");

const SETTINGS: NpmAdvisorSettings = {
  targetLicense: "MIT",
  unmaintainedThresholdDays: 730,
  advisorySeverityFloor: "high",
};

function makeDependency(
  overrides: Partial<PackageJsonDependency> = {},
): PackageJsonDependency {
  const range = new Range(new Position(2, 4), new Position(2, 14));
  return {
    name: "lodash",
    version: "^4.17.21",
    category: "dependencies",
    nameRange: range,
    valueRange: range,
    fullRange: range,
    ...overrides,
  };
}

function makeStats(overrides: Partial<PackageStats> = {}): PackageStats {
  return {
    packageName: "lodash",
    description: null,
    githubUrl: null,
    stars: null,
    collaboratorsCount: null,
    lastCommitDate: null,
    responsiveness: null,
    securityAdvisories: null,
    bundle: null,
    dependencyTree: null,
    license: null,
    licenseCompatibility: null,
    recommendations: {},
    score: 80,
    scoreBreakdown: [],
    scoreMaxPoints: 100,
    githubRateLimited: false,
    githubIssuesUnavailable: false,
    ...overrides,
  } as PackageStats;
}

describe("evaluateDiagnostics — security advisories", () => {
  it("emits an Error for advisories at or above the floor", () => {
    const diagnostics = evaluateDiagnostics(
      makeDependency(),
      makeStats({
        securityAdvisories: {
          critical: 1,
          high: 0,
          moderate: 0,
          low: 0,
          issues: [],
        },
      }),
      SETTINGS,
      { now: NOW },
    );
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].severity).toBe(vscode.DiagnosticSeverity.Error);
    expect(diagnostics[0].code).toBe("security-advisory");
    expect(diagnostics[0].message).toContain("1 critical");
  });

  it("ignores advisories strictly below the floor", () => {
    const diagnostics = evaluateDiagnostics(
      makeDependency(),
      makeStats({
        securityAdvisories: {
          critical: 0,
          high: 0,
          moderate: 5,
          low: 2,
          issues: [],
        },
      }),
      SETTINGS,
      { now: NOW },
    );
    expect(diagnostics).toHaveLength(0);
  });

  it("respects a lowered floor", () => {
    const diagnostics = evaluateDiagnostics(
      makeDependency(),
      makeStats({
        securityAdvisories: {
          critical: 0,
          high: 0,
          moderate: 1,
          low: 0,
          issues: [],
        },
      }),
      { ...SETTINGS, advisorySeverityFloor: "moderate" },
      { now: NOW },
    );
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain("1 moderate");
  });
});

describe("evaluateDiagnostics — license compatibility", () => {
  it("emits a Warning when the license is incompatible", () => {
    const diagnostics = evaluateDiagnostics(
      makeDependency(),
      makeStats({
        license: "GPL-3.0",
        licenseCompatibility: {
          isCompatible: false,
          explanation: "GPL is copyleft.",
        },
      }),
      SETTINGS,
      { now: NOW },
    );
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].severity).toBe(vscode.DiagnosticSeverity.Warning);
    expect(diagnostics[0].code).toBe("license-incompatible");
    expect(diagnostics[0].message).toContain("GPL-3.0");
    expect(diagnostics[0].message).toContain("MIT");
    expect(diagnostics[0].message).toContain("GPL is copyleft.");
  });

  it("stays silent when the license is compatible", () => {
    const diagnostics = evaluateDiagnostics(
      makeDependency(),
      makeStats({
        license: "MIT",
        licenseCompatibility: { isCompatible: true, explanation: null },
      }),
      SETTINGS,
      { now: NOW },
    );
    expect(diagnostics).toHaveLength(0);
  });

  it("stays silent when no compatibility data is available", () => {
    const diagnostics = evaluateDiagnostics(
      makeDependency(),
      makeStats({ license: "MIT" }),
      SETTINGS,
      { now: NOW },
    );
    expect(diagnostics).toHaveLength(0);
  });
});

describe("evaluateDiagnostics — unmaintained", () => {
  it("flags packages older than the threshold", () => {
    const threeYearsAgo = "2023-04-01T00:00:00Z";
    const diagnostics = evaluateDiagnostics(
      makeDependency(),
      makeStats({ lastCommitDate: threeYearsAgo }),
      SETTINGS,
      { now: NOW },
    );
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].severity).toBe(vscode.DiagnosticSeverity.Warning);
    expect(diagnostics[0].code).toBe("unmaintained");
    expect(diagnostics[0].message).toContain("years ago");
  });

  it("stays silent for recently updated packages", () => {
    const oneMonthAgo = "2026-04-01T00:00:00Z";
    const diagnostics = evaluateDiagnostics(
      makeDependency(),
      makeStats({ lastCommitDate: oneMonthAgo }),
      SETTINGS,
      { now: NOW },
    );
    expect(diagnostics).toHaveLength(0);
  });

  it("respects a custom threshold", () => {
    const fortyDaysAgo = "2026-03-22T00:00:00Z";
    const diagnostics = evaluateDiagnostics(
      makeDependency(),
      makeStats({ lastCommitDate: fortyDaysAgo }),
      { ...SETTINGS, unmaintainedThresholdDays: 30 },
      { now: NOW },
    );
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain("days ago");
  });

  it("stays silent when last-commit date is missing or invalid", () => {
    expect(
      evaluateDiagnostics(
        makeDependency(),
        makeStats({ lastCommitDate: null }),
        SETTINGS,
        { now: NOW },
      ),
    ).toHaveLength(0);
    expect(
      evaluateDiagnostics(
        makeDependency(),
        makeStats({ lastCommitDate: "not a date" }),
        SETTINGS,
        { now: NOW },
      ),
    ).toHaveLength(0);
  });
});

describe("evaluateDiagnostics — combined", () => {
  it("can emit multiple diagnostics for a single dep", () => {
    const diagnostics = evaluateDiagnostics(
      makeDependency(),
      makeStats({
        license: "GPL-3.0",
        licenseCompatibility: { isCompatible: false, explanation: null },
        lastCommitDate: "2022-01-01T00:00:00Z",
        securityAdvisories: {
          critical: 1,
          high: 0,
          moderate: 0,
          low: 0,
          issues: [],
        },
      }),
      SETTINGS,
      { now: NOW },
    );
    const codes = diagnostics.map((diagnostic) => diagnostic.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        "security-advisory",
        "license-incompatible",
        "unmaintained",
      ]),
    );
  });
});
