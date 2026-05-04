/**
 * External dependencies.
 */
import { describe, expect, it } from "vitest";
import type { PackageStats } from "@agentic-web-labs/package-analyzer-core";

/**
 * Internal dependencies.
 */
import { formatBadge } from "../format";

/**
 * Builds a fully-populated PackageStats stub with sensible defaults so
 * each test can override only the fields it cares about.
 */
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
    score: 78,
    scoreBreakdown: [],
    scoreMaxPoints: 100,
    githubRateLimited: false,
    githubIssuesUnavailable: false,
    ...overrides,
  } as PackageStats;
}

describe("formatBadge", () => {
  it("formats every available segment in the documented order", () => {
    const badge = formatBadge(
      makeStats({
        score: 78,
        bundle: {
          size: 43_000,
          gzip: 14_000,
          isTreeShakeable: true,
          hasSideEffects: false,
        },
        securityAdvisories: {
          critical: 0,
          high: 1,
          moderate: 1,
          low: 0,
          issues: [],
        },
        license: "MIT",
        licenseCompatibility: { isCompatible: true, explanation: null },
      }),
      { targetLicense: "MIT" },
    );
    expect(badge).toBe("Score 78 · 42KB · 2 advisories · MIT ✓");
  });

  it("uses singular 'advisory' for a single issue", () => {
    const badge = formatBadge(
      makeStats({
        securityAdvisories: {
          critical: 0,
          high: 1,
          moderate: 0,
          low: 0,
          issues: [],
        },
      }),
    );
    expect(badge).toBe("Score 78 · 1 advisory");
  });

  it("omits the advisory segment when total is zero", () => {
    const badge = formatBadge(
      makeStats({
        license: "MIT",
        securityAdvisories: {
          critical: 0,
          high: 0,
          moderate: 0,
          low: 0,
          issues: [],
        },
      }),
    );
    expect(badge).toBe("Score 78 · MIT");
  });

  it("flags incompatible licenses with ✗", () => {
    const badge = formatBadge(
      makeStats({
        license: "GPL-3.0",
        licenseCompatibility: { isCompatible: false, explanation: null },
      }),
      { targetLicense: "MIT" },
    );
    expect(badge).toBe("Score 78 · GPL-3.0 ✗");
  });

  it("renders bare license when no target is configured", () => {
    const badge = formatBadge(makeStats({ license: "MIT" }));
    expect(badge).toBe("Score 78 · MIT");
  });

  it("formats bundle sizes across byte / KB / MB tiers", () => {
    const at = (size: number) =>
      formatBadge(
        makeStats({
          bundle: {
            size,
            gzip: 0,
            isTreeShakeable: false,
            hasSideEffects: false,
          },
        }),
      );
    expect(at(900)).toContain("900B");
    expect(at(43_000)).toContain("42KB");
    expect(at(1_500_000)).toContain("1.4MB");
    expect(at(15_000_000)).toContain("14MB");
  });

  it("returns null when no segment can be rendered", () => {
    const badge = formatBadge(
      makeStats({ score: 0, scoreMaxPoints: 0, license: null }),
    );
    expect(badge).toBeNull();
  });
});
