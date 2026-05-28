/**
 * External dependencies.
 */
import { publint } from "publint";
import type { Message } from "publint";
import { formatMessage } from "publint/utils";
import * as path from "node:path";

/**
 * Internal dependencies.
 */
import type { FindingSeverity, ProjectFinding } from "../types";

/**
 * Mode controls whether publint inspects the source directory directly or
 * the artifact that would actually be published (a tarball produced by
 * the project's package manager).
 *
 * - `"source"` is fast and is the right default for an editor's manual run.
 *   It assumes every file in `pkgDir` would be published, which can produce
 *   slightly noisier results for "file not published"–style rules.
 * - `"pack"` runs the project's package manager to produce a tarball first,
 *   then lints the unpacked tarball. Slower (writes to a temp dir), but
 *   matches what publint.dev reports and what `@e18e/cli` does. Use this
 *   for a pre-publish sanity check.
 */
export type PublintMode = "source" | "pack";

export interface RunPublintOptions {
  /** Absolute path to the package root (the dir that contains `package.json`). */
  pkgDir: string;
  /** @default "source" */
  mode?: PublintMode;
  /**
   * Lowest publint message severity to include. Defaults to `"suggestion"`
   * to match publint's own default (i.e. surface everything).
   */
  level?: "error" | "warning" | "suggestion";
}

export interface RunPublintResult {
  findings: ProjectFinding[];
  /** Total publint messages produced (before any filtering by `level`). */
  rawMessageCount: number;
}

/**
 * Directory names whose contents are never part of a published package: third
 * party code (`node_modules`) and common build-output directories. In `"source"`
 * mode publint globs the whole working tree when the package has no `exports`
 * field, so it surfaces format warnings for thousands of dependency and build
 * artifacts that are irrelevant to the `package.json` being analyzed.
 */
const NON_PUBLISHED_DIR_SEGMENTS = new Set([
  "node_modules",
  "dist",
  "build",
  "out",
  "coverage",
  ".next",
  ".turbo",
  ".cache",
]);

/**
 * Returns the pkgDir-relative file path a publint message refers to, if any.
 * publint records this on `actualFilePath` (globbed file-format checks) or
 * `globbedFilePath` (exports-glob checks); both are leading-slash paths such as
 * `"/node_modules/jiti/dist/jiti.cjs"`.
 */
function getReferencedFilePath(message: Message): string | undefined {
  const args = message.args as Record<string, unknown> | undefined;
  if (!args) {
    return undefined;
  }
  const candidate = args.actualFilePath ?? args.globbedFilePath;
  return typeof candidate === "string" ? candidate : undefined;
}

/**
 * Whether a publint message points at a file that would never be published
 * (anything under `node_modules` or a build-output directory). Such messages are
 * noise for publishing-hygiene analysis and are dropped before findings are
 * created. Messages without a referenced file (i.e. those tied to a
 * `package.json` field) are always kept.
 */
function refersToNonPublishedFile(message: Message): boolean {
  const filePath = getReferencedFilePath(message);
  if (!filePath) {
    return false;
  }
  const segments = filePath.split("/").filter((segment) => segment.length > 0);
  return segments.some((segment) => NON_PUBLISHED_DIR_SEGMENTS.has(segment));
}

/**
 * Maps publint's `MessageType` to the severity vocabulary used by
 * `ProjectFinding`. Suggestions surface as `"info"` rather than `"hint"`
 * so they remain visible in editor diagnostic UIs.
 */
function mapSeverity(type: Message["type"]): FindingSeverity {
  switch (type) {
    case "error":
      return "error";
    case "warning":
      return "warning";
    case "suggestion":
    default:
      return "info";
  }
}

/**
 * Formats a single publint message as a human-readable string. Falls back
 * to the message code when `formatMessage` returns nothing (which happens
 * for codes the installed publint version does not recognize).
 */
function describe(message: Message, pkg: Record<string, unknown>): string {
  const formatted = formatMessage(message, pkg, { color: false });
  if (formatted && formatted.length > 0) {
    return formatted;
  }
  return message.code;
}

/**
 * Runs publint against a single package and returns its findings shaped as
 * `ProjectFinding[]`. The `file` field on each finding points at the
 * project's `package.json`; the publint `path` array (e.g. `["exports",
 * ".", "import"]`) is preserved on `data.publintPath` so callers that have
 * a JSON AST handy can map it to a precise line/column.
 *
 * This function does not throw for routine publint errors — those come back
 * as findings. It will throw only if `pkgDir` is unreadable or if publint
 * itself crashes.
 */
export async function runPublint(
  options: RunPublintOptions,
): Promise<RunPublintResult> {
  const { pkgDir, mode = "source", level = "suggestion" } = options;
  const result = await publint({
    pkgDir,
    level,
    pack: mode === "source" ? false : "auto",
  });
  const packageJsonPath = path.join(pkgDir, "package.json");
  const publishableMessages = result.messages.filter(
    (message) => !refersToNonPublishedFile(message),
  );
  const findings: ProjectFinding[] = publishableMessages.map((message) => ({
    source: "publint",
    severity: mapSeverity(message.type),
    code: message.code,
    message: describe(message, result.pkg),
    file: packageJsonPath,
    data: {
      publintPath: message.path,
      publintArgs: message.args,
    },
  }));
  return {
    findings,
    rawMessageCount: result.messages.length,
  };
}
