/**
 * External dependencies.
 */
import type {
  DependencyCategory,
  DependencyTree,
  PackageStats,
} from "@agentic-web-labs/package-analyzer-core";
import type { ProjectAnalysis } from "@agentic-web-labs/project-analyzer-core";
import type { BundleData } from "@agentic-web-labs/package-analyzer-ui";

/**
 * Wire format for messages exchanged between the WebviewView (browser
 * sandbox) and the extension host (Node). All messages are JSON-cloned
 * across the boundary, so payloads must be plain data.
 */

export type WebviewRequest =
  | { type: "ready" }
  | {
      type: "getLightStats";
      requestId: string;
      packageName: string;
      category: DependencyCategory;
    }
  | { type: "getBundleData"; requestId: string; packageName: string }
  | {
      type: "getDependencyTree";
      requestId: string;
      packageName: string;
      version?: string;
    }
  | { type: "viewPackage"; packageName: string }
  | { type: "openPackageJson"; uri: string }
  | { type: "refreshStats" }
  | { type: "setupMcp" }
  | {
      type: "runProjectAnalysis";
      requestId: string;
      /**
       * `vscode.Uri.toString()` of the package.json that anchors the
       * analysis. The host parses it back into a Uri and walks one
       * directory up to derive the project root, which keeps OS-specific
       * path semantics (Windows drive letters, UNC paths) on the host
       * side rather than asking the webview to special-case them.
       */
      packageJsonUri: string;
    }
  | {
      /**
       * Asks the host for the most recent cached analysis for the
       * project containing `packageJsonUri`. Lets the webview restore
       * its tab state after a tab switch or a full webview re-mount
       * without having to re-run the (expensive) analyzer.
       */
      type: "getCachedProjectAnalysis";
      requestId: string;
      packageJsonUri: string;
    }
  | {
      type: "revealFinding";
      /**
       * Absolute filesystem path of the file the finding refers to.
       * The host converts it to a Uri via `vscode.Uri.file()`, which
       * applies the right percent-encoding for paths that contain
       * spaces or other characters that break a hand-built file:// URI.
       */
      filePath: string;
      /**
       * Optional 0-based selection range to highlight when the editor
       * opens. Findings without a precise location omit this and the
       * editor just opens the file.
       */
      range?: {
        startLine: number;
        startColumn: number;
        endLine: number;
        endColumn: number;
      };
    }
  | {
      type: "notify";
      level: "info" | "warning" | "error";
      message: string;
      /**
       * Used by the host to dedupe — the same key never fires more
       * than one toast per session, so transient signals like
       * "GitHub rate limit hit" don't spam the user as more rows
       * trigger them.
       */
      dedupeKey?: string;
    };

export type ExtensionMessage =
  | {
      type: "init";
      activeFile: PackageJsonFile | null;
      availableFiles: PackageJsonFile[];
      packageJsonDependencies: PackageJsonDependenciesPayload;
      focusPackageName?: string;
      /**
       * Bumped every time the host wants the React-side stats cache
       * thrown away (e.g. after the user clicks Refresh). The webview
       * uses it as a React `key` on DependenciesTab to force a full
       * remount, which restarts every per-package fetch.
       */
      refreshKey?: number;
      /**
       * Cached PackageStats keyed by dep name, pulled out of the host
       * StatsCache without triggering any fetch. The webview seeds the
       * analyzer-ui's module-scoped stats cache from this so a panel
       * re-show / script reload doesn't fire a flurry of postMessage
       * round-trips for every dep — every entry already in here resolves
       * locally on the React side. Deps not present here (newly added
       * to package.json since the last fetch) still go through the
       * normal getLightStats round-trip.
       */
      prefetchedStats?: Record<string, PackageStats | null>;
    }
  | {
      type: "lightStats";
      requestId: string;
      ok: true;
      data: PackageStats | null;
    }
  | { type: "lightStats"; requestId: string; ok: false; error: string }
  | {
      type: "bundleData";
      requestId: string;
      ok: true;
      data: BundleData | null;
    }
  | { type: "bundleData"; requestId: string; ok: false; error: string }
  | {
      type: "dependencyTree";
      requestId: string;
      ok: true;
      data: DependencyTree | null;
    }
  | { type: "dependencyTree"; requestId: string; ok: false; error: string }
  | { type: "focusPackage"; packageName: string }
  | {
      type: "projectAnalysisResult";
      requestId: string;
      ok: true;
      data: ProjectAnalysis;
    }
  | {
      type: "projectAnalysisResult";
      requestId: string;
      ok: false;
      error: string;
    }
  | {
      type: "cachedProjectAnalysis";
      requestId: string;
      /**
       * `null` when nothing's cached (first run, expired entry, or no
       * package.json open). `finishedAt` is a `Date.now()` epoch.
       */
      data: { analysis: ProjectAnalysis; finishedAt: number } | null;
    }
  | {
      /**
       * Fired by the host when something the most recent analysis
       * looked at (today: `package.json`) changes on disk. The webview
       * keeps the old findings visible — they're still useful context
       * — but flags them as stale so the user knows to re-run.
       *
       * Filtering to the right project is intentional: a save in
       * `packages/foo/package.json` shouldn't mark `packages/bar`'s
       * analysis as stale.
       */
      type: "projectAnalysisStale";
      /**
       * `vscode.Uri.toString()` of the package.json whose project is
       * now stale. The webview matches this directly against the
       * `activeFile.uri` it already knows about, so neither side has
       * to do OS-specific path normalisation.
       */
      packageJsonUri: string;
      /** Workspace-relative display path of the file that triggered staleness. */
      changedFileDisplayPath: string;
    };

export interface PackageJsonDependenciesPayload {
  dependencies: string[];
  devDependencies: string[];
  peerDependencies: string[];
}

export interface PackageJsonFile {
  /** vscode.Uri.toString() so the host can route openPackageJson back. */
  uri: string;
  /** Workspace-relative path used for display, e.g. "packages/foo/package.json". */
  relativePath: string;
  /** Parsed `name` field from the manifest, null when missing or invalid. */
  name: string | null;
}
