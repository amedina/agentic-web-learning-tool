/**
 * Internal dependencies.
 */
import { fetchFromRegistry } from "./registryFetch";

/**
 * Fetch the full packument for an npm package. The packument carries
 * every published version, dist-tags, and per-version metadata
 * (`repository`, `license`, etc.) that `getPackageStats` reads.
 *
 * Goes through {@link fetchFromRegistry}, so a rate-limited or unreachable
 * registry.npmjs.org transparently falls back to a mirror that serves the
 * same packument.
 *
 * @param packageName - Scoped or unscoped npm package name.
 * @param signal - Optional abort signal that cancels this caller's
 *   await without killing the shared underlying fetch.
 */
export async function fetchNpmPackage(
  packageName: string,
  signal?: AbortSignal,
) {
  return fetchFromRegistry(`/${packageName}`, signal);
}
