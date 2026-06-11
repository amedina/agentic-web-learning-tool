/**
 * External dependencies.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPackageStats } from "@agentic-web-labs/package-analyzer-core";

/**
 * Internal dependencies.
 *
 * Verifies that the lockfile-derived resolvedVersion learned at PREFETCH
 * time threads through subsequent getStats / getLightStats reads, so a
 * side panel asking about a package opened on a GitHub repo page sees
 * stats for the version installed in that repo, not the latest.
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

/** Wipe the singleton's private caches between tests. */
function freshService() {
  (packageStatsService as any).statsCache = new Map();
  (packageStatsService as any).statsCacheTimestamps = new Map();
  (packageStatsService as any).lightStatsCache = new Map();
  (packageStatsService as any).lightStatsCacheTimestamps = new Map();
  (packageStatsService as any).lastResolvedVersion = new Map();
}

beforeEach(() => {
  vi.clearAllMocks();
  freshService();
  vi.mocked(getPackageStats).mockResolvedValue(null);
});

describe("packageStatsService — resolvedVersion stickiness", () => {
  it("threads resolvedVersion through prefetch", async () => {
    await packageStatsService.prefetch("react", "18.2.0");
    expect(getPackageStats).toHaveBeenCalledWith(
      "react",
      "MIT",
      expect.objectContaining({ resolvedVersion: "18.2.0" }),
    );
  });

  it("re-uses the prefetched resolvedVersion on a later getStats", async () => {
    await packageStatsService.prefetch("react", "18.2.0");
    vi.mocked(getPackageStats).mockClear();
    freshCache();
    await packageStatsService.getStats("react");
    expect(getPackageStats).toHaveBeenCalledWith(
      "react",
      "MIT",
      expect.objectContaining({ resolvedVersion: "18.2.0" }),
    );
  });

  it("re-uses the prefetched resolvedVersion on a later getLightStats", async () => {
    await packageStatsService.prefetch("react", "18.2.0");
    vi.mocked(getPackageStats).mockClear();
    freshCache();
    await packageStatsService.getLightStats("react", "runtime");
    expect(getPackageStats).toHaveBeenCalledWith(
      "react",
      "MIT",
      expect.objectContaining({
        resolvedVersion: "18.2.0",
        includeDependencyTree: false,
      }),
    );
  });

  it("passes undefined when no PREFETCH happened (latest fallback)", async () => {
    await packageStatsService.getStats("react");
    expect(getPackageStats).toHaveBeenCalledWith(
      "react",
      "MIT",
      expect.objectContaining({ resolvedVersion: undefined }),
    );
  });

  it("setResolvedVersion(name, undefined) clears prior stickiness", async () => {
    packageStatsService.setResolvedVersion("react", "18.2.0");
    packageStatsService.setResolvedVersion("react", undefined);
    await packageStatsService.getStats("react");
    expect(getPackageStats).toHaveBeenCalledWith(
      "react",
      "MIT",
      expect.objectContaining({ resolvedVersion: undefined }),
    );
  });
});

/**
 * Drop the result caches but preserve `lastResolvedVersion`, mirroring
 * what happens when the side panel asks for a fresh fetch after a
 * PREFETCH already stored a resolvedVersion.
 */
function freshCache() {
  (packageStatsService as any).statsCache = new Map();
  (packageStatsService as any).statsCacheTimestamps = new Map();
  (packageStatsService as any).lightStatsCache = new Map();
  (packageStatsService as any).lightStatsCacheTimestamps = new Map();
}
