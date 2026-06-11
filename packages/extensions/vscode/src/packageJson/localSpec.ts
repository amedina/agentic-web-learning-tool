/**
 * A dependency version spec that points at a package on the user's own
 * machine rather than the npm registry. These never have published stats,
 * so the hover and other surfaces treat them specially.
 */
export type LocalPackageKind = "workspace" | "file" | "link" | "portal";

/**
 * Maps each local-package protocol prefix (as it appears in package.json)
 * to its kind. Mirrors the local/non-registry protocols already enumerated
 * in diagnostics/rules.ts#extractMajor, narrowed to the ones that resolve
 * to a package on disk (git+/github:/http(s) deps are remote, not local).
 */
const LOCAL_SPEC_PREFIXES: ReadonlyArray<readonly [string, LocalPackageKind]> =
  [
    ["workspace:", "workspace"],
    ["file:", "file"],
    ["link:", "link"],
    ["portal:", "portal"],
  ];

/**
 * Classifies a package.json version spec as a local-package reference,
 * returning its kind, or null for registry/git/url specs. Used to
 * short-circuit the hover before any registry lookup so local packages
 * never trigger the "Loading…" flicker that a doomed network fetch causes.
 */
export function classifyLocalPackageSpec(
  version: string,
): LocalPackageKind | null {
  if (!version || typeof version !== "string") {
    return null;
  }
  const trimmed = version.trim();
  for (const [prefix, kind] of LOCAL_SPEC_PREFIXES) {
    if (trimmed.startsWith(prefix)) {
      return kind;
    }
  }
  return null;
}
