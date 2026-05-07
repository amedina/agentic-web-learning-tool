/**
 * External dependencies.
 */
import { readdir, readFile } from "node:fs/promises";
import { resolve, relative, basename } from "node:path";

const EXCLUDE_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "out",
  "coverage",
  ".turbo",
  ".cache",
]);

const MAX_DEPTH = 8;

export interface PackageJsonFile {
  /** Absolute path to the package.json file. */
  absolutePath: string;
  /** Path relative to the search root, e.g. "packages/foo/package.json". */
  relativePath: string;
  /** Parsed `name` field, or null if missing / malformed. */
  name: string | null;
  /** Number of entries under each top-level dependency section. */
  dependencyCounts: {
    dependencies: number;
    devDependencies: number;
    peerDependencies: number;
    optionalDependencies: number;
  };
}

/**
 * Walks `rootDir` looking for every `package.json` file, skipping
 * common build / dependency directories that would otherwise dominate
 * the results in any real project. Reads each match to extract the
 * `name` field and shallow dependency counts. Bounded depth so a
 * pathological symlink loop can't take the process down.
 */
export async function findPackageJsonFiles(
  rootDir: string,
): Promise<PackageJsonFile[]> {
  const results: PackageJsonFile[] = [];
  await walk(rootDir, rootDir, 0, results);
  results.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return results;
}

/**
 * Recursive directory walker. Pulls in package.json hits as we find
 * them and descends into subdirectories that aren't on the exclude
 * list. Errors reading individual entries are swallowed so a single
 * permission denial doesn't abort the whole scan.
 */
async function walk(
  rootDir: string,
  currentDir: string,
  depth: number,
  results: PackageJsonFile[],
): Promise<void> {
  if (depth > MAX_DEPTH) {
    return;
  }
  let entries;
  try {
    entries = await readdir(currentDir, { withFileTypes: true });
  } catch {
    return;
  }
  const subdirs: string[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name) || entry.name.startsWith(".")) {
        continue;
      }
      subdirs.push(resolve(currentDir, entry.name));
      continue;
    }
    if (!entry.isFile() || basename(entry.name) !== "package.json") {
      continue;
    }
    const absolutePath = resolve(currentDir, entry.name);
    const parsed = await readPackageJson(absolutePath);
    if (parsed) {
      results.push({
        absolutePath,
        relativePath: relative(rootDir, absolutePath),
        name: parsed.name,
        dependencyCounts: parsed.dependencyCounts,
      });
    }
  }
  await Promise.all(
    subdirs.map((subdir) => walk(rootDir, subdir, depth + 1, results)),
  );
}

/**
 * Reads a single package.json and extracts the fields we surface to
 * MCP clients. Tolerates malformed JSON by returning null so the
 * walker can keep going.
 */
async function readPackageJson(absolutePath: string): Promise<{
  name: string | null;
  dependencyCounts: PackageJsonFile["dependencyCounts"];
} | null> {
  try {
    const text = await readFile(absolutePath, "utf8");
    const parsed = JSON.parse(text) as {
      name?: unknown;
      dependencies?: Record<string, unknown>;
      devDependencies?: Record<string, unknown>;
      peerDependencies?: Record<string, unknown>;
      optionalDependencies?: Record<string, unknown>;
    };
    return {
      name: typeof parsed.name === "string" ? parsed.name : null,
      dependencyCounts: {
        dependencies: countEntries(parsed.dependencies),
        devDependencies: countEntries(parsed.devDependencies),
        peerDependencies: countEntries(parsed.peerDependencies),
        optionalDependencies: countEntries(parsed.optionalDependencies),
      },
    };
  } catch {
    return null;
  }
}

/** Counts the keys of a dependency-section object, treating missing / non-objects as 0. */
function countEntries(value: unknown): number {
  if (!value || typeof value !== "object") {
    return 0;
  }
  return Object.keys(value).length;
}

/**
 * Reads the dependency name lists from a single package.json. Used
 * by the analyze tool, which then fetches stats for each name.
 */
export async function readPackageJsonDependencies(
  absolutePath: string,
): Promise<{
  name: string | null;
  dependencies: string[];
  devDependencies: string[];
  peerDependencies: string[];
}> {
  const text = await readFile(absolutePath, "utf8");
  const parsed = JSON.parse(text) as {
    name?: unknown;
    dependencies?: Record<string, unknown>;
    devDependencies?: Record<string, unknown>;
    peerDependencies?: Record<string, unknown>;
  };
  return {
    name: typeof parsed.name === "string" ? parsed.name : null,
    dependencies: extractNames(parsed.dependencies),
    devDependencies: extractNames(parsed.devDependencies),
    peerDependencies: extractNames(parsed.peerDependencies),
  };
}

/** Returns the keys of a dependency-section object as a string array. */
function extractNames(value: unknown): string[] {
  if (!value || typeof value !== "object") {
    return [];
  }
  return Object.keys(value as Record<string, unknown>);
}
