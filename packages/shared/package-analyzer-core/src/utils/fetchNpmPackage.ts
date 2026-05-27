/**
 * Internal dependencies.
 */
import { fetchWithCache } from "./fetchWithCache";

/**
 * Fetch the full packument for an npm package. The packument carries
 * every published version, dist-tags, and per-version metadata
 * (`repository`, `license`, etc.) that `getPackageStats` reads.
 *
 * @param packageName - Scoped or unscoped npm package name.
 * @param signal - Optional abort signal that cancels this caller's
 *   await without killing the shared underlying fetch.
 */
export async function fetchNpmPackage(
  packageName: string,
  signal?: AbortSignal,
) {
  const url = `https://registry.npmjs.org/${packageName}`;
  return fetchWithCache(url, undefined, signal);
}
