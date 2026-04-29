/**
 * External dependencies.
 */
import { describe, it, expect, vi } from "vitest";

/**
 * Internal dependencies.
 */
import { fetchNpmPackage } from "../fetchNpmPackage";
import { fetchWithCache } from "../fetchWithCache";

vi.mock("../fetchWithCache", () => ({
  fetchWithCache: vi.fn(),
}));

describe("fetchNpmPackage", () => {
  it("should map package name to correct npm registry URL", async () => {
    const mockData = { name: "react" };
    vi.mocked(fetchWithCache).mockResolvedValueOnce(mockData);

    const result = await fetchNpmPackage("react");

    expect(fetchWithCache).toHaveBeenCalledWith(
      "https://registry.npmjs.org/react",
    );
    expect(result).toEqual(mockData);
  });
});
