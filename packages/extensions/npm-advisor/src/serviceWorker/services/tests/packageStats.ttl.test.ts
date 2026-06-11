/**
 * External dependencies.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getPackageStats } from "@agentic-web-labs/package-analyzer-core";

/**
 * Internal dependencies.
 *
 * Coverage for the 24-hour TTL on the in-memory stats caches. The behaviour
 * we care about: a cached package's stats become stale after `STATS_CACHE_TTL_MS`
 * and the next read goes back to the network, even though the service worker
 * itself stayed alive that whole time. Without the TTL, a long-lived service
 * worker would happily serve day-old data forever.
 */
import { packageStatsService } from "../packageStats";

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

/** Resets the singleton's private caches between tests. */
function freshService() {
  (packageStatsService as any).statsCache = new Map();
  (packageStatsService as any).statsCacheTimestamps = new Map();
  (packageStatsService as any).lightStatsCache = new Map();
  (packageStatsService as any).lightStatsCacheTimestamps = new Map();
}

const TTL_MS = 24 * 60 * 60 * 1000;

describe("packageStatsService — 24h TTL", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    freshService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("getStats serves cached stats while inside the TTL window", async () => {
    const realStats = { packageName: "express" };
    vi.mocked(getPackageStats).mockResolvedValueOnce(realStats as any);

    await packageStatsService.getStats("express");

    // Just under the TTL: still a hit.
    vi.setSystemTime(Date.now() + TTL_MS - 1000);
    await packageStatsService.getStats("express");

    expect(getPackageStats).toHaveBeenCalledTimes(1);
  });

  it("getStats re-fetches after the TTL elapses", async () => {
    const day1Stats = { packageName: "express", downloads: 100 };
    const day2Stats = { packageName: "express", downloads: 200 };
    vi.mocked(getPackageStats)
      .mockResolvedValueOnce(day1Stats as any)
      .mockResolvedValueOnce(day2Stats as any);

    const first = await packageStatsService.getStats("express");
    expect(first).toEqual(day1Stats);

    // Advance past the TTL — the cached entry must be evicted.
    vi.setSystemTime(Date.now() + TTL_MS + 1000);

    const second = await packageStatsService.getStats("express");
    expect(second).toEqual(day2Stats);
    expect(getPackageStats).toHaveBeenCalledTimes(2);
  });

  it("getLightStats re-fetches after the TTL elapses", async () => {
    const day1Stats = { packageName: "body-parser", downloads: 50 };
    const day2Stats = { packageName: "body-parser", downloads: 60 };
    vi.mocked(getPackageStats)
      .mockResolvedValueOnce(day1Stats as any)
      .mockResolvedValueOnce(day2Stats as any);

    await packageStatsService.getLightStats("body-parser", "runtime");

    vi.setSystemTime(Date.now() + TTL_MS + 1000);

    const second = await packageStatsService.getLightStats(
      "body-parser",
      "runtime",
    );
    expect(second).toEqual(day2Stats);
    expect(getPackageStats).toHaveBeenCalledTimes(2);
  });

  it("prefetch re-runs when the cached entry has aged past the TTL", async () => {
    const day1Stats = { packageName: "lodash" };
    const day2Stats = { packageName: "lodash" };
    vi.mocked(getPackageStats)
      .mockResolvedValueOnce(day1Stats as any)
      .mockResolvedValueOnce(day2Stats as any);

    await packageStatsService.prefetch("lodash");
    // Drain the first prefetch promise.
    await packageStatsService.getStats("lodash");

    vi.setSystemTime(Date.now() + TTL_MS + 1000);

    await packageStatsService.prefetch("lodash");
    await packageStatsService.getStats("lodash");

    expect(getPackageStats).toHaveBeenCalledTimes(2);
  });
});
