/**
 * External dependencies.
 */
import { describe, expect, it } from "vitest";
import type { PackageStats } from "@agentic-web-labs/package-analyzer-core";

/**
 * Internal dependencies.
 */
import { renderHover } from "../render";

/**
 * Builds a PackageStats stub with everything nulled so each test can
 * override just the fields its assertion cares about.
 */
function makeStats(overrides: Partial<PackageStats> = {}): PackageStats {
  return {
    packageName: "lodash",
    description: null,
    latestVersion: null,
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
    score: 70,
    scoreBreakdown: [],
    scoreMaxPoints: 100,
    githubRateLimited: false,
    githubIssuesUnavailable: false,
    versionResolution: "latest-fallback",
    consideredVersion: null,
    advisorySources: [],
    ...overrides,
  } as PackageStats;
}

describe("renderHover", () => {
  it("prefixes the hover with the NPM Advisor brand line", () => {
    const output = renderHover(makeStats({ score: 78, scoreMaxPoints: 100 }));
    expect(output.split("\n")[0]).toBe(
      "$(extensions-view-icon) **NPM Advisor**",
    );
  });

  it("includes a latest-version line when available", () => {
    const output = renderHover(makeStats({ latestVersion: "5.0.0" }));
    expect(output).toContain("**Latest version:** 5.0.0");
  });

  it("omits the latest-version line when not available", () => {
    const output = renderHover(makeStats({ latestVersion: null }));
    expect(output).not.toContain("Latest version:");
  });

  it("renders the package name and score after the brand line", () => {
    const output = renderHover(makeStats({ score: 78, scoreMaxPoints: 100 }));
    expect(output).toContain("**lodash** — Fitness 78/100");
  });

  it("renders the package description after the name line when present", () => {
    const output = renderHover(
      makeStats({ description: "A modern JavaScript utility library." }),
    );
    const lines = output.split("\n");
    const nameIndex = lines.findIndex((line) => line.includes("**lodash**"));
    expect(lines[nameIndex + 2]).toBe("A modern JavaScript utility library.");
  });

  it("omits the description when null", () => {
    const output = renderHover(makeStats({ description: null }));
    const nameLine = "**lodash** — Fitness 70/100";
    const afterName = output.slice(output.indexOf(nameLine) + nameLine.length);
    expect(afterName).not.toMatch(/\n\nA modern/);
  });

  it("collapses whitespace in multi-line descriptions", () => {
    const output = renderHover(
      makeStats({ description: "  Line one\n  Line two  " }),
    );
    expect(output).toContain("Line one Line two");
  });

  it("includes a bundle line when bundle data is present", () => {
    const output = renderHover(
      makeStats({
        bundle: {
          size: 71_000,
          gzip: 24_500,
          isTreeShakeable: true,
          hasSideEffects: false,
        },
      }),
    );
    expect(output).toContain("**Bundle:** 69.34 KB (gzip 23.93 KB)");
  });

  it("omits the bundle line when bundle is null", () => {
    const output = renderHover(makeStats());
    expect(output).not.toContain("Bundle:");
  });

  it("renders a relative last-commit date", () => {
    const now = () => new Date("2026-05-01T00:00:00Z");
    const fourteenDaysAgo = "2026-04-17T00:00:00Z";
    const output = renderHover(makeStats({ lastCommitDate: fourteenDaysAgo }), {
      now,
    });
    expect(output).toMatch(/\*\*Last commit:\*\* 2 weeks ago/);
  });

  it("summarises security advisories by severity", () => {
    const output = renderHover(
      makeStats({
        securityAdvisories: {
          critical: 0,
          high: 2,
          moderate: 1,
          low: 0,
          issues: [],
        },
      }),
    );
    expect(output).toContain("**Security:** 2 high, 1 moderate");
  });

  it("says no advisories when all severities are zero", () => {
    const output = renderHover(
      makeStats({
        securityAdvisories: {
          critical: 0,
          high: 0,
          moderate: 0,
          low: 0,
          issues: [],
        },
      }),
    );
    expect(output).toContain("**Security:** no known advisories");
  });

  it("renders license compatibility when available", () => {
    const output = renderHover(
      makeStats({
        license: "MIT",
        licenseCompatibility: { isCompatible: true, explanation: null },
      }),
      { targetLicense: "MIT" },
    );
    expect(output).toContain("**License:** MIT (compatible with MIT)");
  });

  it("flags incompatible licenses", () => {
    const output = renderHover(
      makeStats({
        license: "GPL-3.0",
        licenseCompatibility: { isCompatible: false, explanation: null },
      }),
      { targetLicense: "MIT" },
    );
    expect(output).toContain("**License:** GPL-3.0 (incompatible with MIT)");
  });

  it("always includes a link to npmjs", () => {
    const output = renderHover(makeStats({ packageName: "@types/node" }));
    expect(output).toContain(
      "[View on npm](https://www.npmjs.com/package/%40types%2Fnode)",
    );
  });

  it("includes a Show full insights command link bound to the package name", () => {
    const output = renderHover(makeStats({ packageName: "@types/node" }));
    expect(output).toContain(
      "[Show full insights](command:npmAdvisor.showInsights?%5B%22%40types%2Fnode%22%5D)",
    );
  });

  it("includes a Source link when githubUrl is present", () => {
    const output = renderHover(
      makeStats({ githubUrl: "https://github.com/lodash/lodash" }),
    );
    expect(output).toContain("[Source](https://github.com/lodash/lodash)");
  });

  it("renders Installed / Range / Latest when lockfile-grounded and all three differ", () => {
    const output = renderHover(
      makeStats({
        latestVersion: "4.17.21",
        versionResolution: "lockfile",
        consideredVersion: "4.17.20",
      }),
      { declaredRange: "^4.17.0", installedVersion: "4.17.20" },
    );
    expect(output).toContain("**Installed:** 4.17.20");
    expect(output).toContain("**Range:** ^4.17.0");
    expect(output).toContain("**Latest version:** 4.17.21");
  });

  it("collapses the Range line when it equals the installed version", () => {
    const output = renderHover(
      makeStats({
        latestVersion: "4.17.20",
        versionResolution: "lockfile",
        consideredVersion: "4.17.20",
      }),
      { declaredRange: "4.17.20", installedVersion: "4.17.20" },
    );
    expect(output).toContain("**Installed:** 4.17.20");
    expect(output).not.toContain("**Range:**");
    expect(output).not.toContain("**Latest version:**");
  });

  it("appends a no-lockfile footer when only a range is available", () => {
    const output = renderHover(
      makeStats({
        latestVersion: "4.17.21",
        versionResolution: "latest-fallback",
        consideredVersion: "4.17.21",
      }),
      { declaredRange: "^4.17.0" },
    );
    expect(output).toContain("**Range:** ^4.17.0");
    expect(output).toContain("**Latest version:** 4.17.21");
    expect(output).toContain("No lockfile found — showing latest");
  });

  it("omits the no-lockfile footer when neither range nor latest are present", () => {
    const output = renderHover(
      makeStats({
        latestVersion: null,
        versionResolution: "latest-fallback",
        consideredVersion: null,
      }),
    );
    expect(output).not.toContain("No lockfile found");
  });
});
