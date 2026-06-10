/**
 * External dependencies.
 */
import { describe, expect, it } from "vitest";
import type { OsvAdvisoryRecord } from "@agentic-web-labs/package-analyzer-core";

/**
 * Internal dependencies.
 */
import {
  licenseFindingFromRegistry,
  licenseFromRegistry,
  vulnerabilityFindingsFromOsv,
} from "../findingSources";

/** Builds an OSV advisory record stub. */
function record(partial: Partial<OsvAdvisoryRecord>): OsvAdvisoryRecord {
  return {
    summary: "summary",
    severity: "high",
    html_url: "https://github.com/advisories/GHSA-zzzz-zzzz-zzzz",
    ghsa_id: null,
    canonicalIds: [],
    vulnerabilities: [],
    ...partial,
  };
}

describe("vulnerabilityFindingsFromOsv", () => {
  it("prefers the GHSA id and normalizes severity", () => {
    const findings = vulnerabilityFindingsFromOsv("lodash", "4.17.20", [
      record({ severity: "HIGH", ghsa_id: "GHSA-aaaa-bbbb-cccc" }),
    ]);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      packageName: "lodash",
      version: "4.17.20",
      severity: "high",
      id: "GHSA-aaaa-bbbb-cccc",
    });
  });

  it("falls back to a canonical id, then a url-derived id", () => {
    const withCanonical = vulnerabilityFindingsFromOsv("x", "1.0.0", [
      record({ ghsa_id: null, canonicalIds: ["CVE-2023-1"] }),
    ]);
    expect(withCanonical[0].id).toBe("CVE-2023-1");

    const fromUrl = vulnerabilityFindingsFromOsv("x", "1.0.0", [
      record({
        ghsa_id: null,
        canonicalIds: [],
        html_url: "https://github.com/advisories/GHSA-1111-2222-3333",
      }),
    ]);
    expect(fromUrl[0].id).toBe("GHSA-1111-2222-3333");
  });

  it("returns an empty array for null records", () => {
    expect(vulnerabilityFindingsFromOsv("x", "1.0.0", null)).toEqual([]);
  });
});

describe("licenseFromRegistry", () => {
  it("reads the license from the resolved version, then latest, then top-level", () => {
    const data = {
      license: "MIT",
      "dist-tags": { latest: "2.0.0" },
      versions: {
        "1.0.0": { license: "Apache-2.0" },
        "2.0.0": { license: "BSD-3-Clause" },
      },
    };
    expect(licenseFromRegistry(data, "1.0.0")).toBe("Apache-2.0");
    expect(licenseFromRegistry(data, "latest")).toBe("BSD-3-Clause");
    expect(licenseFromRegistry({ license: "ISC" }, "latest")).toBe("ISC");
  });

  it("handles the legacy { type } license object", () => {
    expect(
      licenseFromRegistry({ license: { type: "GPL-3.0" } }, "latest"),
    ).toBe("GPL-3.0");
  });

  it("returns null when no license is present", () => {
    expect(licenseFromRegistry({}, "latest")).toBeNull();
    expect(licenseFromRegistry(null, "latest")).toBeNull();
  });
});

describe("licenseFindingFromRegistry", () => {
  it("returns null when the package has no license", () => {
    expect(
      licenseFindingFromRegistry("x", "1.0.0", { versions: {} }, "MIT"),
    ).toBeNull();
  });
});
