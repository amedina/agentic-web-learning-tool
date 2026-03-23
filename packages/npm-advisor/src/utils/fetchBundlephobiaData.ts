/**
 * Internal dependencies.
 */
import { fetchWithCache } from "./fetchWithCache";

/**
 * Fetch Bundlephobia Data.
 */
export async function fetchBundlephobiaData(packageName: string) {
  const url = `https://bundlephobia.com/api/size?package=${encodeURIComponent(packageName)}&record=true`;
  return fetchWithCache(url);
}
