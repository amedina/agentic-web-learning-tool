/**
 * External dependencies.
 */
import type {
  DependencyCategory,
  DependencyTree,
  PackageStats,
} from "@agentic-web-labs/package-analyzer-core";
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
  | { type: "viewPackage"; packageName: string };

export type ExtensionMessage =
  | {
      type: "init";
      packageJsonDependencies: PackageJsonDependenciesPayload;
      focusPackageName?: string;
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
  | { type: "focusPackage"; packageName: string };

export interface PackageJsonDependenciesPayload {
  dependencies: string[];
  devDependencies: string[];
  peerDependencies: string[];
}
