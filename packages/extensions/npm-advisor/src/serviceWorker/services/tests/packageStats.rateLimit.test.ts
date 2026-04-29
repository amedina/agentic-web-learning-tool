/**
 * External dependencies.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Internal dependencies.
 *
 * End-to-end coverage for the regression where a GitHub rate-limit hit
 * mid-scan caused partial-but-successful-looking PackageStats objects to be
 * cached, so a subsequent load showed fewer vulnerabilities than the first.
 *
 * The current shape of the fix:
 * 1. `getPackageStats` flags the result with `githubRateLimited: true`
 *    instead of throwing — partial stats render with warning icons.
 * 2. `packageStatsService` skips caching any result whose
 *    `githubRateLimited` flag is true, so the next call retries from
 *    scratch (e.g. once a PAT is added or the limit resets).
 */
import { packageStatsService } from "../packageStats";
import { getPackageStats } from "@google-awlt/package-analyzer-core";

vi.mock("@google-awlt/package-analyzer-core", async () => {
  const actual = await vi.importActual<
    typeof import("@google-awlt/package-analyzer-core")
  >("@google-awlt/package-analyzer-core");
  return {
    ...actual,
    getPackageStats: vi.fn(),
  };
});

vi.mock("../storage", () => ({
  storageService: {
    getSync: vi.fn().mockResolvedValue({ targetLicense: "MIT" }),
  },
}));

function freshService() {
  // The service is a module-level singleton, so reset its private caches by
  // monkey-patching to be safe across tests. Using bracket access so we can
  // reach the private fields without a TS error.
  (packageStatsService as any).statsCache = new Map();
  (packageStatsService as any).lightStatsCache = new Map();
}

describe("packageStatsService — rate-limit cache eviction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    freshService();
  });

  it("getStats does not cache a rate-limited result (next call retries)", async () => {
    const partialStats = {
      packageName: "express",
      githubRateLimited: true,
      securityAdvisories: null,
    };
    vi.mocked(getPackageStats).mockResolvedValueOnce(partialStats as any);

    const firstResult = await packageStatsService.getStats("express");
    expect(firstResult).toEqual(partialStats);

    // The cache must be empty so the next call goes through to the network.
    expect((packageStatsService as any).statsCache.has("express")).toBe(false);

    // Now simulate the user adding a token (or the limit resetting). The next
    // getStats call should hit getPackageStats again, not return stale data.
    const realStats = {
      packageName: "express",
      githubRateLimited: false,
      securityAdvisories: {
        critical: 0,
        high: 0,
        moderate: 0,
        low: 4,
        issues: [],
      },
    };
    vi.mocked(getPackageStats).mockResolvedValueOnce(realStats as any);

    const result = await packageStatsService.getStats("express");

    expect(getPackageStats).toHaveBeenCalledTimes(2);
    expect(result).toEqual(realStats);
  });

  it("getLightStats does not cache a rate-limited result (next call retries)", async () => {
    const partialStats = {
      packageName: "body-parser",
      githubRateLimited: true,
      securityAdvisories: null,
    };
    vi.mocked(getPackageStats).mockResolvedValueOnce(partialStats as any);

    await packageStatsService.getLightStats("body-parser", "runtime");

    expect(
      (packageStatsService as any).lightStatsCache.has("body-parser::runtime"),
    ).toBe(false);

    const realStats = {
      packageName: "body-parser",
      githubRateLimited: false,
      securityAdvisories: {
        critical: 1,
        high: 0,
        moderate: 0,
        low: 0,
        issues: [],
      },
    };
    vi.mocked(getPackageStats).mockResolvedValueOnce(realStats as any);

    const result = await packageStatsService.getLightStats(
      "body-parser",
      "runtime",
    );

    expect(getPackageStats).toHaveBeenCalledTimes(2);
    expect(result).toEqual(realStats);
  });

  it("getStats caches successful results (control case)", async () => {
    const realStats = { packageName: "express" };
    vi.mocked(getPackageStats).mockResolvedValueOnce(realStats as any);

    await packageStatsService.getStats("express");
    await packageStatsService.getStats("express");

    expect(getPackageStats).toHaveBeenCalledTimes(1);
  });
});
