/**
 * Internal dependencies.
 */
import { storageService } from "./storage";

/**
 * Storage key for the GitHub Personal Access Token.
 * Stored in chrome.storage.local (not sync) — tokens shouldn't sync across
 * machines, and `local` has a much larger quota.
 */
export const GITHUB_PAT_STORAGE_KEY = "githubPersonalAccessToken";

/**
 * Github Auth Service.
 * Manages the user's GitHub Personal Access Token used to raise GitHub API
 * rate limits from 60 req/hr (anonymous) to 5,000 req/hr (authenticated).
 */
export const githubAuthService = {
  async getToken(): Promise<string | null> {
    const result = await storageService.getLocal(GITHUB_PAT_STORAGE_KEY);
    const token = result[GITHUB_PAT_STORAGE_KEY];
    return typeof token === "string" && token.length > 0 ? token : null;
  },

  async setToken(token: string): Promise<void> {
    await storageService.setLocal({ [GITHUB_PAT_STORAGE_KEY]: token });
  },

  async clearToken(): Promise<void> {
    await storageService.setLocal({ [GITHUB_PAT_STORAGE_KEY]: "" });
  },
};
