/**
 * Internal dependencies.
 */
import { githubFetch } from "./githubFetch";

/**
 * Fetch every security advisory filed against the given repo via the
 * GitHub `/security-advisories` REST endpoint.
 *
 * @param owner - GitHub owner / organisation.
 * @param repo - Repository name.
 * @param signal - Optional abort signal.
 */
export async function fetchGithubSecurityAdvisories(
  owner: string,
  repo: string,
  signal?: AbortSignal,
) {
  const url = `https://api.github.com/repos/${owner}/${repo}/security-advisories`;
  return githubFetch(url, signal);
}
