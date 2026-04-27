/**
 * Internal dependencies.
 */
import { githubFetch } from "./githubFetch";

/**
 * Fetch Github Security Advisories.
 */
export async function fetchGithubSecurityAdvisories(
  owner: string,
  repo: string,
) {
  const url = `https://api.github.com/repos/${owner}/${repo}/security-advisories`;
  return githubFetch(url);
}
