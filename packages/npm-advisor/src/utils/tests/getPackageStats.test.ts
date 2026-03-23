/**
 * External dependencies.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Internal dependencies.
 */
import { getPackageStats } from "../getPackageStats";
import { fetchNpmPackage } from "../fetchNpmPackage";
import { fetchBundlephobiaData } from "../fetchBundlephobiaData";
import { getDependencyTree } from "../getDependencyTree";
import { fetchModuleReplacements } from "../fetchModuleReplacements";

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
});
