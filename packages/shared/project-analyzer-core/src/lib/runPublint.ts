/**
 * External dependencies.
 */
import { publint } from "publint";
import type { Message, PackFile } from "publint";
import { formatMessage } from "publint/utils";
import type { Dirent } from "node:fs";
import * as fs from "node:fs/promises";
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
 *   It lints the working tree directly (minus `node_modules` and build
 *   output), assuming the remaining files would be published, which can
 *   produce slightly noisier results for "file not published"-style rules.
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
  /**
   * Safety cap on the number of files collected for the `"source"`-mode
   * scan. Guards against pathological trees (huge monorepos, runaway
   * symlinks) consuming unbounded time and memory. Defaults to
   * {@link DEFAULT_MAX_SCAN_FILES}.
   */
  maxScanFiles?: number;
}

export interface RunPublintResult {
  findings: ProjectFinding[];
  /** Total publint messages produced (before any filtering by `level`). */
  rawMessageCount: number;
  /**
   * Soft notes surfaced to the caller, e.g. when the scan was skipped for a
   * private package or truncated at {@link RunPublintOptions.maxScanFiles}.
   * An empty array means the run completed cleanly.
   */
  warnings: string[];
}

/**
 * Default upper bound on files collected for a `"source"`-mode scan.
 */
const DEFAULT_MAX_SCAN_FILES = 5000;

/**
 * Directory names that must never be walked during a `"source"`-mode scan.
 * `node_modules` is the critical entry: on a workspace root it can hold
 * hundreds of megabytes, and letting publint recurse into it walks the whole
 * tree, which exhausts memory and blows past the caller's analysis timeout.
 * The rest are dependency caches and VCS/tooling output that a published
 * package's entry points never point at, so skipping them only removes noise.
 */
const HARD_EXCLUDED_DIRS = new Set([
  "node_modules",
  "coverage",
  ".next",
  ".nuxt",
  ".turbo",
  ".cache",
  ".git",
]);

/**
 * Build-output directory names. These are walked (unlike {@link
 * HARD_EXCLUDED_DIRS}) because a published package's entry points (`main`,
 * `module`, `types`, `exports`, `bin`) almost always resolve into one of them,
 * so publint must see those files to confirm the entry points exist. Without
 * this, every package that ships from `dist/` draws a false
 * `FILE_DOES_NOT_EXIST` for entry points that are present on disk.
 *
 * Files under these directories are recorded name-only (empty content): publint
 * only needs the path to satisfy the existence check, and reading large built
 * bundles into memory buys nothing because any format finding publint would
 * raise for a build artifact is dropped downstream as non-published noise (see
 * {@link refersToNonPublishedFile}).
 */
const BUILD_OUTPUT_DIRS = new Set(["dist", "build", "out"]);

/**
 * Extensions whose contents publint actually reads to lint file format. Only
 * these are read from disk; every other file is still listed (so existence
 * checks like "is there a LICENSE file" work) but carries empty content to
 * keep the in-memory file set small.
 */
const LINTABLE_EXTENSIONS = new Set([
  ".js",
  ".cjs",
  ".mjs",
  ".jsx",
  ".ts",
  ".cts",
  ".mts",
  ".tsx",
  ".json",
  ".node",
]);

/**
 * Reads and parses the `package.json` at `pkgDir`. Returns `undefined` when
 * the file is missing or unparseable so callers can fall back gracefully.
 */
async function readPackageManifest(
  pkgDir: string,
): Promise<Record<string, unknown> | undefined> {
  try {
    const raw = await fs.readFile(path.join(pkgDir, "package.json"), "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Walks `pkgDir` and returns the file set publint should lint, expressed as
 * the in-memory virtual file system publint accepts via `pack: { files }`.
 *
 * The walk deliberately never descends into {@link HARD_EXCLUDED_DIRS} and
 * never follows symlinks, so it cannot wander into `node_modules` or a
 * symlink loop. {@link BUILD_OUTPUT_DIRS} are walked but recorded name-only so
 * entry-point existence checks pass without reading built bundles into memory.
 * It stops after `maxFiles` entries, reporting `truncated` so the caller can
 * warn that results may be incomplete.
 */
async function collectPackageFiles(
  pkgDir: string,
  maxFiles: number,
): Promise<{ files: PackFile[]; truncated: boolean }> {
  const files: PackFile[] = [];
  let truncated = false;

  // Always include the root package.json first: publint cannot run without
  // it, so it must never be dropped by the file cap or by readdir ordering.
  const manifestPath = path.join(pkgDir, "package.json");
  try {
    files.push({
      name: manifestPath,
      data: await fs.readFile(manifestPath, "utf8"),
    });
  } catch {
    // No readable manifest — let publint surface the error downstream.
  }

  async function walk(directory: string, nameOnly: boolean): Promise<void> {
    if (files.length >= maxFiles) {
      truncated = true;
      return;
    }
    let entries: Dirent[];
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (files.length >= maxFiles) {
        truncated = true;
        return;
      }
      const fullPath = path.join(directory, entry.name);
      if (fullPath === manifestPath) {
        continue;
      }
      if (entry.isSymbolicLink()) {
        continue;
      }
      if (entry.isDirectory()) {
        if (HARD_EXCLUDED_DIRS.has(entry.name)) {
          continue;
        }
        await walk(fullPath, nameOnly || BUILD_OUTPUT_DIRS.has(entry.name));
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }
      const extension = path.extname(entry.name).toLowerCase();
      let data = "";
      if (
        !nameOnly &&
        (entry.name === "package.json" || LINTABLE_EXTENSIONS.has(extension))
      ) {
        try {
          data = await fs.readFile(fullPath, "utf8");
        } catch {
          data = "";
        }
      }
      files.push({ name: fullPath, data });
    }
  }

  await walk(pkgDir, false);
  return { files, truncated };
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
 *
 * Two guards keep the `"source"`-mode run bounded so it cannot hang or
 * exhaust memory on a large tree:
 * - A `private: true` package is never published, so publishing-hygiene
 *   checks do not apply; the run is skipped and a note is returned.
 * - Otherwise the scan is fed an explicit, pre-collected file set that
 *   excludes `node_modules` and build output, instead of letting publint
 *   recurse the working tree itself (which on a workspace root walks the
 *   entire monorepo, including a multi-hundred-megabyte `node_modules`).
 */
export async function runPublint(
  options: RunPublintOptions,
): Promise<RunPublintResult> {
  const {
    pkgDir,
    mode = "source",
    level = "suggestion",
    maxScanFiles = DEFAULT_MAX_SCAN_FILES,
  } = options;
  const warnings: string[] = [];

  const manifest = await readPackageManifest(pkgDir);
  if (manifest?.private === true) {
    return {
      findings: [],
      rawMessageCount: 0,
      warnings: [
        "publint skipped: package.json is marked private, so it is never published and publishing-hygiene checks do not apply.",
      ],
    };
  }

  let result;
  if (mode === "source") {
    const { files, truncated } = await collectPackageFiles(
      pkgDir,
      maxScanFiles,
    );
    if (truncated) {
      warnings.push(
        `publint scanned only the first ${maxScanFiles} files under ${pkgDir}; some publishing-hygiene findings may be missing.`,
      );
    }
    result = await publint({ pkgDir, level, pack: { files } });
  } else {
    result = await publint({ pkgDir, level, pack: "auto" });
  }

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
    warnings,
  };
}
