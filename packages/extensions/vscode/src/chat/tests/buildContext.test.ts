/**
 * External dependencies.
 */
import { describe, expect, it } from "vitest";
import type { PackageStats } from "@agentic-web-labs/package-analyzer-core";

/**
 * Internal dependencies.
 */
import { buildPackageContext, type ContextDependency } from "../buildContext";

/** Returns a sparse PackageStats for tests that only care about a few fields. */
function makeStats(overrides: Partial<PackageStats> = {}): PackageStats {
  return {
    packageName: "lodash",
    score: 78,
    scoreMaxPoints: 100,
    latestVersion: null,
    license: null,
    licenseCompatibility: null,
    bundle: null,
    securityAdvisories: null,
    stars: null,
    lastCommitDate: null,
    githubUrl: null,
    recommendations: {},
    ...overrides,
  } as PackageStats;
}

function makeDep(
  name: string,
  category: string,
  stats: PackageStats | null,
): ContextDependency {
  return { name, category, stats };
}

describe("buildPackageContext", () => {
  it("renders the active package.json header with name and path", () => {
    const output = buildPackageContext({
      prompt: "what should I do",
      activeFileName: "vscode-npm-advisor",
      activeFileRelativePath: "packages/extensions/vscode/package.json",
      dependencies: [],
    });
    expect(output).toContain("### Active package.json");
    expect(output).toContain("**vscode-npm-advisor**");
    expect(output).toContain("(packages/extensions/vscode/package.json)");
  });

  it("falls back to a placeholder when no package.json is active", () => {
    const output = buildPackageContext({
      prompt: "?",
      activeFileName: null,
      activeFileRelativePath: null,
      dependencies: [],
    });
    expect(output).toContain("_No package.json is currently focused");
  });

  it("renders one bullet per dep with category and Fitness score", () => {
    const output = buildPackageContext({
      prompt: "?",
      activeFileName: "demo",
      activeFileRelativePath: "package.json",
      dependencies: [
        makeDep("lodash", "dependencies", makeStats({ score: 80 })),
        makeDep(
          "vitest",
          "devDependencies",
          makeStats({ packageName: "vitest", score: 95 }),
        ),
      ],
    });
    expect(output).toContain("### Dependencies (2)");
    expect(output).toContain("`lodash` (dependencies) — Fitness 80/100");
    expect(output).toContain("`vitest` (devDependencies) — Fitness 95/100");
  });

  it("notes deps without cached stats", () => {
    const output = buildPackageContext({
      prompt: "?",
      activeFileName: null,
      activeFileRelativePath: null,
      dependencies: [makeDep("brand-new", "dependencies", null)],
    });
    expect(output).toContain("`brand-new` (dependencies) — no cached stats");
  });

  it("expands a Mentioned packages section for deps named in the prompt", () => {
    const output = buildPackageContext({
      prompt: "is lodash safe to use here",
      activeFileName: null,
      activeFileRelativePath: null,
      dependencies: [
        makeDep(
          "lodash",
          "dependencies",
          makeStats({
            packageName: "lodash",
            license: "MIT",
            licenseCompatibility: { isCompatible: true, explanation: null },
            stars: 60_000,
            bundle: {
              size: 71_000,
              gzip: 24_500,
              isTreeShakeable: true,
              hasSideEffects: false,
            },
          }),
        ),
        makeDep("react", "dependencies", makeStats({ packageName: "react" })),
      ],
    });
    expect(output).toContain("### Mentioned packages");
    expect(output).toContain("#### `lodash` (dependencies)");
    expect(output).toContain("- License: MIT (compatible with target license)");
    expect(output).toContain("- Bundle: 71000 bytes (gzip 24500)");
    expect(output).toContain("- GitHub stars: 60000");
    expect(output).not.toContain("#### `react`");
  });

  it("matches the unscoped suffix of a scoped package name", () => {
    const output = buildPackageContext({
      prompt: "what about node",
      activeFileName: null,
      activeFileRelativePath: null,
      dependencies: [
        makeDep(
          "@types/node",
          "devDependencies",
          makeStats({ packageName: "@types/node" }),
        ),
      ],
    });
    expect(output).toContain("#### `@types/node` (devDependencies)");
  });

  it("ignores stop-word matches like 'the' so common English doesn't false-positive", () => {
    const output = buildPackageContext({
      prompt: "what should the package do",
      activeFileName: null,
      activeFileRelativePath: null,
      dependencies: [makeDep("the", "dependencies", makeStats())],
    });
    expect(output).not.toContain("### Mentioned packages");
  });

  it("formats security advisories as a count breakdown", () => {
    const output = buildPackageContext({
      prompt: "lodash advisories",
      activeFileName: null,
      activeFileRelativePath: null,
      dependencies: [
        makeDep(
          "lodash",
          "dependencies",
          makeStats({
            securityAdvisories: {
              critical: 1,
              high: 2,
              moderate: 0,
              low: 0,
              issues: [],
            },
          }),
        ),
      ],
    });
    expect(output).toContain(
      "Security advisories: 1 critical, 2 high, 0 moderate, 0 low",
    );
  });

  it("says 'none known' when every advisory bucket is zero", () => {
    const output = buildPackageContext({
      prompt: "lodash",
      activeFileName: null,
      activeFileRelativePath: null,
      dependencies: [
        makeDep(
          "lodash",
          "dependencies",
          makeStats({
            securityAdvisories: {
              critical: 0,
              high: 0,
              moderate: 0,
              low: 0,
              issues: [],
            },
          }),
        ),
      ],
    });
    expect(output).toContain("Security advisories: none known");
  });

  it("caps Mentioned packages at 8 even when many deps match", () => {
    const dependencies = Array.from({ length: 15 }, (_, index) =>
      makeDep(
        `dep${index}`,
        "dependencies",
        makeStats({ packageName: `dep${index}` }),
      ),
    );
    const prompt = dependencies.map((dep) => dep.name).join(" ");
    const output = buildPackageContext({
      prompt,
      activeFileName: null,
      activeFileRelativePath: null,
      dependencies,
    });
    const matches = output.match(/#### `dep\d+`/g) ?? [];
    expect(matches.length).toBe(8);
  });
});
