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

export async function fetchGithubSecurityAdvisories(
  owner: string,
  repo: string,
) {
  const url = `https://api.github.com/repos/${owner}/${repo}/security-advisories`;
  return fetchWithCache(url);
}

export async function fetchBundlephobiaData(packageName: string) {
  const url = `https://bundlephobia.com/api/size?package=${encodeURIComponent(packageName)}&record=true`;
  return fetchWithCache(url);
}

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

export type ReplacementType = "micro-utilities" | "native" | "preferred";

export async function fetchModuleReplacements(type: ReplacementType) {
  const url = `https://raw.githubusercontent.com/es-tooling/module-replacements/main/manifests/${type}.json`;
  return fetchWithCache(url);
}
