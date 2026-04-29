/**
 * Internal dependencies.
 */
import { githubFetch } from "./githubFetch";

/**
 * Fetch Github Issues.
 *
 * Returns both a sample of issues (for responsiveness ratio) and the true
 * total open issues count (via a separate search with `is:open`).
 */
export async function fetchGithubIssues(owner: string, repo: string) {
  // Fetching a sample of open and closed issues/PRs to gauge responsiveness
  // Using Search API has a 10req/min (600/hr) unauthenticated rate limit, dodging the basic 60/hr Core API limit.
  // GitHub Search requires field qualifiers like `repo:` to have unencoded colons/slashes.
  // Only the space separators need encoding (%20). encodeURIComponent would encode `:` and `/`
  // as %3A and %2F, which breaks the qualifier syntax and returns 0 results.
  const sampleUrl = `https://api.github.com/search/issues?q=repo:${owner}/${repo}%20is:issue&per_page=100`;

  // Separate query for the true total open issue count via total_count field.
  const openCountUrl = `https://api.github.com/search/issues?q=repo:${owner}/${repo}%20is:issue%20is:open&per_page=1`;

  const [sampleData, openCountData] = (await Promise.all([
    githubFetch(sampleUrl),
    githubFetch(openCountUrl),
  ])) as [any, any];

  return {
    items: sampleData?.items ?? (Array.isArray(sampleData) ? sampleData : []),
    openTotalCount:
      typeof openCountData?.total_count === "number"
        ? openCountData.total_count
        : null,
  };
}
