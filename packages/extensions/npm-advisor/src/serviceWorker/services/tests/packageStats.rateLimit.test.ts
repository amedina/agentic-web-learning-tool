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
 * The fix is two-fold:
 * 1. `getPackageStats` re-throws GithubRateLimitError instead of swallowing
 *    it into a partial result.
 * 2. `packageStatsService` deletes the cache key on any thrown error, so the
 *    next call retries from scratch.
 *
 * These tests exercise the full SW-side path:
 *   getStats → getPackageStats (mocked) → cache state → second getStats call.
 */
import { packageStatsService } from "../packageStats";
import { getPackageStats } from "../../../lib";
import { GithubRateLimitError } from "../../../utils/githubFetch";

vi.mock("../../../lib", async () => {
  const actual =
    await vi.importActual<typeof import("../../../lib")>("../../../lib");
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

  it("getStats does not cache a rate-limit failure (next call retries)", async () => {
    vi.mocked(getPackageStats).mockRejectedValueOnce(
      new GithubRateLimitError("https://api.github.com/x"),
    );

    await expect(
      packageStatsService.getStats("express"),
    ).rejects.toBeInstanceOf(GithubRateLimitError);

    // The cache must be empty so the next call goes through to the network.
    expect((packageStatsService as any).statsCache.has("express")).toBe(false);

    // Now simulate the user adding a token (or the limit resetting). The next
    // getStats call should hit getPackageStats again, not return stale data.
    const realStats = {
      packageName: "express",
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

  it("getLightStats does not cache a rate-limit failure (next call retries)", async () => {
    vi.mocked(getPackageStats).mockRejectedValueOnce(
      new GithubRateLimitError("https://api.github.com/y"),
    );

    await expect(
      packageStatsService.getLightStats("body-parser", "runtime"),
    ).rejects.toBeInstanceOf(GithubRateLimitError);

    expect(
      (packageStatsService as any).lightStatsCache.has("body-parser::runtime"),
    ).toBe(false);

    const realStats = {
      packageName: "body-parser",
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
