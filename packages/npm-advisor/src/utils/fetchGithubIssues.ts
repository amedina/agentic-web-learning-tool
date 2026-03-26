/**
 * Internal dependencies.
 */
import { fetchWithCache } from "./fetchWithCache";

/**
 * Fetch Github Issues.
 */
export async function fetchGithubIssues(owner: string, repo: string) {
  // Fetching a sample of open and closed issues/PRs to gauge responsiveness
  // Using Search API has a 10req/min (600/hr) unauthenticated rate limit, dodging the basic 60/hr Core API limit.
  const query = `repo:${owner}/${repo} is:issue`;
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=100`;
  return fetchWithCache(url);
}
