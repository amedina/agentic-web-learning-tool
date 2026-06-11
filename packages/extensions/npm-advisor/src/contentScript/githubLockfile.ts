/**
 * External dependencies.
 */
import {
  parseLockfile,
  UnsupportedLockfileError,
  type ParsedLockfile,
} from "@agentic-web-labs/package-analyzer-core";

/**
 * Maximum number of bytes the content script will accept when probing
 * for a lockfile on a GitHub repo. Lockfiles in big monorepos can
 * easily exceed 10MB; reading them in the foreground would freeze the
 * page. 2MB covers every reasonable single-project lockfile.
 */
const LOCKFILE_SIZE_CAP_BYTES = 2 * 1024 * 1024;

/**
 * Lockfiles the content script probes for, in priority order. Mirrors
 * the order used by the VSCode and MCP resolvers so identical projects
 * yield identical results across surfaces.
 */
const LOCKFILE_CANDIDATES = [
  "package-lock.json",
  "npm-shrinkwrap.json",
  "pnpm-lock.yaml",
  "yarn.lock",
] as const;

export interface GithubRepoContext {
  owner: string;
  repo: string;
  /** Git ref (branch / tag / commit sha) extracted from the URL. */
  ref: string;
  /**
   * Path of the package.json relative to the repo root (e.g.
   * `packages/foo/package.json`). Used to derive the lockfile's
   * containing directory so we probe alongside the package.json in
   * monorepos rather than only at the repo root.
   */
  packageJsonPath: string;
}

export interface FetchedRepoLockfile {
  url: string;
  parsed: ParsedLockfile;
}

/**
 * Extract `owner / repo / ref / packageJsonPath` from a GitHub blob
 * URL pointing at a `package.json`. Returns `null` when the URL doesn't
 * match the blob pattern — e.g. on `/tree/`, `/commits/`, etc.
 *
 * Example input:
 *   https://github.com/lodash/lodash/blob/main/packages/foo/package.json
 * Yields:
 *   { owner: "lodash", repo: "lodash", ref: "main",
 *     packageJsonPath: "packages/foo/package.json" }
 */
export function parseGithubBlobUrl(url: string): GithubRepoContext | null {
  const match = url.match(
    /https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/((?:.*\/)?package\.json)(?:[?#].*)?$/,
  );
  if (!match) {
    return null;
  }
  const [, owner, repo, ref, packageJsonPath] = match;
  return { owner, repo, ref, packageJsonPath };
}

/**
 * Walk the directory components of the package.json's path from the
 * package's own directory up to the repo root, probing for each
 * lockfile filename at every level. Returns the first lockfile found
 * (parsed) or `null` when none exists or every candidate fails the
 * size cap / parse step.
 *
 * Network requests hit `raw.githubusercontent.com`; that endpoint
 * 404s cheaply for missing files so the probing pattern is fine.
 */
export async function fetchRepoLockfile(
  context: GithubRepoContext,
): Promise<FetchedRepoLockfile | null> {
  const dirs = enumerateAncestorDirs(context.packageJsonPath);
  for (const dir of dirs) {
    for (const filename of LOCKFILE_CANDIDATES) {
      const relative = dir ? `${dir}/${filename}` : filename;
      const url = `https://raw.githubusercontent.com/${context.owner}/${context.repo}/${context.ref}/${relative}`;
      const contents = await tryFetch(url);
      if (contents === null) {
        continue;
      }
      const parsed = parseSafely(filename, contents);
      if (parsed) {
        return { url, parsed };
      }
    }
  }
  return null;
}

/**
 * Build the list of directories to probe, starting at the package.json's
 * own folder and walking up to the repo root. An empty string represents
 * the repo root itself.
 */
function enumerateAncestorDirs(packageJsonPath: string): string[] {
  const parts = packageJsonPath.split("/").slice(0, -1);
  const dirs: string[] = [];
  while (parts.length > 0) {
    dirs.push(parts.join("/"));
    parts.pop();
  }
  dirs.push("");
  return dirs;
}

/**
 * GET a raw.githubusercontent.com URL, capping the response at
 * {@link LOCKFILE_SIZE_CAP_BYTES} bytes. Returns the body as a string
 * on success, `null` on any failure (404, too big, network down).
 */
async function tryFetch(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    const sizeHeader = response.headers.get("content-length");
    if (sizeHeader && Number(sizeHeader) > LOCKFILE_SIZE_CAP_BYTES) {
      console.warn(
        `[NPM Advisor] Skipping lockfile ${url} — exceeds ${LOCKFILE_SIZE_CAP_BYTES} byte cap.`,
      );
      return null;
    }
    const text = await response.text();
    if (text.length > LOCKFILE_SIZE_CAP_BYTES) {
      console.warn(
        `[NPM Advisor] Skipping lockfile ${url} — body exceeds ${LOCKFILE_SIZE_CAP_BYTES} byte cap.`,
      );
      return null;
    }
    return text;
  } catch {
    return null;
  }
}

/**
 * Parse a lockfile, with the content script's failure policy: any
 * exception is logged to the console and treated as "no resolution".
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
      console.warn(
        `[NPM Advisor] Skipping unsupported GitHub lockfile (${filename}): ${message}`,
      );
    } else {
      console.warn(
        `[NPM Advisor] Failed to parse GitHub lockfile (${filename}): ${message}`,
      );
    }
    return null;
  }
}
