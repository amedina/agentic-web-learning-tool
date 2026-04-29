/**
 * Internal dependencies.
 */
import { fetchWithCache } from "./fetchWithCache";

/**
 * Fetch Npm Package.
 */
export async function fetchNpmPackage(packageName: string) {
  const url = `https://registry.npmjs.org/${packageName}`;
  return fetchWithCache(url);
}
