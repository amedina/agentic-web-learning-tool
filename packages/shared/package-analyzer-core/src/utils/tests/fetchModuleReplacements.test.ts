/**
 * External dependencies.
 */
import { describe, it, expect, vi } from "vitest";

/**
 * Internal dependencies.
 */
import { fetchModuleReplacements } from "../fetchModuleReplacements";
import { fetchWithCache } from "../fetchWithCache";

vi.mock("../fetchWithCache", () => ({
  fetchWithCache: vi.fn(),
}));

describe("fetchModuleReplacements", () => {
  it("should call fetchWithCache with the correct module replacements URL", async () => {
    const mockData = { version: 1 };
    vi.mocked(fetchWithCache).mockResolvedValueOnce(mockData);

    const result = await fetchModuleReplacements("native");

    expect(fetchWithCache).toHaveBeenCalledWith(
      "https://raw.githubusercontent.com/es-tooling/module-replacements/main/manifests/native.json",
    );
    expect(result).toEqual(mockData);
  });
});
