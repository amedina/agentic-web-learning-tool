/**
 * External dependencies.
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as vscode from "vscode";
import {
  parseLockfile,
  resolutionsForImporter,
  UnsupportedLockfileError,
  type ParsedLockfile,
} from "@agentic-web-labs/package-analyzer-core";

/**
 * Names the resolver searches for when walking up from a package.json,
 * in priority order. `package-lock.json` first because npm is the
 * default for `npm init`; pnpm and yarn follow.
 */
const LOCKFILE_FILENAMES = [
  "package-lock.json",
  "npm-shrinkwrap.json",
  "pnpm-lock.yaml",
  "yarn.lock",
] as const;

interface DiscoveredLockfile {
  uri: vscode.Uri;
  parsed: ParsedLockfile;
}

interface DirectoryCacheEntry {
  /** Discovered lockfile or `null` when none was found anywhere upward. */
  lockfile: DiscoveredLockfile | null;
  /** FileSystemWatcher for the discovered file, so changes invalidate. */
  watcher: vscode.FileSystemWatcher | null;
}

/**
 * Walks up from a package.json file looking for the nearest lockfile,
 * parses it via the analyzer-core `parseLockfile` utility, and caches
 * the result per package.json folder. The cached entry is invalidated
 * automatically when the underlying lockfile changes on disk.
 *
 * The resolver is intentionally lock-of-truth: when a dependency name
 * isn't present in the lockfile's top-level map (peerDep not actually
 * installed, optional dep that didn't install on this platform), it
 * returns `undefined` so the caller falls back to latest-fallback
 * behaviour rather than guessing.
 */
export class LockfileResolver implements vscode.Disposable {
  private readonly directoryCache = new Map<
    string,
    Promise<DirectoryCacheEntry>
  >();
  private readonly watchers = new Set<vscode.FileSystemWatcher>();
  private readonly emitter = new vscode.EventEmitter<vscode.Uri>();

  /**
   * Fires when a discovered lockfile changes (created, modified, or
   * deleted). Listeners typically refresh views that depend on
   * resolved versions — diagnostics, hover, the side-panel.
   */
  readonly onDidChange = this.emitter.event;

  /**
   * Resolve the installed version of a dependency for a given
   * package.json. Walks up directories looking for the nearest lockfile,
   * parses it, and returns the top-level resolution for the dep name.
   * Returns `undefined` when no lockfile is found, when the lockfile is
   * unsupported, when parsing fails, or when the dep isn't in the
   * top-level map.
   *
   * @param packageJsonUri - URI of the package.json that referenced the
   *   dependency. Used as the starting point for the upward walk.
   * @param dependencyName - npm package name to resolve.
   */
  async resolveVersion(
    packageJsonUri: vscode.Uri,
    dependencyName: string,
  ): Promise<string | undefined> {
    const entry = await this.getDirectoryEntry(packageJsonUri);
    if (!entry.lockfile) {
      return undefined;
    }
    const importerPath = toImporterPath(
      path.dirname(entry.lockfile.uri.fsPath),
      path.dirname(packageJsonUri.fsPath),
    );
    return resolutionsForImporter(entry.lockfile.parsed, importerPath)[
      dependencyName
    ];
  }

  /**
   * Look up the lockfile that covers a given package.json. Returns
   * `undefined` when nothing was found. Exposed so commands like
   * "open the lockfile this resolution came from" can find the source.
   */
  async findLockfile(
    packageJsonUri: vscode.Uri,
  ): Promise<vscode.Uri | undefined> {
    const entry = await this.getDirectoryEntry(packageJsonUri);
    return entry.lockfile?.uri;
  }

  /**
   * Discard every cached lockfile and dispose every file watcher. Used
   * when the workspace folders change so cross-folder state can't leak.
   */
  invalidateAll(): void {
    for (const watcher of this.watchers) {
      watcher.dispose();
    }
    this.watchers.clear();
    this.directoryCache.clear();
  }

  /**
   * Disposable hook: drop watchers and the emitter. The cache itself
   * is in-memory only, so dropping watchers is enough.
   */
  dispose(): void {
    this.invalidateAll();
    this.emitter.dispose();
  }

  /**
   * Returns (and memoises) the {@link DirectoryCacheEntry} for the
   * folder containing a package.json. Concurrent identical requests
   * share one promise so two callers don't race the walk + parse.
   */
  private getDirectoryEntry(
    packageJsonUri: vscode.Uri,
  ): Promise<DirectoryCacheEntry> {
    const dir = path.dirname(packageJsonUri.fsPath);
    const cached = this.directoryCache.get(dir);
    if (cached) {
      return cached;
    }
    const promise = this.discoverAndParse(dir);
    this.directoryCache.set(dir, promise);
    return promise;
  }

  /**
   * Walk up from `startDir` looking for one of the supported lockfile
   * filenames. When found, read and parse it; set up a watcher so
   * subsequent edits invalidate the cached entry. Bails out at the
   * filesystem root.
   */
  private async discoverAndParse(
    startDir: string,
  ): Promise<DirectoryCacheEntry> {
    let dir = startDir;
    while (true) {
      for (const filename of LOCKFILE_FILENAMES) {
        const candidate = path.join(dir, filename);
        const contents = await readFileSafe(candidate);
        if (contents === null) {
          continue;
        }
        const parsed = parseSafely(filename, contents);
        const uri = vscode.Uri.file(candidate);
        const watcher = this.installWatcher(candidate, startDir);
        return {
          lockfile: parsed ? { uri, parsed } : null,
          watcher,
        };
      }
      const parent = path.dirname(dir);
      if (parent === dir) {
        return { lockfile: null, watcher: null };
      }
      dir = parent;
    }
  }

  /**
   * Create a {@link vscode.FileSystemWatcher} for the discovered
   * lockfile path. On any change, invalidate the cached entry for the
   * originating package.json folder and emit `onDidChange` so views
   * can refresh. The watcher is added to {@link watchers} so the
   * resolver can dispose all of them on shutdown.
   */
  private installWatcher(
    lockfilePath: string,
    forDir: string,
  ): vscode.FileSystemWatcher {
    const watcher = vscode.workspace.createFileSystemWatcher(lockfilePath);
    const handler = (uri: vscode.Uri) => {
      this.directoryCache.delete(forDir);
      this.emitter.fire(uri);
    };
    watcher.onDidChange(handler);
    watcher.onDidCreate(handler);
    watcher.onDidDelete(handler);
    this.watchers.add(watcher);
    return watcher;
  }
}

/**
 * Compute the importer path for a package.json relative to a lockfile,
 * in the form pnpm uses for `importers` keys: a posix path relative to
 * the lockfile's directory, with `.` for the package alongside it. Lets
 * the resolver pick the exact workspace member a dependency belongs to
 * when a single root lockfile covers the whole workspace.
 */
function toImporterPath(lockfileDir: string, packageDir: string): string {
  const relativePath = path.relative(lockfileDir, packageDir);
  if (!relativePath) {
    return ".";
  }
  return relativePath.split(path.sep).join("/");
}

/**
 * Read a file and return its contents as UTF-8 text. Returns `null`
 * when the file doesn't exist or isn't readable so the caller can
 * keep walking up the directory tree.
 */
async function readFileSafe(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

/**
 * Wrap {@link parseLockfile} with the resolver's failure policy: an
 * unsupported lockfile or any parse error degrades to "no resolution"
 * with a console.warn rather than throwing. Callers see `undefined`
 * for affected dependency lookups, which the rest of the pipeline
 * treats as `latest-fallback`.
 */
function parseSafely(
  filename: string,
  contents: string,
): ParsedLockfile | null {
  try {
    return parseLockfile(filename, contents);
  } catch (error) {
    if (error instanceof UnsupportedLockfileError) {
      console.warn(
        `[NPM Advisor] Skipping unsupported lockfile (${filename}): ${error.message}`,
      );
    } else {
      console.warn(
        `[NPM Advisor] Failed to parse lockfile (${filename}):`,
        error instanceof Error ? error.message : String(error),
      );
    }
    return null;
  }
}
