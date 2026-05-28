/**
 * External dependencies.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

/**
 * esbuild replaces these with string literals from package.json at build
 * time (see the `define` block in esbuild.config.js). They are the
 * authoritative source in the shipped bundle, which gets relocated into
 * the VSCode extension at `dist/mcp/server.js` where the file-read
 * fallback below can't find package.json.
 */
declare const __NPM_ADVISOR_VERSION__: string | undefined;
declare const __NPM_ADVISOR_NAME__: string | undefined;

/**
 * Resolve the package's `name` and `version`. In the esbuild bundle the
 * `define`d literals win. In unbundled runs (`tsx`, `vitest`, plain
 * `node` on the source) those identifiers are undefined, so we read
 * package.json one directory above this module — true for both the
 * source tree (`src/version.ts`) and an unbundled `dist/server.js`.
 *
 * Previously the server hardcoded `SERVER_VERSION = "0.1.0"` while
 * package.json had moved on, so MCP clients displayed a misleading
 * version string. Sourcing from package.json removes the drift.
 */
function readPackageMeta(): { name: string; version: string } {
  if (
    typeof __NPM_ADVISOR_NAME__ === "string" &&
    typeof __NPM_ADVISOR_VERSION__ === "string"
  ) {
    return { name: __NPM_ADVISOR_NAME__, version: __NPM_ADVISOR_VERSION__ };
  }
  const packageJsonPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "package.json",
  );
  return JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
    name: string;
    version: string;
  };
}

const packageJson = readPackageMeta();

export const SERVER_NAME = "npm-advisor";
export const SERVER_VERSION: string = packageJson.version;
/** Distribution name (`@agentic-web-labs/npm-advisor-mcp`); exported for diagnostics. */
export const PACKAGE_NAME: string = packageJson.name;
