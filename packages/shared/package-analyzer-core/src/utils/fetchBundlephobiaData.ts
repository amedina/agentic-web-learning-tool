/**
 * Internal dependencies.
 */
import { fetchWithCache } from "./fetchWithCache";

/**
 * Fetch bundle-size data from bundlephobia for a package. When `version`
 * is provided the API returns metrics for that specific version; otherwise
 * it returns metrics for the latest published version. Used by the
 * Bundle Size scoring axis and the Bundle widget.
 *
 * @param packageName - The npm package name (scoped or unscoped).
 * @param version - Optional installed version to query. Pass it when the
 *   caller has resolved the version from a lockfile so bundle metrics
 *   reflect what the user actually ships, not whatever is the latest
 *   release.
 */
export async function fetchBundlephobiaData(
  packageName: string,
  version?: string,
  signal?: AbortSignal,
) {
  const pkg = version ? `${packageName}@${version}` : packageName;
  const url = `https://bundlephobia.com/api/size?package=${encodeURIComponent(pkg)}&record=true`;
  return fetchWithCache(url, undefined, signal);
}
