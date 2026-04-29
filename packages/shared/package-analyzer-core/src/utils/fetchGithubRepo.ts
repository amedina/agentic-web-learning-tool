/**
 * Internal dependencies.
 */
import { fetchWithCache } from "./fetchWithCache";

/**
 * Fetch Github Repo.
 */
export async function fetchGithubRepo(owner: string, repo: string) {
  // Use ungh.cc to bypass strict Github API rate limits for basic repository health indicators
  const url = `https://ungh.cc/repos/${owner}/${repo}`;
  return fetchWithCache(url);
}
