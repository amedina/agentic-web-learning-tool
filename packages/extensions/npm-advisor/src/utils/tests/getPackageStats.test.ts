/**
 * External dependencies.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Internal dependencies.
 */
import { getPackageStats } from "../../lib/getPackageStats";
import { fetchNpmPackage } from "../fetchNpmPackage";
import { fetchBundlephobiaData } from "../fetchBundlephobiaData";
import { getDependencyTree } from "../getDependencyTree";
import { fetchModuleReplacements } from "../fetchModuleReplacements";
import { fetchGithubRepo } from "../fetchGithubRepo";
import { fetchGithubIssues } from "../fetchGithubIssues";
import { fetchGithubSecurityAdvisories } from "../fetchGithubSecurityAdvisories";
import { parseGithubUrl } from "../parseGithubUrl";
import { GithubRateLimitError } from "../githubFetch";

vi.mock("../fetchNpmPackage", () => ({ fetchNpmPackage: vi.fn() }));
vi.mock("../fetchBundlephobiaData", () => ({ fetchBundlephobiaData: vi.fn() }));
vi.mock("../getDependencyTree", () => ({ getDependencyTree: vi.fn() }));
vi.mock("../fetchModuleReplacements", () => ({
  fetchModuleReplacements: vi.fn(),
}));
vi.mock("../fetchGithubRepo", () => ({ fetchGithubRepo: vi.fn() }));
vi.mock("../fetchGithubIssues", () => ({ fetchGithubIssues: vi.fn() }));
vi.mock("../fetchGithubSecurityAdvisories", () => ({
  fetchGithubSecurityAdvisories: vi.fn(),
}));
vi.mock("../checkLicenseCompatibility", () => ({
  checkLicenseCompatibility: vi.fn(),
}));
vi.mock("../parseGithubUrl", () => ({ parseGithubUrl: vi.fn() }));

describe("getPackageStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null if npm data fetch fails", async () => {
    vi.mocked(fetchNpmPackage).mockResolvedValueOnce(null);
    vi.mocked(fetchBundlephobiaData).mockRejectedValueOnce(new Error("err"));
    vi.mocked(getDependencyTree).mockRejectedValueOnce(new Error("err"));
    vi.mocked(fetchModuleReplacements).mockRejectedValue(new Error("err"));

    const result = await getPackageStats("unknown-pkg");
    expect(result).toBeNull();
  });

  it("should return null when the package is not published on npmjs.com", async () => {
    vi.mocked(fetchNpmPackage).mockResolvedValueOnce(null);
    vi.mocked(fetchBundlephobiaData).mockResolvedValueOnce(null);
    vi.mocked(getDependencyTree).mockResolvedValueOnce(null as any);
    vi.mocked(fetchModuleReplacements).mockResolvedValue(null);

    const result = await getPackageStats("floating-ui");
    expect(result).toBeNull();
  });

  it("should return stats gracefully handling partial data failures", async () => {
    vi.mocked(fetchNpmPackage).mockResolvedValueOnce({
      maintainers: [{ name: "test" }],
      license: "MIT",
    });
    vi.mocked(fetchBundlephobiaData).mockRejectedValueOnce(
      new Error("Timeout"),
    );
    vi.mocked(getDependencyTree).mockResolvedValueOnce({
      name: "test",
      requestedVersion: "latest",
      dependencies: {},
    });
    vi.mocked(fetchModuleReplacements).mockResolvedValue(null);

    const result = await getPackageStats("test");

    expect(result).toBeDefined();
    expect(result?.packageName).toBe("test");
    expect(result?.collaboratorsCount).toBe(1);
    expect(result?.bundle).toBeNull(); // Because it failed
    expect(result?.dependencyTree).toBeDefined();
    // Since deps === 0, score gets +30
    expect(result?.score).toBe(30);
  });

  it("should extract alternative recommendations correctly from module-replacements using dummy fixtures", async () => {
    vi.mocked(fetchNpmPackage).mockResolvedValueOnce({
      maintainers: [{ name: "test-user" }],
      license: "MIT",
    });
    vi.mocked(fetchBundlephobiaData).mockResolvedValueOnce(null);
    vi.mocked(getDependencyTree).mockResolvedValueOnce({
      name: "axios",
      requestedVersion: "latest",
      dependencies: {},
    });

    // Mock the implementations with our fixtures
    vi.mocked(fetchModuleReplacements).mockImplementation(async (type) => {
      if (type === "preferred") {
        return await import("./fixtures/preferred.json");
      }
      if (type === "micro-utilities") {
        return await import("./fixtures/micro-utilities.json");
      }
      if (type === "native") {
        return await import("./fixtures/native.json");
      }
      return null;
    });

    // Test axios which only exists in preferred
    const axiosStats = await getPackageStats("axios");
    expect(axiosStats).toBeDefined();
    expect(axiosStats?.recommendations.preferredReplacements).toBeDefined();
    // axios should have 3 recommendations from preferred.json: fetch, ofetch, ky
    expect(axiosStats?.recommendations.preferredReplacements?.length).toBe(3);
    expect(axiosStats?.recommendations.preferredReplacements?.[0].id).toBe(
      "fetch",
    );
    expect(axiosStats?.recommendations.preferredReplacements?.[1].id).toBe(
      "ofetch",
    );

    // Test node-fetch which exists in native
    vi.mocked(fetchNpmPackage).mockResolvedValueOnce({
      maintainers: [{ name: "test" }],
      license: "MIT",
    });
    vi.mocked(fetchBundlephobiaData).mockResolvedValueOnce(null);
    vi.mocked(getDependencyTree).mockResolvedValueOnce(null as any);
    const nodeFetchStats = await getPackageStats("node-fetch");
    expect(nodeFetchStats?.recommendations.nativeReplacements).toBeDefined();
    expect(nodeFetchStats?.recommendations.nativeReplacements?.[0].id).toBe(
      "fetch",
    );

    // Test lodash.isstring which exists in micro-utilities
    vi.mocked(fetchNpmPackage).mockResolvedValueOnce({
      maintainers: [{ name: "test" }],
      license: "MIT",
    });
    vi.mocked(fetchBundlephobiaData).mockResolvedValueOnce(null);
    vi.mocked(getDependencyTree).mockResolvedValueOnce(null as any);
    const lodashStats = await getPackageStats("lodash.isstring");
    expect(lodashStats?.recommendations.microUtilityReplacements).toBeDefined();
    expect(lodashStats?.recommendations.microUtilityReplacements?.[0].id).toBe(
      "snippet::is-string",
    );
    // Ensure description defaults logic is present in the mocked data
    expect(
      lodashStats?.recommendations.microUtilityReplacements?.[0].description,
    ).toContain("typeof val ===");
  });

  describe("GitHub rate-limit handling", () => {
    // Configure the GitHub branch so the three GitHub fetchers actually run.
    function setupNpmDataWithRepo() {
      vi.mocked(fetchNpmPackage).mockResolvedValueOnce({
        maintainers: [{ name: "test" }],
        license: "MIT",
        repository: { url: "git+https://github.com/foo/bar.git" },
      });
      vi.mocked(parseGithubUrl).mockReturnValueOnce({
        owner: "foo",
        repo: "bar",
      });
      vi.mocked(fetchBundlephobiaData).mockResolvedValueOnce(null);
      vi.mocked(getDependencyTree).mockResolvedValueOnce(null as any);
      vi.mocked(fetchModuleReplacements).mockResolvedValue(null);
    }

    it("rejects with GithubRateLimitError when advisories hits the limit", async () => {
      setupNpmDataWithRepo();
      vi.mocked(fetchGithubRepo).mockResolvedValueOnce({
        repo: { stars: 100, pushedAt: "2024-01-01" },
      } as any);
      vi.mocked(fetchGithubIssues).mockResolvedValueOnce({
        items: [],
        openTotalCount: 0,
      });
      vi.mocked(fetchGithubSecurityAdvisories).mockRejectedValueOnce(
        new GithubRateLimitError("https://api.github.com/x"),
      );

      // Critical: must reject, NOT resolve to a partial PackageStats with
      // securityAdvisories: null. Caching that partial would cause the bug
      // where a re-load shows fewer vulnerabilities than the first load.
      await expect(getPackageStats("foo")).rejects.toBeInstanceOf(
        GithubRateLimitError,
      );
    });

    it("rejects with GithubRateLimitError when issues hits the limit", async () => {
      setupNpmDataWithRepo();
      vi.mocked(fetchGithubRepo).mockResolvedValueOnce({
        repo: { stars: 100, pushedAt: "2024-01-01" },
      } as any);
      vi.mocked(fetchGithubIssues).mockRejectedValueOnce(
        new GithubRateLimitError("https://api.github.com/y"),
      );
      vi.mocked(fetchGithubSecurityAdvisories).mockResolvedValueOnce([] as any);

      await expect(getPackageStats("foo")).rejects.toBeInstanceOf(
        GithubRateLimitError,
      );
    });

    it("rejects with GithubRateLimitError when repo metadata hits the limit", async () => {
      setupNpmDataWithRepo();
      vi.mocked(fetchGithubRepo).mockRejectedValueOnce(
        new GithubRateLimitError("https://ungh.cc/z"),
      );
      vi.mocked(fetchGithubIssues).mockResolvedValueOnce({
        items: [],
        openTotalCount: 0,
      });
      vi.mocked(fetchGithubSecurityAdvisories).mockResolvedValueOnce([] as any);

      await expect(getPackageStats("foo")).rejects.toBeInstanceOf(
        GithubRateLimitError,
      );
    });

    it("still returns partial stats for non-rate-limit GitHub errors", async () => {
      setupNpmDataWithRepo();
      vi.mocked(fetchGithubRepo).mockResolvedValueOnce({
        repo: { stars: 100, pushedAt: "2024-01-01" },
      } as any);
      vi.mocked(fetchGithubIssues).mockResolvedValueOnce({
        items: [],
        openTotalCount: 0,
      });
      // A non-rate-limit failure (network blip, 5xx, etc.) should be
      // swallowed so we still return what we have.
      vi.mocked(fetchGithubSecurityAdvisories).mockRejectedValueOnce(
        new Error("Network error"),
      );

      const result = await getPackageStats("foo");

      expect(result).not.toBeNull();
      expect(result?.securityAdvisories).toBeNull();
      expect(result?.stars).toBe(100);
    });
  });
});
