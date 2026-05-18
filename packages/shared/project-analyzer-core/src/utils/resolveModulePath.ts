/**
 * External dependencies.
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";

/**
 * Default extension set used when an import has no explicit extension.
 * Order matters — TS variants are checked first so a `.ts` source file
 * isn't shadowed by a stale `.js` sibling next to it.
 */
const DEFAULT_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];

/**
 * Returns `true` when `target` exists on disk and is a regular file.
 * Used as the "is this a resolvable JS/TS module?" test.
 */
async function isFile(target: string): Promise<boolean> {
  try {
    const stat = await fs.stat(target);
    return stat.isFile();
  } catch {
    return false;
  }
}

/**
 * Resolves a relative module specifier (e.g. `"./chipsList"`, `"."`,
 * `"../utils"`) to an absolute file path on disk. Mimics the Node /
 * bundler resolution algorithm at the level we care about: try the
 * literal path first, then append each candidate extension, then look
 * for an `index.*` inside the path treated as a directory.
 *
 * Returns `null` when the specifier is non-relative (an npm package,
 * a TS path alias we'd need a tsconfig to interpret, etc.) or when no
 * file matches — the caller treats that as "the import doesn't point
 * back into the project graph and can be ignored".
 */
export async function resolveModulePath(
  importerFile: string,
  specifier: string,
  extensions: readonly string[] = DEFAULT_EXTENSIONS,
): Promise<string | null> {
  if (!specifier.startsWith(".")) {
    return null;
  }
  const baseDirectory = path.dirname(importerFile);
  const resolved = path.resolve(baseDirectory, specifier);

  // Accept both ".ts" and "ts" forms so callers that already speak
  // madge's leading-dot-less convention don't have to translate.
  const normalisedExtensions = extensions.map((extension) =>
    extension.startsWith(".") ? extension : `.${extension}`,
  );

  if (await isFile(resolved)) {
    return resolved;
  }
  for (const extension of normalisedExtensions) {
    const candidate = resolved + extension;
    if (await isFile(candidate)) {
      return candidate;
    }
  }
  for (const extension of normalisedExtensions) {
    const candidate = path.join(resolved, `index${extension}`);
    if (await isFile(candidate)) {
      return candidate;
    }
  }
  return null;
}
