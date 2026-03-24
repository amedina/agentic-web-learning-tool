/**
 * Internal dependencies.
 */
import { fetchWithCache } from "./fetchWithCache";

export interface DependencyTree {
  name: string;
  requestedVersion: string;
  resolvedVersion?: string;
  dependencies: Record<string, DependencyTree>;
  _truncated?: boolean;
  error?: string;
}

/**
 * Recursively builds a dependency tree for an npm package.
 * @param packageName - The name of the npm package.
 * @param version - The version or tag to fetch (defaults to 'latest').
 * @param visited - Tracks visited packages in the current branch to prevent infinite loops.
 * @param depth - Tracks the current recursion depth.
 * @returns The dependency tree object.
 */
export async function getDependencyTree(
  packageName: string,
  version: string = "latest",
  visited: Set<string> = new Set(),
  depth: number = 0,
): Promise<DependencyTree> {
  const MAX_DEPTH = 3;
  const tree: DependencyTree = {
    name: packageName,
    requestedVersion: version,
    dependencies: {},
  };

  if (visited.has(packageName) || depth >= MAX_DEPTH) {
    return { ...tree, _truncated: true };
  }

  // Add current package to the visited set for this branch
  visited.add(packageName);

  try {
    const url = `https://registry.npmjs.org/${encodeURIComponent(packageName)}/${encodeURIComponent(version)}`;
    const data = await fetchWithCache(url);

    if (!data) {
      throw new Error(`Failed to fetch package data for ${packageName}`);
    }

    tree.resolvedVersion = data.version;

    const deps = data.dependencies || {};
    const depNames = Object.keys(deps);

    if (depNames.length > 0) {
      const promises = depNames.map((depName) => {
        // We use 'latest' for simplification, as full semantic versioning resolution is complex
        return getDependencyTree(
          depName,
          "latest",
          new Set(visited),
          depth + 1,
        );
      });

      const resolvedDeps = await Promise.all(promises);

      resolvedDeps.forEach((depTree, index) => {
        const depName = depNames[index];
        tree.dependencies[depName] = depTree;
      });
    }
  } catch (error: any) {
    tree.error = error.message || "Unknown error fetching dependency";
  }

  return tree;
}
