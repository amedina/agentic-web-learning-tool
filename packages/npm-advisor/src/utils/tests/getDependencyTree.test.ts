/**
 * External dependencies.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Internal dependencies.
 */
import { getDependencyTree } from "../getDependencyTree";
import { fetchWithCache } from "../fetchWithCache";

vi.mock("../fetchWithCache", () => ({
  fetchWithCache: vi.fn(),
}));

describe("getDependencyTree", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a truncated tree if max depth or already visited", async () => {
    const result = await getDependencyTree(
      "react",
      "latest",
      new Set(["react"]),
    );
    expect(result._truncated).toBe(true);
    expect(result.dependencies).toEqual({});
  });

  it("should fetch and resolve dependencies correctly without infinite loops", async () => {
    // mock react -> 'loose-envify' (pretend)
    vi.mocked(fetchWithCache).mockImplementation(async (url) => {
      if (url.includes("react/latest")) {
        return { version: "18.0.0", dependencies: { "loose-envify": "1.0.0" } };
      }
      if (url.includes("loose-envify/latest")) {
        return { version: "1.0.0", dependencies: {} };
      }
      return null;
    });

    const result = await getDependencyTree("react");

    expect(result.resolvedVersion).toBe("18.0.0");
    expect(result.dependencies["loose-envify"]).toBeDefined();
    expect(result.dependencies["loose-envify"].resolvedVersion).toBe("1.0.0");
  });

  it("should handle fetch errors gracefully", async () => {
    vi.mocked(fetchWithCache).mockResolvedValueOnce(null);

    const result = await getDependencyTree("unknown-package");
    expect(result.error).toBe(
      "Failed to fetch package data for unknown-package",
    );
  });
});
