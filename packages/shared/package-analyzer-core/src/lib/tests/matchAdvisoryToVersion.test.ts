/**
 * External dependencies.
 */
import { describe, it, expect, vi, afterEach } from "vitest";

/**
 * Internal dependencies.
 */
import { matchesAdvisoryVersion } from "../matchAdvisoryToVersion";

/**
 * Build a minimal advisory object with one vulnerability for tests.
 */
function advisoryWith(
  pkgName: string,
  range: string,
  ecosystem: string = "npm",
) {
  return {
    vulnerabilities: [
      {
        package: { ecosystem, name: pkgName },
        vulnerable_version_range: range,
      },
    ],
  };
}

describe("matchesAdvisoryVersion - no considered version", () => {
  it("returns true when consideredVersion is null", () => {
    const advisory = advisoryWith("lodash", ">= 4.0.0, < 4.17.21");
    expect(matchesAdvisoryVersion(advisory, "lodash", null)).toBe(true);
  });
});

describe("matchesAdvisoryVersion - version inside range", () => {
  it("returns true when consideredVersion falls inside the GHSA range", () => {
    const advisory = advisoryWith("lodash", ">= 4.0.0, < 4.17.21");
    expect(matchesAdvisoryVersion(advisory, "lodash", "4.17.20")).toBe(true);
  });

  it("returns true for a single upper-bound range", () => {
    const advisory = advisoryWith("lodash", "< 4.17.21");
    expect(matchesAdvisoryVersion(advisory, "lodash", "4.17.20")).toBe(true);
  });

  it("returns true for an exact-version range", () => {
    const advisory = advisoryWith("foo", "= 1.2.3");
    expect(matchesAdvisoryVersion(advisory, "foo", "1.2.3")).toBe(true);
  });
});

describe("matchesAdvisoryVersion - version outside range", () => {
  it("returns false when consideredVersion is past the upper bound", () => {
    const advisory = advisoryWith("lodash", ">= 4.0.0, < 4.17.21");
    expect(matchesAdvisoryVersion(advisory, "lodash", "4.17.21")).toBe(false);
  });

  it("returns false when consideredVersion is below the lower bound", () => {
    const advisory = advisoryWith("foo", ">= 2.0.0, < 3.0.0");
    expect(matchesAdvisoryVersion(advisory, "foo", "1.9.9")).toBe(false);
  });
});

describe("matchesAdvisoryVersion - package name and ecosystem filters", () => {
  it("ignores vulnerabilities targeting a different package name", () => {
    const advisory = {
      vulnerabilities: [
        {
          package: { ecosystem: "npm", name: "lodash.set" },
          vulnerable_version_range: ">= 0.0.0",
        },
      ],
    };
    expect(matchesAdvisoryVersion(advisory, "lodash.merge", "1.0.0")).toBe(
      false,
    );
  });

  it("ignores vulnerabilities flagged for a non-npm ecosystem", () => {
    const advisory = advisoryWith("lodash", ">= 0.0.0", "composer");
    expect(matchesAdvisoryVersion(advisory, "lodash", "4.17.20")).toBe(false);
  });

  it("matches case-insensitively on package name", () => {
    const advisory = advisoryWith("LoDaSh", ">= 0.0.0");
    expect(matchesAdvisoryVersion(advisory, "lodash", "4.17.20")).toBe(true);
  });

  it("matches when only one vulnerability in the advisory targets this package", () => {
    const advisory = {
      vulnerabilities: [
        {
          package: { ecosystem: "npm", name: "lodash.set" },
          vulnerable_version_range: ">= 0.0.0",
        },
        {
          package: { ecosystem: "npm", name: "lodash" },
          vulnerable_version_range: ">= 4.0.0, < 4.17.21",
        },
      ],
    };
    expect(matchesAdvisoryVersion(advisory, "lodash", "4.17.20")).toBe(true);
  });
});

describe("matchesAdvisoryVersion - missing / malformed data", () => {
  it("returns true when advisory has no vulnerabilities array", () => {
    expect(matchesAdvisoryVersion({}, "lodash", "4.17.20")).toBe(true);
  });

  it("returns true when vulnerabilities is empty", () => {
    expect(
      matchesAdvisoryVersion({ vulnerabilities: [] }, "lodash", "4.17.20"),
    ).toBe(true);
  });

  it("skips vulnerabilities with a missing vulnerable_version_range", () => {
    const advisory = {
      vulnerabilities: [{ package: { ecosystem: "npm", name: "lodash" } }],
    };
    expect(matchesAdvisoryVersion(advisory, "lodash", "4.17.20")).toBe(false);
  });

  it("warns and skips a vulnerability with an unparseable range", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const advisory = advisoryWith("lodash", "not-a-range");
    expect(matchesAdvisoryVersion(advisory, "lodash", "4.17.20")).toBe(false);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe("matchesAdvisoryVersion - loose version inputs", () => {
  it("coerces a v-prefixed considered version", () => {
    const advisory = advisoryWith("foo", ">= 1.0.0, < 2.0.0");
    expect(matchesAdvisoryVersion(advisory, "foo", "v1.5.0")).toBe(true);
  });

  it("returns true for prerelease versions inside the range", () => {
    const advisory = advisoryWith("foo", ">= 1.0.0-0, < 2.0.0");
    expect(matchesAdvisoryVersion(advisory, "foo", "1.5.0-beta.1")).toBe(true);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});
