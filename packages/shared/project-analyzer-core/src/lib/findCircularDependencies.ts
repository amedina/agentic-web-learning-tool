/**
 * External dependencies.
 */
// @ts-expect-error — madge ships no type declarations.
import madge from "madge";
import * as fs from "node:fs/promises";
import * as path from "node:path";

/**
 * Internal dependencies.
 */
import type { ProjectFinding } from "../types";
import { parseImports } from "../utils/parseImports";
import { resolveModulePath } from "../utils/resolveModulePath";

/**
 * File extensions madge will parse when walking the import graph. Kept
 * intentionally broad so JS, TS, and modern module variants are all
 * picked up without per-project configuration.
 */
const DEFAULT_FILE_EXTENSIONS = [
  "js",
  "jsx",
  "ts",
  "tsx",
  "mjs",
  "cjs",
] as const;

/**
 * Directories that should never participate in cycle detection. Built
 * artifacts (`dist`, `build`, …) frequently contain bundled re-exports
 * that look like cycles to a static analyzer but are not source-level
 * bugs; `node_modules` is excluded for obvious size/noise reasons.
 */
const DEFAULT_EXCLUDE = [
  "node_modules",
  "dist",
  "build",
  "out",
  ".next",
  ".nuxt",
  ".turbo",
  "coverage",
  ".cache",
];

/**
 * Candidate source directories, tried in priority order. The first one
 * that exists under `rootPath` is used as the madge entry point. Falling
 * back to the project root itself is intentional — small projects with
 * no `src/` still get analyzed.
 */
const DEFAULT_SOURCE_CANDIDATES = ["src", "lib", "app", "source"];

export interface FindCircularDependenciesOptions {
  /** Absolute path to the project root that contains `package.json`. */
  rootPath: string;
  /**
   * Optional explicit source directory (relative to `rootPath` or absolute).
   * When omitted, the analyzer tries `src/`, `lib/`, `app/`, `source/`,
   * and finally `rootPath` itself.
   */
  sourceDir?: string;
  /**
   * File extensions to include. Defaults to a broad JS/TS list.
   */
  fileExtensions?: readonly string[];
  /**
   * Path to a `tsconfig.json` to honour TypeScript path aliases. When
   * omitted, the analyzer auto-detects `tsconfig.json` at the project
   * root and uses it if present.
   */
  tsConfig?: string;
}

export interface FindCircularDependenciesResult {
  findings: ProjectFinding[];
  /**
   * Soft errors. Populated when madge crashes, or when no analyzable
   * source directory exists. An empty `findings` list with a non-empty
   * `warnings` list is the "we tried but bailed" signal.
   */
  warnings: string[];
}

/**
 * Returns the first existing directory among the candidates, or
 * `undefined` if none of them resolve to a directory.
 */
async function pickSourceDir(
  rootPath: string,
  override: string | undefined,
): Promise<string | undefined> {
  const candidates = override
    ? [path.isAbsolute(override) ? override : path.join(rootPath, override)]
    : DEFAULT_SOURCE_CANDIDATES.map((directory) =>
        path.join(rootPath, directory),
      ).concat(rootPath);
  for (const candidate of candidates) {
    try {
      const stat = await fs.stat(candidate);
      if (stat.isDirectory()) {
        return candidate;
      }
    } catch {
      continue;
    }
  }
  return undefined;
}

/**
 * Detects whether `rootPath` is the root of a monorepo workspace. Checks
 * for the markers used by the major package managers: a
 * `pnpm-workspace.yaml`, a `lerna.json`, or a `workspaces` field in
 * `package.json` (npm/yarn, either the array form or the
 * `{ packages: [] }` object form). A truthy result means cycle detection
 * must not fall back to walking the bare root — source lives in the
 * individual packages, and pointing madge at the whole tree would build a
 * dependency graph across every package at once, which on a large repo
 * never finishes in a reasonable time.
 */
async function isWorkspaceRoot(rootPath: string): Promise<boolean> {
  const markerFiles = ["pnpm-workspace.yaml", "lerna.json"];
  for (const marker of markerFiles) {
    try {
      const stat = await fs.stat(path.join(rootPath, marker));
      if (stat.isFile()) {
        return true;
      }
    } catch {
      continue;
    }
  }
  try {
    const raw = await fs.readFile(path.join(rootPath, "package.json"), "utf8");
    const parsed = JSON.parse(raw) as { workspaces?: unknown };
    const workspaces = parsed.workspaces;
    if (Array.isArray(workspaces) && workspaces.length > 0) {
      return true;
    }
    if (
      workspaces !== null &&
      typeof workspaces === "object" &&
      Array.isArray((workspaces as { packages?: unknown }).packages) &&
      (workspaces as { packages: unknown[] }).packages.length > 0
    ) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Returns the path to a `tsconfig.json` at the project root when one
 * exists. Used so madge's TS resolver honours path aliases configured
 * in the user's project.
 */
async function detectTsConfig(rootPath: string): Promise<string | undefined> {
  const candidate = path.join(rootPath, "tsconfig.json");
  try {
    const stat = await fs.stat(candidate);
    if (stat.isFile()) {
      return candidate;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

/**
 * Formats a cycle (`[a, b, c]` meaning `a -> b -> c -> a`) as a single
 * human-readable arrow chain that closes the loop visually.
 */
function formatCycle(cycle: string[], sourceDir: string): string {
  const relative = cycle.map((entry) => {
    const absolute = path.isAbsolute(entry)
      ? entry
      : path.join(sourceDir, entry);
    return path.relative(sourceDir, absolute) || entry;
  });
  return [...relative, relative[0]].join(" → ");
}

/**
 * Returns a stable, short identifier for a cycle so the same cycle
 * always produces the same `code` regardless of which file madge
 * happens to emit first. Sorting the entries makes the code order-
 * independent.
 */
function cycleCode(cycle: string[]): string {
  const sorted = [...cycle].sort();
  return `CIRCULAR_DEP:${sorted.join("|")}`;
}

/**
 * Detects circular import cycles in the project's source tree using
 * `madge`. Returns one finding per detected cycle, each annotated with
 * the absolute path to the first file in the cycle so editors can jump
 * straight there.
 *
 * This analyzer is deliberately tolerant of misconfiguration: any
 * crash inside madge (missing entry, syntax errors in the source tree,
 * etc.) is captured as a soft warning rather than thrown, matching the
 * behaviour of the other analyzers in this package.
 */
export async function findCircularDependencies(
  options: FindCircularDependenciesOptions,
): Promise<FindCircularDependenciesResult> {
  const { rootPath, sourceDir, fileExtensions, tsConfig } = options;
  const warnings: string[] = [];

  const entryDir = await pickSourceDir(rootPath, sourceDir);
  if (!entryDir) {
    return {
      findings: [],
      warnings: [
        `No analyzable source directory found under ${rootPath} (tried ${DEFAULT_SOURCE_CANDIDATES.join(", ")}, and project root).`,
      ],
    };
  }

  // When no conventional source directory exists, `pickSourceDir` falls
  // back to the bare root. For a monorepo workspace root that fallback
  // points madge at the entire repository (every package's source at
  // once), which on a large tree pins the CPU long enough that the
  // editor's analysis spinner appears to hang forever. Skip the scan
  // here with a clear warning; cycles are detected per-package when each
  // package's own package.json is analyzed. An explicit `sourceDir`
  // override is always honoured — the caller asked for a specific tree.
  if (!sourceDir && entryDir === rootPath && (await isWorkspaceRoot(rootPath))) {
    return {
      findings: [],
      warnings: [
        `Skipped circular-dependency scan: ${rootPath} is a monorepo workspace root with no dedicated source directory. Run the analysis on an individual package instead.`,
      ],
    };
  }

  const resolvedTsConfig = tsConfig ?? (await detectTsConfig(rootPath));
  const madgeConfig: Record<string, unknown> = {
    fileExtensions: fileExtensions
      ? [...fileExtensions]
      : [...DEFAULT_FILE_EXTENSIONS],
    excludeRegExp: [new RegExp(`(^|/)(${DEFAULT_EXCLUDE.join("|")})(/|$)`)],
    detectiveOptions: {
      ts: { skipTypeImports: true },
      tsx: { skipTypeImports: true },
    },
  };
  if (resolvedTsConfig) {
    madgeConfig.tsConfig = resolvedTsConfig;
  }

  let cycles: string[][];
  try {
    const instance = await madge(entryDir, madgeConfig);
    cycles = instance.circular();
  } catch (error) {
    warnings.push(
      `Circular-dependency scan failed: ${(error as Error).message}`,
    );
    return { findings: [], warnings };
  }

  if (cycles.length === 0) {
    return { findings: [], warnings };
  }

  const findings: ProjectFinding[] = await Promise.all(
    cycles.map(async (cycle) => {
      const firstEntry = cycle[0];
      const absoluteFirst = path.isAbsolute(firstEntry)
        ? firstEntry
        : path.join(entryDir, firstEntry);
      const cycleDisplay = formatCycle(cycle, entryDir);
      const cycleAbsolute = cycle.map((entry) =>
        path.isAbsolute(entry) ? entry : path.join(entryDir, entry),
      );
      const edges = await extractCycleEdges(
        cycleAbsolute,
        fileExtensions ? [...fileExtensions] : [...DEFAULT_FILE_EXTENSIONS],
      );
      return {
        source: "circular-deps",
        severity: "warning",
        code: cycleCode(cycle),
        message: `Circular dependency detected (${cycle.length} files): ${cycleDisplay}`,
        file: absoluteFirst,
        data: {
          cycle: cycleAbsolute,
          cycleRelative: cycle,
          cycleLength: cycle.length,
          sourceDir: entryDir,
          edges,
          documentationUrl: "https://github.com/pahen/madge#readme",
        },
      };
    }),
  );

  return { findings, warnings };
}

/**
 * Describes one directed edge in a detected cycle: who imports whom,
 * and which binding names travel along the edge. `symbols` is empty
 * when the importer references the target only indirectly (e.g.
 * through a re-export chain we couldn't follow back) or when the
 * import is a bare side-effect form like `import "./register"`.
 */
export interface CycleEdge {
  /** Index of the importer in the cycle array. */
  fromIndex: number;
  /** Index of the importee in the cycle array. */
  toIndex: number;
  /** Display-ready binding names imported from the importee. */
  symbols: string[];
  /** True when every matching import was `import type` / type-only. */
  isTypeOnly: boolean;
  /** True when the only matching import was a bare side-effect import. */
  isSideEffectOnly: boolean;
}

/**
 * For each consecutive pair (and the wrap-around pair) in `cycle`,
 * reads the importer's source, parses its imports, resolves each
 * relative specifier to an absolute path, and keeps the ones whose
 * resolved target is the next file in the cycle. The resulting
 * `CycleEdge[]` is what the webview uses to label arrows in the
 * cycle graph with the *exact* names that cause the cycle.
 *
 * Read failures are tolerated — a missing/unreadable file just
 * yields an empty `symbols` list for that edge, which the UI then
 * renders as a plain "imports" arrow.
 */
async function extractCycleEdges(
  cycleAbsolute: string[],
  extensions: readonly string[],
): Promise<CycleEdge[]> {
  const edges: CycleEdge[] = [];
  const length = cycleAbsolute.length;
  for (let index = 0; index < length; index += 1) {
    const fromPath = cycleAbsolute[index];
    const toPath = cycleAbsolute[(index + 1) % length];

    let sourceText = "";
    try {
      sourceText = await fs.readFile(fromPath, "utf8");
    } catch {
      edges.push({
        fromIndex: index,
        toIndex: (index + 1) % length,
        symbols: [],
        isTypeOnly: false,
        isSideEffectOnly: false,
      });
      continue;
    }

    const imports = parseImports(sourceText);
    const symbols: string[] = [];
    let allTypeOnly = true;
    let anyMatch = false;
    let onlySideEffect = true;
    for (const importEntry of imports) {
      const resolved = await resolveModulePath(
        fromPath,
        importEntry.source,
        extensions,
      );
      if (resolved !== toPath) {
        continue;
      }
      anyMatch = true;
      if (importEntry.isSideEffectOnly) {
        continue;
      }
      onlySideEffect = false;
      if (!importEntry.isTypeOnly) {
        allTypeOnly = false;
      }
      for (const symbol of importEntry.symbols) {
        if (!symbols.includes(symbol)) {
          symbols.push(symbol);
        }
      }
    }
    edges.push({
      fromIndex: index,
      toIndex: (index + 1) % length,
      symbols,
      isTypeOnly: anyMatch && allTypeOnly && symbols.length > 0,
      isSideEffectOnly: anyMatch && onlySideEffect,
    });
  }
  return edges;
}
