/**
 * External dependencies.
 */
import { describe, expect, it } from "vitest";

/**
 * Internal dependencies.
 */
import {
  buildSuppressionPredicates,
  isLicenseSuppressed,
  isVulnerabilitySuppressed,
  suppressionKey,
} from "../suppressionMatching";
import type {
  LicenseFinding,
  SuppressionEntry,
  VulnerabilityFinding,
} from "../types";

/** A vulnerability finding for `pkg` with advisory id `id`. */
function vuln(pkg: string, id: string): VulnerabilityFinding {
  return {
    packageName: pkg,
    version: "1.0.0",
    severity: "high",
    summary: "x",
    url: "u",
    id,
  };
}

/** A license finding for `pkg`. */
function license(pkg: string): LicenseFinding {
  return {
    packageName: pkg,
    version: "1.0.0",
    license: "GPL-3.0",
    explanation: null,
  };
}

describe("suppressionKey", () => {
  it("keys vulnerabilities by package + id and licenses by package", () => {
    expect(
      suppressionKey({ kind: "vuln", packageName: "lodash", id: "GHSA-1" }),
    ).toBe("vuln:lodash:GHSA-1");
    expect(suppressionKey({ kind: "license", packageName: "gpl-pkg" })).toBe(
      "license:gpl-pkg",
    );
  });
});

describe("isVulnerabilitySuppressed", () => {
  const entries: SuppressionEntry[] = [
    { kind: "vuln", packageName: "lodash", id: "GHSA-1", mutedAt: 0 },
  ];

  it("matches the same package + advisory id", () => {
    expect(isVulnerabilitySuppressed(entries, vuln("lodash", "GHSA-1"))).toBe(
      true,
    );
  });

  it("does not silence a different advisory for the same package", () => {
    expect(isVulnerabilitySuppressed(entries, vuln("lodash", "GHSA-2"))).toBe(
      false,
    );
  });
});

describe("isLicenseSuppressed", () => {
  const entries: SuppressionEntry[] = [
    { kind: "license", packageName: "gpl-pkg", mutedAt: 0 },
  ];

  it("matches by package", () => {
    expect(isLicenseSuppressed(entries, license("gpl-pkg"))).toBe(true);
    expect(isLicenseSuppressed(entries, license("other"))).toBe(false);
  });
});

describe("buildSuppressionPredicates", () => {
  it("wires both predicates from the entries", () => {
    const predicates = buildSuppressionPredicates([
      { kind: "vuln", packageName: "lodash", id: "GHSA-1", mutedAt: 0 },
      { kind: "license", packageName: "gpl-pkg", mutedAt: 0 },
    ]);
    expect(
      predicates.isVulnerabilitySuppressed?.(vuln("lodash", "GHSA-1")),
    ).toBe(true);
    expect(predicates.isLicenseSuppressed?.(license("gpl-pkg"))).toBe(true);
  });
});
