/**
 * External dependencies.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Internal dependencies.
 */
import { githubAuthService, GITHUB_PAT_STORAGE_KEY } from "../githubAuth";
import { storageService } from "../storage";

vi.mock("../storage", () => ({
  storageService: {
    getLocal: vi.fn(),
    setLocal: vi.fn(),
  },
}));

describe("githubAuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no token is stored", async () => {
    vi.mocked(storageService.getLocal).mockResolvedValueOnce({});

    const token = await githubAuthService.getToken();

    expect(storageService.getLocal).toHaveBeenCalledWith(
      GITHUB_PAT_STORAGE_KEY,
    );
    expect(token).toBeNull();
  });

  it("returns null when stored value is an empty string", async () => {
    vi.mocked(storageService.getLocal).mockResolvedValueOnce({
      [GITHUB_PAT_STORAGE_KEY]: "",
    });

    const token = await githubAuthService.getToken();

    expect(token).toBeNull();
  });

  it("returns the token when one is stored", async () => {
    vi.mocked(storageService.getLocal).mockResolvedValueOnce({
      [GITHUB_PAT_STORAGE_KEY]: "ghp_abc123",
    });

    const token = await githubAuthService.getToken();

    expect(token).toBe("ghp_abc123");
  });

  it("setToken writes the token under the expected key", async () => {
    vi.mocked(storageService.setLocal).mockResolvedValueOnce(undefined);

    await githubAuthService.setToken("ghp_xyz");

    expect(storageService.setLocal).toHaveBeenCalledWith({
      [GITHUB_PAT_STORAGE_KEY]: "ghp_xyz",
    });
  });

  it("clearToken writes an empty string under the expected key", async () => {
    vi.mocked(storageService.setLocal).mockResolvedValueOnce(undefined);

    await githubAuthService.clearToken();

    expect(storageService.setLocal).toHaveBeenCalledWith({
      [GITHUB_PAT_STORAGE_KEY]: "",
    });
  });
});
