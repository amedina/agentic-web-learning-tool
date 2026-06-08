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
import { getDependencyTree } from "../../lib/getDependencyTree";
import { fetchModuleReplacements } from "../fetchModuleReplacements";
import { fetchGithubRepo } from "../fetchGithubRepo";
import { fetchGithubIssues } from "../fetchGithubIssues";
import { fetchGithubSecurityAdvisories } from "../fetchGithubSecurityAdvisories";
import { fetchOsvAdvisories } from "../fetchOsvAdvisories";
import { parseGithubUrl } from "../parseGithubUrl";
import { GithubRateLimitError } from "../githubFetch";
import { UpstreamFetchError } from "../fetchWithCache";

vi.mock("../fetchNpmPackage", () => ({ fetchNpmPackage: vi.fn() }));
vi.mock("../fetchBundlephobiaData", () => ({ fetchBundlephobiaData: vi.fn() }));
vi.mock("../../lib/getDependencyTree", () => ({ getDependencyTree: vi.fn() }));
vi.mock("../fetchModuleReplacements", () => ({
  fetchModuleReplacements: vi.fn(),
}));
vi.mock("../fetchGithubRepo", () => ({ fetchGithubRepo: vi.fn() }));
vi.mock("../fetchGithubIssues", () => ({ fetchGithubIssues: vi.fn() }));
vi.mock("../fetchGithubSecurityAdvisories", () => ({
  fetchGithubSecurityAdvisories: vi.fn(),
}));
vi.mock("../fetchOsvAdvisories", () => ({
  fetchOsvAdvisories: vi.fn(),
  clearOsvCache: vi.fn(),
}));
vi.mock("../../lib/checkLicenseCompatibility", () => ({
  checkLicenseCompatibility: vi.fn(),
}));
vi.mock("../parseGithubUrl", () => ({ parseGithubUrl: vi.fn() }));

describe("getPackageStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default OSV mock — every test that doesn't explicitly stub OSV
    // gets an empty list so the merge path is exercised without
    // accidentally adding test-specific advisories.
    vi.mocked(fetchOsvAdvisories).mockResolvedValue([]);
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
    expect(result?.bundleUnavailable).toBe(true); // Flagged so the UI can warn
    expect(result?.dependencyTree).toBeDefined();
    // Since deps === 0, score gets the full deps axis (35).
    expect(result?.score).toBe(35);
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
        return (await import("./fixtures/preferred.json")).default;
      }
      if (type === "micro-utilities") {
        return (await import("./fixtures/micro-utilities.json")).default;
      }
      if (type === "native") {
        return (await import("./fixtures/native.json")).default;
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

    // Rate-limit errors used to be fatal (re-thrown to the caller). Now we
    // flag the partial result with `githubRateLimited: true` and let the UI
    // render whatever non-GitHub signals we have, with warning icons next to
    // the affected fields. The toast still fires from the hook layer.
    it("flags githubRateLimited and leaves advisories null when advisories hits the limit", async () => {
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

      const result = await getPackageStats("foo");

      expect(result).not.toBeNull();
      expect(result?.githubRateLimited).toBe(true);
      expect(result?.securityAdvisories).toBeNull();
      // The non-rate-limited fields stayed populated.
      expect(result?.stars).toBe(100);
    });

    it("flags githubIssuesUnavailable (not githubRateLimited) when the Search API hits the limit", async () => {
      // Issues queries hit GitHub's Search API which has a much tighter
      // per-minute quota (30 req/min even authenticated). We track that
      // separately from the user-actionable Core API rate limit so the
      // toast and global "rate limit reached" warnings don't fire for a
      // routine, non-PAT-able throttle.
      setupNpmDataWithRepo();
      vi.mocked(fetchGithubRepo).mockResolvedValueOnce({
        repo: { stars: 100, pushedAt: "2024-01-01" },
      } as any);
      vi.mocked(fetchGithubIssues).mockRejectedValueOnce(
        new GithubRateLimitError("https://api.github.com/search/issues?q=foo"),
      );
      vi.mocked(fetchGithubSecurityAdvisories).mockResolvedValueOnce([] as any);

      const result = await getPackageStats("foo");

      expect(result).not.toBeNull();
      expect(result?.githubIssuesUnavailable).toBe(true);
      expect(result?.githubRateLimited).toBe(false);
      expect(result?.responsiveness).toBeNull();
    });

    it("flags githubIssuesUnavailable for non-rate-limit Search API errors (secondary rate limit)", async () => {
      // GitHub's secondary rate limit returns 403 without x-ratelimit-remaining:0,
      // so it doesn't qualify as GithubRateLimitError. Any non-rate-limit error
      // from the Search API should still set githubIssuesUnavailable so the widget
      // shows "Couldn't fetch right now" instead of "Not enough data to determine."
      setupNpmDataWithRepo();
      vi.mocked(fetchGithubRepo).mockResolvedValueOnce({
        repo: { stars: 100, pushedAt: "2024-01-01" },
      } as any);
      vi.mocked(fetchGithubIssues).mockRejectedValueOnce(
        new Error("Failed to fetch: Forbidden"),
      );
      vi.mocked(fetchGithubSecurityAdvisories).mockResolvedValueOnce([] as any);

      const result = await getPackageStats("foo");

      expect(result).not.toBeNull();
      expect(result?.githubIssuesUnavailable).toBe(true);
      expect(result?.githubRateLimited).toBe(false);
      expect(result?.responsiveness).toBeNull();
    });

    it("flags githubRateLimited when repo metadata hits the limit", async () => {
      setupNpmDataWithRepo();
      vi.mocked(fetchGithubRepo).mockRejectedValueOnce(
        new GithubRateLimitError("https://ungh.cc/z"),
      );
      vi.mocked(fetchGithubIssues).mockResolvedValueOnce({
        items: [],
        openTotalCount: 0,
      });
      vi.mocked(fetchGithubSecurityAdvisories).mockResolvedValueOnce([] as any);

      const result = await getPackageStats("foo");

      expect(result).not.toBeNull();
      expect(result?.githubRateLimited).toBe(true);
      expect(result?.stars).toBeNull();
      expect(result?.lastCommitDate).toBeNull();
    });

    it("falls back to scanning the readme field when repository.url is missing", async () => {
      // Mirrors the @rtcamp/frappe-ui-react case: no `repository.url` on the
      // registry response, but the readme field carries a github.com URL
      // that uniquely identifies the source. The fallback should recover
      // the repo identity and the GitHub fetchers should still run.
      vi.mocked(fetchNpmPackage).mockResolvedValueOnce({
        maintainers: [{ name: "test" }],
        license: "MIT",
        readme:
          "https://github.com/rtCamp/frappe-ui-react/blob/main/packages/frappe-ui-react/README.md",
      });
      vi.mocked(parseGithubUrl).mockReturnValueOnce({
        owner: "rtCamp",
        repo: "frappe-ui-react",
      });
      vi.mocked(fetchBundlephobiaData).mockResolvedValueOnce(null);
      vi.mocked(getDependencyTree).mockResolvedValueOnce(null as any);
      vi.mocked(fetchModuleReplacements).mockResolvedValue(null);
      vi.mocked(fetchGithubRepo).mockResolvedValueOnce({
        repo: { stars: 42, pushedAt: "2024-06-01" },
      } as any);
      vi.mocked(fetchGithubIssues).mockResolvedValueOnce({
        items: [],
        openTotalCount: 0,
      });
      vi.mocked(fetchGithubSecurityAdvisories).mockResolvedValueOnce([] as any);

      const result = await getPackageStats("@rtcamp/frappe-ui-react");

      expect(result).not.toBeNull();
      expect(result?.githubUrl).toBe(
        "https://github.com/rtCamp/frappe-ui-react",
      );
      expect(result?.stars).toBe(42);
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
      // Non-rate-limit failures don't flip the rate-limit flag.
      expect(result?.githubRateLimited).toBe(false);
    });
  });

  describe("upstream API availability", () => {
    it("leaves bundleUnavailable false when bundlephobia returns no data (benign 404)", async () => {
      vi.mocked(fetchNpmPackage).mockResolvedValueOnce({
        maintainers: [{ name: "test" }],
        license: "MIT",
      });
      // fetchWithCache resolves null for a 404 rather than throwing, so a
      // package simply absent from bundlephobia must not look like an error.
      vi.mocked(fetchBundlephobiaData).mockResolvedValueOnce(null);
      vi.mocked(getDependencyTree).mockResolvedValueOnce(null as any);
      vi.mocked(fetchModuleReplacements).mockResolvedValue(null);

      const result = await getPackageStats("test");

      expect(result).not.toBeNull();
      expect(result?.bundle).toBeNull();
      expect(result?.bundleUnavailable).toBe(false);
    });

    it("flags bundleUnavailable when the bundlephobia request fails", async () => {
      vi.mocked(fetchNpmPackage).mockResolvedValueOnce({
        maintainers: [{ name: "test" }],
        license: "MIT",
      });
      vi.mocked(fetchBundlephobiaData).mockRejectedValueOnce(
        new UpstreamFetchError(
          "https://bundlephobia.com/api/size?package=test",
          429,
          "Too Many Requests",
        ),
      );
      vi.mocked(getDependencyTree).mockResolvedValueOnce(null as any);
      vi.mocked(fetchModuleReplacements).mockResolvedValue(null);

      const result = await getPackageStats("test");

      expect(result).not.toBeNull();
      expect(result?.bundle).toBeNull();
      expect(result?.bundleUnavailable).toBe(true);
    });

    it("translates an npm registry rate-limit into a user-facing error", async () => {
      vi.mocked(fetchNpmPackage).mockRejectedValueOnce(
        new UpstreamFetchError(
          "https://registry.npmjs.org/test",
          429,
          "Too Many Requests",
        ),
      );
      vi.mocked(fetchBundlephobiaData).mockResolvedValueOnce(null);
      vi.mocked(getDependencyTree).mockResolvedValueOnce(null as any);
      vi.mocked(fetchModuleReplacements).mockResolvedValue(null);

      await expect(getPackageStats("test")).rejects.toThrowError(
        /npm registry is rate-limiting/i,
      );
    });
  });
});
