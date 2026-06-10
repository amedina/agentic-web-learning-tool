/**
 * External dependencies.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPackageStats } from "@agentic-web-labs/package-analyzer-core";

/**
 * Internal dependencies.
 *
 * Coverage for `getStatsResilient`: the resilient read used by the GET_STATS
 * handler. When the live fetch fails because every registry is rate-limited or
 * unreachable, it should fall back to the persistent last-resort cache and flag
 * the result stale, rather than surfacing a hard error.
 */
import { packageStatsService } from "../packageStats";
import { persistentStatsCache } from "../persistentStatsCache";

vi.mock("@agentic-web-labs/package-analyzer-core", async () => {
  const actual = await vi.importActual<
    typeof import("@agentic-web-labs/package-analyzer-core")
  >("@agentic-web-labs/package-analyzer-core");
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

vi.mock("../persistentStatsCache", () => ({
  persistentStatsCache: {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn(),
  },
}));

/** Resets the singleton's private caches between tests. */
function freshService() {
  (packageStatsService as any).statsCache = new Map();
  (packageStatsService as any).statsCacheTimestamps = new Map();
  (packageStatsService as any).lightStatsCache = new Map();
  (packageStatsService as any).lightStatsCacheTimestamps = new Map();
}

describe("packageStatsService — getStatsResilient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    freshService();
  });

  it("returns fresh stats and writes them through to the persistent cache", async () => {
    const realStats = { packageName: "express", githubRateLimited: false };
    vi.mocked(getPackageStats).mockResolvedValueOnce(realStats as any);

    const result = await packageStatsService.getStatsResilient("express");

    expect(result).toEqual({ stats: realStats, stale: false });
    expect(persistentStatsCache.set).toHaveBeenCalledWith("express", realStats);
  });

  it("serves the saved copy flagged stale when the live fetch fails", async () => {
    vi.mocked(getPackageStats).mockRejectedValueOnce(
      new Error("UPSTREAM_RATE_LIMIT: every registry is rate-limited"),
    );
    const savedAt = 1_700_000_000_000;
    vi.mocked(persistentStatsCache.get).mockResolvedValueOnce({
      stats: { packageName: "express" } as any,
      savedAt,
    });

    const result = await packageStatsService.getStatsResilient("express");

    expect(result).toEqual({
      stats: { packageName: "express" },
      stale: true,
      staleAt: savedAt,
    });
  });

  it("rethrows when the live fetch fails and nothing is saved", async () => {
    const error = new Error("every registry is unreachable");
    vi.mocked(getPackageStats).mockRejectedValueOnce(error);
    vi.mocked(persistentStatsCache.get).mockResolvedValueOnce(null);

    await expect(packageStatsService.getStatsResilient("express")).rejects.toBe(
      error,
    );
  });
});
