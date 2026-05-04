/**
 * External dependencies.
 */
import { describe, expect, it } from "vitest";
import type { PackageStats } from "@agentic-web-labs/package-analyzer-core";

/**
 * Internal dependencies.
 */
import { renderHover } from "../render";

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
    score: 70,
    scoreBreakdown: [],
    scoreMaxPoints: 100,
    githubRateLimited: false,
    githubIssuesUnavailable: false,
    ...overrides,
  } as PackageStats;
}

describe("renderHover", () => {
  it("renders the package name and score on the first line", () => {
    const output = renderHover(makeStats({ score: 78, scoreMaxPoints: 100 }));
    expect(output.split("\n")[0]).toBe("**lodash** — Score 78/100");
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

  it("includes a Source link when githubUrl is present", () => {
    const output = renderHover(
      makeStats({ githubUrl: "https://github.com/lodash/lodash" }),
    );
    expect(output).toContain("[Source](https://github.com/lodash/lodash)");
  });
});
