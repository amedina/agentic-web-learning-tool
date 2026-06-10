/**
 * The three package.json dependency sections Project Health rolls up.
 * This is the manifest section name, distinct from analyzer-core's
 * `DependencyCategory` ("runtime" | "dev" | "unknown").
 */
export type ManifestSection =
  | "dependencies"
  | "devDependencies"
  | "peerDependencies";

/**
 * One declared dependency from a package.json, with the section it came
 * from and the raw version range as written in the manifest.
 */
export interface ManifestDependency {
  name: string;
  category: ManifestSection;
  /** Raw range as written, e.g. "^4.17.0", "*", "workspace:*". */
  range: string;
}

/**
 * A single package.json reduced to the data Project Health needs: its
 * identity and its flattened dependency list across all three sections.
 */
export interface ParsedManifest {
  uri: string;
  relativePath: string;
  name: string | null;
  dependencies: ManifestDependency[];
}

/** A back-reference from a deduped closure entry to one manifest that uses it. */
export interface ClosureRef {
  uri: string;
  category: ManifestSection;
  range: string;
}

/**
 * One unique (name, versionKey) pair in the workspace dependency closure,
 * along with every manifest reference that resolves to it. Analyzing this
 * entry once and fanning the result back to each `ref` is the core
 * dedup optimization: a dep used in 12 manifests is analyzed once.
 */
export interface ClosureEntry {
  name: string;
  /** The version key used for cache lookups (resolved semver or a fallback). */
  versionKey: string;
  refs: ClosureRef[];
}

/** The deduped dependency closure for a whole workspace. */
export interface DependencyClosure {
  entries: ClosureEntry[];
  manifests: ParsedManifest[];
  /** Number of distinct (name, versionKey) pairs, i.e. entries.length. */
  uniqueCount: number;
}

/**
 * Resolves the version key for one manifest dependency. Implementations
 * typically consult a lockfile for the installed version and fall back
 * to a sentinel when none is found. Returning a stable key for the same
 * installed version across manifests is what lets the closure dedup.
 */
export type VersionKeyResolver = (
  manifestUri: string,
  dependency: ManifestDependency,
) => Promise<string>;

/**
 * Builds the deduped dependency closure across every manifest. Each
 * dependency is resolved to a version key via {@link VersionKeyResolver},
 * then grouped so that identical (name, versionKey) pairs collapse into a
 * single {@link ClosureEntry} carrying every manifest reference. Entries
 * are sorted by name for stable, diff-friendly output.
 */
export async function buildDependencyClosure(
  manifests: ParsedManifest[],
  resolveVersionKey: VersionKeyResolver,
): Promise<DependencyClosure> {
  const grouped = new Map<string, ClosureEntry>();

  for (const manifest of manifests) {
    for (const dependency of manifest.dependencies) {
      const versionKey = await resolveVersionKey(manifest.uri, dependency);
      const key = `${dependency.name}@${versionKey}`;
      const ref: ClosureRef = {
        uri: manifest.uri,
        category: dependency.category,
        range: dependency.range,
      };
      const existing = grouped.get(key);
      if (existing) {
        existing.refs.push(ref);
        continue;
      }
      grouped.set(key, {
        name: dependency.name,
        versionKey,
        refs: [ref],
      });
    }
  }

  const entries = Array.from(grouped.values()).sort((a, b) =>
    a.name === b.name
      ? a.versionKey.localeCompare(b.versionKey)
      : a.name.localeCompare(b.name),
  );

  return {
    entries,
    manifests,
    uniqueCount: entries.length,
  };
}

/**
 * Returns the closure entries that reference a given manifest, paired
 * with the category/range that manifest used. Lets the aggregator map a
 * once-analyzed entry back onto each package.json that depends on it.
 */
export function entriesForManifest(
  closure: DependencyClosure,
  manifestUri: string,
): Array<{ entry: ClosureEntry; ref: ClosureRef }> {
  const result: Array<{ entry: ClosureEntry; ref: ClosureRef }> = [];
  for (const entry of closure.entries) {
    for (const ref of entry.refs) {
      if (ref.uri === manifestUri) {
        result.push({ entry, ref });
      }
    }
  }
  return result;
}
