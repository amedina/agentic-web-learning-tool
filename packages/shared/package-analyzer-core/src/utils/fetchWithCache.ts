// Simple in-memory cache
const cache = new Map<string, any>();

/**
 * Fetch With Cache.
 */
export async function fetchWithCache(url: string, options?: RequestInit) {
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

/**
 * Clear Cache.
 */
export function clearCache() {
  cache.clear();
}
