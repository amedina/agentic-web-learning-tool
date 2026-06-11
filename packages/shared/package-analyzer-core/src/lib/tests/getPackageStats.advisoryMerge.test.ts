/**
 * External dependencies.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Internal dependencies.
 */
import { getPackageStats } from "../getPackageStats";
import { fetchNpmPackage } from "../../utils/fetchNpmPackage";
import { fetchBundlephobiaData } from "../../utils/fetchBundlephobiaData";
import { getDependencyTree } from "../getDependencyTree";
import { fetchModuleReplacements } from "../../utils/fetchModuleReplacements";
import { fetchGithubRepo } from "../../utils/fetchGithubRepo";
import { fetchGithubIssues } from "../../utils/fetchGithubIssues";
import { fetchGithubSecurityAdvisories } from "../../utils/fetchGithubSecurityAdvisories";
import { fetchOsvAdvisories } from "../../utils/fetchOsvAdvisories";
import { parseGithubUrl } from "../../utils/parseGithubUrl";

vi.mock("../../utils/fetchNpmPackage", () => ({ fetchNpmPackage: vi.fn() }));
vi.mock("../../utils/fetchBundlephobiaData", () => ({
  fetchBundlephobiaData: vi.fn(),
}));
vi.mock("../getDependencyTree", () => ({ getDependencyTree: vi.fn() }));
vi.mock("../../utils/fetchModuleReplacements", () => ({
  fetchModuleReplacements: vi.fn(),
}));
vi.mock("../../utils/fetchGithubRepo", () => ({ fetchGithubRepo: vi.fn() }));
vi.mock("../../utils/fetchGithubIssues", () => ({
  fetchGithubIssues: vi.fn(),
}));
vi.mock("../../utils/fetchGithubSecurityAdvisories", () => ({
  fetchGithubSecurityAdvisories: vi.fn(),
}));
vi.mock("../../utils/fetchOsvAdvisories", () => ({
  fetchOsvAdvisories: vi.fn(),
  clearOsvCache: vi.fn(),
}));
vi.mock("../checkLicenseCompatibility", () => ({
  checkLicenseCompatibility: vi.fn(),
}));
vi.mock("../../utils/parseGithubUrl", () => ({ parseGithubUrl: vi.fn() }));

/**
 * Stub the npm registry response with one published version. Keeps the
 * shared per-test setup compact for the merge-focused assertions below.
 */
function defaultNpmData() {
  return {
    description: "demo",
    maintainers: [{ name: "test-user" }],
    "dist-tags": { latest: "1.0.0" },
    versions: {
      "1.0.0": {
        license: "MIT",
        repository: { url: "git+https://github.com/example/demo.git" },
      },
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(fetchNpmPackage).mockResolvedValue(defaultNpmData());
  vi.mocked(fetchBundlephobiaData).mockResolvedValue(null);
  vi.mocked(getDependencyTree).mockResolvedValue({
    name: "demo",
    requestedVersion: "latest",
    dependencies: {},
  });
  vi.mocked(fetchModuleReplacements).mockResolvedValue(null);
  vi.mocked(parseGithubUrl).mockReturnValue({
    owner: "example",
    repo: "demo",
  });
  vi.mocked(fetchGithubRepo).mockResolvedValue({
    repo: { stars: 0, pushedAt: null, updatedAt: null },
  });
  vi.mocked(fetchGithubIssues).mockResolvedValue({
    items: [],
    openTotalCount: 0,
  });
  vi.mocked(fetchGithubSecurityAdvisories).mockResolvedValue([]);
  vi.mocked(fetchOsvAdvisories).mockResolvedValue([]);
});

describe("getPackageStats advisory merge - sources", () => {
  it("flags advisorySources empty when both feeds return nothing", async () => {
    const result = await getPackageStats("demo");
    expect(result?.advisorySources).toEqual(["github"]);
    expect(result?.securityAdvisories).toBeNull();
  });

  it("includes OSV-only findings in the merged severity counts", async () => {
    vi.mocked(fetchOsvAdvisories).mockResolvedValueOnce([
      {
        summary: "OSV-only finding",
        severity: "high",
        html_url: "https://github.com/advisories/GHSA-osv-only",
        ghsa_id: "GHSA-osv-only",
        canonicalIds: ["ghsa-osv-only"],
        vulnerabilities: [
          {
            package: { ecosystem: "npm", name: "demo" },
            vulnerable_version_range: ">= 0.0.0, < 2.0.0",
          },
        ],
      },
    ]);

    const result = await getPackageStats("demo");
    expect(result?.advisorySources).toEqual(["github", "osv"]);
    expect(result?.securityAdvisories?.high).toBe(1);
    expect(result?.securityAdvisories?.issues?.[0]?.summary).toBe(
      "OSV-only finding",
    );
  });

  it("counts GitHub-only findings exactly once", async () => {
    vi.mocked(fetchGithubSecurityAdvisories).mockResolvedValueOnce([
      {
        ghsa_id: "GHSA-gh-only",
        summary: "GitHub-only finding",
        severity: "critical",
        html_url: "https://github.com/advisories/GHSA-gh-only",
        vulnerabilities: [
          {
            package: { ecosystem: "npm", name: "demo" },
            vulnerable_version_range: ">= 0.0.0",
          },
        ],
      },
    ]);

    const result = await getPackageStats("demo");
    expect(result?.advisorySources).toEqual(["github"]);
    expect(result?.securityAdvisories?.critical).toBe(1);
    expect(result?.securityAdvisories?.issues).toHaveLength(1);
  });
});

describe("getPackageStats advisory merge - dedup", () => {
  it("dedups when both feeds report the same advisory by GHSA id", async () => {
    vi.mocked(fetchGithubSecurityAdvisories).mockResolvedValueOnce([
      {
        ghsa_id: "GHSA-shared-id",
        summary: "Both feeds report this",
        severity: "high",
        html_url: "https://github.com/advisories/GHSA-shared-id",
        vulnerabilities: [
          {
            package: { ecosystem: "npm", name: "demo" },
            vulnerable_version_range: ">= 0.0.0",
          },
        ],
      },
    ]);
    vi.mocked(fetchOsvAdvisories).mockResolvedValueOnce([
      {
        summary: "Both feeds report this",
        severity: "high",
        html_url: "https://github.com/advisories/GHSA-shared-id",
        ghsa_id: "GHSA-shared-id",
        canonicalIds: ["ghsa-shared-id", "cve-2024-shared"],
        vulnerabilities: [
          {
            package: { ecosystem: "npm", name: "demo" },
            vulnerable_version_range: ">= 0.0.0, < 2.0.0",
          },
        ],
      },
    ]);

    const result = await getPackageStats("demo");
    expect(result?.advisorySources).toEqual(["github", "osv"]);
    expect(result?.securityAdvisories?.high).toBe(1);
    expect(result?.securityAdvisories?.issues).toHaveLength(1);
  });

  it("dedups via OSV alias mapping when GitHub lists only the GHSA id", async () => {
    vi.mocked(fetchGithubSecurityAdvisories).mockResolvedValueOnce([
      {
        ghsa_id: "GHSA-cross-id",
        identifiers: [
          { type: "GHSA", value: "GHSA-cross-id" },
          { type: "CVE", value: "CVE-2024-9999" },
        ],
        summary: "Cross-identified advisory",
        severity: "moderate",
        html_url: "https://github.com/advisories/GHSA-cross-id",
        vulnerabilities: [
          {
            package: { ecosystem: "npm", name: "demo" },
            vulnerable_version_range: ">= 0.0.0",
          },
        ],
      },
    ]);
    vi.mocked(fetchOsvAdvisories).mockResolvedValueOnce([
      {
        summary: "Cross-identified advisory",
        severity: "moderate",
        html_url: "https://osv.dev/vulnerability/CVE-2024-9999",
        ghsa_id: null,
        // OSV reports this finding only under its CVE alias.
        canonicalIds: ["cve-2024-9999"],
        vulnerabilities: [
          {
            package: { ecosystem: "npm", name: "demo" },
            vulnerable_version_range: ">= 0.0.0, < 2.0.0",
          },
        ],
      },
    ]);

    const result = await getPackageStats("demo");
    expect(result?.securityAdvisories?.moderate).toBe(1);
    expect(result?.securityAdvisories?.issues).toHaveLength(1);
  });
});

describe("getPackageStats advisory merge - failure modes", () => {
  it("falls back to GitHub-only when OSV resolves to []", async () => {
    vi.mocked(fetchGithubSecurityAdvisories).mockResolvedValueOnce([
      {
        ghsa_id: "GHSA-gh-only",
        summary: "GitHub finding",
        severity: "low",
        html_url: "https://github.com/advisories/GHSA-gh-only",
        vulnerabilities: [
          {
            package: { ecosystem: "npm", name: "demo" },
            vulnerable_version_range: ">= 0.0.0",
          },
        ],
      },
    ]);
    vi.mocked(fetchOsvAdvisories).mockResolvedValueOnce([]);

    const result = await getPackageStats("demo");
    expect(result?.advisorySources).toEqual(["github"]);
    expect(result?.securityAdvisories?.low).toBe(1);
  });

  it("flags advisorySources empty when both feeds are unavailable", async () => {
    vi.mocked(fetchGithubSecurityAdvisories).mockRejectedValueOnce(
      new Error("rate limited"),
    );
    vi.mocked(fetchOsvAdvisories).mockResolvedValueOnce([]);

    const result = await getPackageStats("demo");
    // The github push happens only when fetch resolved (or returned null).
    // A throwing fetch leaves us with no GitHub source.
    expect(result?.advisorySources).toEqual([]);
    expect(result?.securityAdvisories).toBeNull();
  });
});

describe("getPackageStats advisory merge - version filter", () => {
  it("excludes OSV findings whose range doesn't cover consideredVersion", async () => {
    vi.mocked(fetchOsvAdvisories).mockResolvedValueOnce([
      {
        summary: "Affects 0.x only",
        severity: "critical",
        html_url: "https://github.com/advisories/GHSA-old",
        ghsa_id: "GHSA-old",
        canonicalIds: ["ghsa-old"],
        vulnerabilities: [
          {
            package: { ecosystem: "npm", name: "demo" },
            vulnerable_version_range: ">= 0.0.0, < 1.0.0",
          },
        ],
      },
    ]);

    // resolvedVersion 1.0.0 → outside the < 1.0.0 range, advisory dropped.
    const result = await getPackageStats("demo", "MIT", {
      resolvedVersion: "1.0.0",
    });
    expect(result?.securityAdvisories).toBeNull();
  });
});
