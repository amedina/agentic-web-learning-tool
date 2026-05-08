/**
 * External dependencies.
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";

/**
 * Lazy reference to `module-replacements-codemods`. We resolve it via a
 * dynamic import on first use so consumers that never call the codemod
 * functions don't pay for loading `@ast-grep/napi`'s native binding,
 * which is platform-specific and may not be available everywhere the
 * package is consumed (e.g. a packaged VS Code extension that hasn't
 * shipped a binary for the user's platform yet). The Promise is
 * memoised so repeat calls don't re-import.
 */
type CodemodsModule = typeof import("module-replacements-codemods");
let codemodsModulePromise: Promise<CodemodsModule> | null = null;

/**
 * Loads `module-replacements-codemods` on demand. Returns the imported
 * module; throws a descriptive `Error` (with a `cause` chain) if the
 * underlying native binding fails to load, so callers can surface a
 * friendly message rather than a raw NAPI traceback.
 */
async function loadCodemodsModule(): Promise<CodemodsModule> {
  if (!codemodsModulePromise) {
    codemodsModulePromise = import("module-replacements-codemods").catch(
      (cause) => {
        codemodsModulePromise = null;
        throw new Error(
          "Could not load module-replacements-codemods. The migration codemods " +
            "depend on @ast-grep/napi, which ships a platform-specific native " +
            "binding; install the package locally before running this feature.",
          { cause },
        );
      },
    );
  }
  return codemodsModulePromise;
}

const DEFAULT_FILE_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"];

const DEFAULT_SKIP_DIRECTORIES = new Set([
  "node_modules",
  "dist",
  "build",
  ".git",
  "coverage",
  ".next",
  ".turbo",
  ".cache",
  ".vscode",
  ".idea",
]);

/**
 * A single, file-scoped change a migration would make. Holds the
 * original and new contents in full so the consumer (a VS Code
 * WorkspaceEdit, a webview diff preview) can decide how to apply or
 * present it. Keeping the full text rather than a delta keeps the
 * shape JSON-serialisable (the webview channel is JSON-cloned).
 */
export interface MigrationEdit {
  file: string;
  /**
   * The names of the packages whose codemods produced this edit. When
   * multiple selected codemods touch the same file, they're folded into
   * one edit and listed here in run order.
   */
  packageNames: string[];
  originalText: string;
  newText: string;
}

export interface RunMigrationCodemodsOptions {
  /** Absolute path to the project root that contains source files. */
  rootPath: string;
  /** npm package names whose codemods should run. */
  packageNames: string[];
  /**
   * Source-file extensions to consider. Defaults to a JS/TS family that
   * matches what the codemods themselves expect. Override only when a
   * codemod targets, say, `.vue` or `.svelte` files.
   */
  fileExtensions?: string[];
  /**
   * Directory names to skip while walking the project. Defaults to a
   * conservative list of generated/vendor folders.
   */
  skipDirectories?: ReadonlySet<string>;
}

export interface RunMigrationCodemodsResult {
  edits: MigrationEdit[];
  /**
   * Package names from the input that have no codemod in the installed
   * `module-replacements-codemods` catalog — surfaced so callers can
   * show "no codemod available yet" in their UI.
   */
  unsupported: string[];
  /**
   * Number of source files actually scanned. Useful for "scanned X
   * files, found Y edits" status messages.
   */
  filesScanned: number;
}

/**
 * Builds a list of `MigrationEdit` records by running every codemod
 * whose package name appears in `options.packageNames` against every
 * source file under `options.rootPath`. Read-only — never writes to
 * disk. The caller (a WorkspaceEdit in the editor, a `--apply` switch
 * in a CLI) is responsible for committing the returned edits.
 *
 * If multiple selected codemods touch the same file they're folded
 * into one edit, with the codemods applied in input order so each
 * subsequent transform sees the previous one's output.
 */
export async function runMigrationCodemods(
  options: RunMigrationCodemodsOptions,
): Promise<RunMigrationCodemodsResult> {
  const {
    rootPath,
    packageNames,
    fileExtensions = DEFAULT_FILE_EXTENSIONS,
    skipDirectories = DEFAULT_SKIP_DIRECTORIES,
  } = options;

  const { codemods } = await loadCodemodsModule();
  const supported: { name: string; codemod: (typeof codemods)[string] }[] = [];
  const unsupported: string[] = [];
  for (const name of packageNames) {
    const factory = codemods[name];
    if (!factory) {
      unsupported.push(name);
      continue;
    }
    supported.push({ name, codemod: factory });
  }

  if (supported.length === 0) {
    return { edits: [], unsupported, filesScanned: 0 };
  }

  const transforms = supported.map(({ name, codemod }) => ({
    name,
    instance: codemod({}),
  }));

  const sourceFiles = await collectSourceFiles(
    rootPath,
    fileExtensions,
    skipDirectories,
  );

  const edits: MigrationEdit[] = [];
  for (const file of sourceFiles) {
    const originalText = await fs.readFile(file, "utf8");
    let currentText = originalText;
    const appliedNames: string[] = [];
    for (const { name, instance } of transforms) {
      const next = await instance.transform({
        file: { source: currentText, filename: file },
      });
      if (typeof next !== "string" || next === currentText) {
        continue;
      }
      currentText = next;
      appliedNames.push(name);
    }
    if (currentText !== originalText) {
      edits.push({
        file,
        packageNames: appliedNames,
        originalText,
        newText: currentText,
      });
    }
  }

  return { edits, unsupported, filesScanned: sourceFiles.length };
}

/**
 * Recursively collects source files under `rootPath`. Skips configured
 * directories (node_modules, dist, .git, …) and only returns files
 * whose extension matches `fileExtensions`. Symbolic links are not
 * followed — keeps the walk bounded on monorepos that link sibling
 * packages.
 */
async function collectSourceFiles(
  rootPath: string,
  fileExtensions: string[],
  skipDirectories: ReadonlySet<string>,
): Promise<string[]> {
  const result: string[] = [];
  const stack: string[] = [rootPath];
  while (stack.length > 0) {
    const directory = stack.pop()!;
    let entries: import("node:fs").Dirent[];
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.name.startsWith(".") && entry.isDirectory()) {
        if (skipDirectories.has(entry.name)) {
          continue;
        }
      }
      if (entry.isSymbolicLink()) {
        continue;
      }
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (skipDirectories.has(entry.name)) {
          continue;
        }
        stack.push(absolutePath);
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }
      const extension = path.extname(entry.name);
      if (!fileExtensions.includes(extension)) {
        continue;
      }
      result.push(absolutePath);
    }
  }
  return result;
}

/**
 * Returns the set of package names for which a codemod is available in
 * the currently-installed `module-replacements-codemods`. Useful for
 * UIs that want to disable the "Migrate" affordance on findings the
 * wrapper can't actually fix. Async so it can lazy-load the catalog —
 * see `loadCodemodsModule` for why.
 */
export async function listSupportedCodemodPackages(): Promise<string[]> {
  const { codemods } = await loadCodemodsModule();
  return Object.keys(codemods).sort();
}
