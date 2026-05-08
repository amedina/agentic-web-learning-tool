/**
 * External dependencies.
 */
import { describe, it, expect } from "vitest";

/**
 * Internal dependencies.
 */
import type { ProjectAnalysis, ProjectFinding } from "../types";

describe("project-analyzer-core types", () => {
  it("ProjectAnalysis accepts an empty findings list", () => {
    const analysis: ProjectAnalysis = {
      rootPath: "/tmp/example",
      findings: [],
      summary: {
        total: 0,
        bySeverity: { error: 0, warning: 0, info: 0, hint: 0 },
        bySource: { publint: 0, replacements: 0 },
      },
      warnings: [],
    };
    expect(analysis.findings).toHaveLength(0);
  });

  it("ProjectFinding allows omitting file/range/data", () => {
    const finding: ProjectFinding = {
      source: "publint",
      severity: "warning",
      code: "EXAMPLE_RULE",
      message: "example",
    };
    expect(finding.file).toBeUndefined();
    expect(finding.range).toBeUndefined();
  });
});
