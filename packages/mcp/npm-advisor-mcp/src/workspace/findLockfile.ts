/**
 * External dependencies.
 */
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  parseLockfile,
  UnsupportedLockfileError,
  type ParsedLockfile,
} from "@agentic-web-labs/package-analyzer-core";

/**
 * Names of lockfiles the MCP server looks for, in priority order. npm
 * comes first because `npm init` is the default new-project flow;
 * pnpm and yarn follow.
 */
const LOCKFILE_FILENAMES = [
  "package-lock.json",
  "npm-shrinkwrap.json",
  "pnpm-lock.yaml",
  "yarn.lock",
] as const;

export interface DiscoveredLockfile {
  /** Absolute path to the discovered lockfile. */
  path: string;
  /** Parsed top-level dependency map and detected format. */
  parsed: ParsedLockfile;
}

/**
 * Walk up from `startDir` looking for one of the supported lockfile
 * filenames. Returns the first one found and the parsed contents.
 * Returns `null` when no lockfile is present anywhere above the
 * starting directory, when reading fails, or when the file declares
 * an unsupported schema version.
 *
 * @param startDir - Absolute directory to start the upward walk from.
 *   Typically the directory containing the package.json under analysis.
 */
export async function findAndParseLockfile(
  startDir: string,
): Promise<DiscoveredLockfile | null> {
  let dir = startDir;
  while (true) {
    for (const filename of LOCKFILE_FILENAMES) {
      const candidate = join(dir, filename);
      const contents = await readFileSafe(candidate);
      if (contents === null) {
        continue;
      }
      const parsed = parseSafely(filename, contents);
      if (parsed) {
        return { path: candidate, parsed };
      }
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return null;
    }
    dir = parent;
  }
}

/**
 * Parse and return the lockfile at an explicit path. Used when the
 * caller supplies a `lockfilePath` input and we should not auto-walk.
 */
export async function parseLockfileAtPath(
  lockfilePath: string,
): Promise<DiscoveredLockfile | null> {
  const contents = await readFileSafe(lockfilePath);
  if (contents === null) {
    return null;
  }
  const parsed = parseSafely(lockfilePath, contents);
  return parsed ? { path: lockfilePath, parsed } : null;
}

/**
 * Read a file as UTF-8 text. Returns `null` when the file doesn't exist
 * or isn't readable so the caller can keep walking upward.
 */
async function readFileSafe(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

/**
 * Run {@link parseLockfile} with the MCP server's failure policy: an
 * unsupported lockfile or malformed contents degrade to `null` (with a
 * stderr warning) rather than throwing. The caller treats `null` as
 * `latest-fallback`.
 */
function parseSafely(
  filename: string,
  contents: string,
): ParsedLockfile | null {
  try {
    return parseLockfile(filename, contents);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (error instanceof UnsupportedLockfileError) {
      process.stderr.write(
        `npm-advisor-mcp: skipping unsupported lockfile (${filename}): ${message}\n`,
      );
    } else {
      process.stderr.write(
        `npm-advisor-mcp: failed to parse lockfile (${filename}): ${message}\n`,
      );
    }
    return null;
  }
}
