/**
 * External dependencies.
 */

// Simple in-memory cache
const cache = new Map<string, any>();

async function fetchWithCache(url: string, options?: RequestInit) {
  if (cache.has(url)) {
    return cache.get(url);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }

  const data = await response.json();
  cache.set(url, data);
  return data;
}

export async function fetchNpmPackage(packageName: string) {
  const url = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;
  return fetchWithCache(url);
}

export async function fetchGithubRepo(owner: string, repo: string) {
  const url = `https://api.github.com/repos/${owner}/${repo}`;
  return fetchWithCache(url);
}

export async function fetchGithubIssues(owner: string, repo: string) {
  // Fetching a sample of open and closed issues/PRs to gauge responsiveness
  const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=100`;
  return fetchWithCache(url);
}

export async function fetchGithubCommits(owner: string, repo: string) {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`;
  return fetchWithCache(url);
}
