/**
 * External dependencies.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

/**
 * Read the package's `name` and `version` directly out of package.json at
 * load time. Both the esbuild bundle (`dist/server.js`) and the source
 * tree (`src/version.ts`) sit exactly one directory above package.json,
 * so the same `..` lookup works in production builds, in `vitest`, and
 * when the file is invoked through `tsx`/`node` without bundling.
 *
 * Previously the server hardcoded `SERVER_VERSION = "0.1.0"` while
 * package.json had moved on to `0.3.0`, so MCP clients displayed a
 * misleading version string. Centralising on package.json removes the
 * drift altogether.
 */
const packageJsonPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "package.json",
);
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
  name: string;
  version: string;
};

export const SERVER_NAME = "npm-advisor";
export const SERVER_VERSION: string = packageJson.version;
/** Distribution name (`@agentic-web-labs/npm-advisor-mcp`); exported for diagnostics. */
export const PACKAGE_NAME: string = packageJson.name;
