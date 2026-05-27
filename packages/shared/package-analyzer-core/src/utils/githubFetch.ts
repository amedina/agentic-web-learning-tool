/**
 * Internal dependencies.
 */
import { LruTtlCache } from "./lruCache";

/**
 * Marker prefix included in error messages so the UI can detect rate-limit
 * failures across the service-worker message boundary (errors are serialised
 * to a string before reaching the sidepanel).
 */
export const GITHUB_RATE_LIMIT_ERROR_MARKER = "GITHUB_RATE_LIMIT";

/**
 * Github Rate Limit Error.
 * Thrown when GitHub responds with a 403/429 caused by rate limiting.
 */
export class GithubRateLimitError extends Error {
  constructor(url: string) {
    super(
      `${GITHUB_RATE_LIMIT_ERROR_MARKER}: GitHub rate limit reached for ${url}`,
    );
    this.name = "GithubRateLimitError";
  }
}

/**
 * Bounded LRU+TTL cache shared across all githubFetch calls, with
 * single-flight semantics so two views fetching the same GitHub URL at
 * the same time share one network request.
 */
const cache = new LruTtlCache<unknown>();

// Default returns null (unauthenticated). Replaced at startup by each
// consumer: Chrome ext via configureGithubAuth({ getToken: () => githubAuthService.getToken() }),
// VS Code ext via vscode.authentication, CLI via $GITHUB_TOKEN.
let getTokenFn: () => Promise<string | null> = () => Promise.resolve(null);

export function configureGithubAuth(options: {
  getToken: () => Promise<string | null>;
}): void {
  getTokenFn = options.getToken;
}

/**
 * GitHub returns 403 with `x-ratelimit-remaining: 0` for the primary REST
 * limit, and 429 for the secondary search limit and abuse detection.
 */
function isRateLimitResponse(response: Response): boolean {
  if (response.status === 429) {
    return true;
  }
  if (response.status === 403) {
    return response.headers.get("x-ratelimit-remaining") === "0";
  }
  return false;
}

/**
 * Github Fetch.
 * Wraps fetch with:
 * - The user's PAT (if configured) as `Authorization: Bearer …`.
 * - GitHub's recommended Accept and API-version headers.
 * - Rate-limit detection that throws `GithubRateLimitError` so the UI can
 *   prompt the user to add a token.
 * - The shared bounded LRU+TTL cache with single-flight semantics.
 *
 * @param url - GitHub REST API URL to fetch.
 * @param signal - Optional {@link AbortSignal}. When it aborts, this
 *   caller's await rejects with the signal's reason; the underlying
 *   shared fetch keeps running so concurrent callers benefit.
 */
export async function githubFetch(
  url: string,
  signal?: AbortSignal,
): Promise<unknown> {
  return cache.getOrFetch(
    url,
    async () => {
      const token = await getTokenFn();
      const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(url, { headers });

      if (isRateLimitResponse(response)) {
        throw new GithubRateLimitError(url);
      }

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }

      return await response.json();
    },
    signal,
  );
}

/**
 * Clear Github Fetch Cache.
 */
export function clearGithubFetchCache(): void {
  cache.clear();
}
