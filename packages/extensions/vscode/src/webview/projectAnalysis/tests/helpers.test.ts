/**
 * External dependencies.
 */
import { describe, expect, it } from "vitest";
import type {
  FindingSource,
  ProjectFinding,
} from "@agentic-web-labs/project-analyzer-core";

/**
 * Internal dependencies.
 */
import { hasFixableFindings } from "../helpers";

/** Builds a minimal finding with the given source for the predicate tests. */
function finding(source: FindingSource): ProjectFinding {
  return {
    source,
    severity: "warning",
    code: `${source}-code`,
    message: `${source} finding`,
  };
}

describe("hasFixableFindings", () => {
  it("returns false when there are no findings", () => {
    expect(hasFixableFindings([])).toBe(false);
  });

  it("returns false when the only findings are replaceable dependencies", () => {
    expect(hasFixableFindings([finding("replacements")])).toBe(false);
  });

  it("returns true when a publishing-hygiene finding is present", () => {
    expect(hasFixableFindings([finding("publint")])).toBe(true);
  });

  it("returns true when a circular-dependency finding is present", () => {
    expect(hasFixableFindings([finding("circular-deps")])).toBe(true);
  });

  it("returns true when a fixable finding sits alongside replacements", () => {
    expect(
      hasFixableFindings([finding("replacements"), finding("publint")]),
    ).toBe(true);
  });
});
