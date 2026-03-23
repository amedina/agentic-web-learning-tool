/**
 * Internal dependencies.
 */
import { fetchWithCache } from "./fetchWithCache";

/**
 * Fetch Github Security Advisories.
 */
export async function fetchGithubSecurityAdvisories(
  owner: string,
  repo: string,
) {
  const url = `https://api.github.com/repos/${owner}/${repo}/security-advisories`;
  return fetchWithCache(url);
}
