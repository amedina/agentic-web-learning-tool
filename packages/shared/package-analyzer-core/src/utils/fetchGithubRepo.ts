/**
 * Internal dependencies.
 */
import { fetchWithCache } from "./fetchWithCache";

/**
 * Fetch basic repository health indicators via ungh.cc (a GitHub
 * mirror that lets us dodge the 60-req/hr unauthenticated REST limit).
 *
 * @param owner - GitHub owner / organisation.
 * @param repo - Repository name.
 * @param signal - Optional abort signal.
 */
export async function fetchGithubRepo(
  owner: string,
  repo: string,
  signal?: AbortSignal,
) {
  const url = `https://ungh.cc/repos/${owner}/${repo}`;
  return fetchWithCache(url, undefined, signal);
}
