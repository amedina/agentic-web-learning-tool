/**
 * External dependencies.
 */
import * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import type {
  ManifestDependency,
  ManifestSection,
  ParsedManifest,
} from "./dependencyClosure";
import type { PackageJsonFile } from "../webview/protocol";

/** The package.json sections Project Health walks, in roll-up order. */
const DEPENDENCY_SECTIONS: ManifestSection[] = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
];

/**
 * Reads and parses one package.json (from a PackageJsonScanner record)
 * into the flattened {@link ParsedManifest} the closure builder needs.
 * Read or parse failures yield a manifest with an empty dependency list
 * rather than throwing, so one malformed file never aborts a whole run.
 */
export async function readManifest(
  file: PackageJsonFile,
): Promise<ParsedManifest> {
  const dependencies = await readDependencies(file.uri);
  return {
    uri: file.uri,
    relativePath: file.relativePath,
    name: file.name,
    dependencies,
  };
}

/**
 * Reads the three dependency sections of a package.json URI and flattens
 * them into a single list of {@link ManifestDependency}. Non-object
 * sections and non-string version ranges are skipped defensively.
 */
async function readDependencies(uri: string): Promise<ManifestDependency[]> {
  let parsed: Record<string, unknown>;
  try {
    const buffer = await vscode.workspace.fs.readFile(vscode.Uri.parse(uri));
    parsed = JSON.parse(new TextDecoder().decode(buffer)) as Record<
      string,
      unknown
    >;
  } catch {
    return [];
  }

  const result: ManifestDependency[] = [];
  for (const category of DEPENDENCY_SECTIONS) {
    const section = parsed[category];
    if (!section || typeof section !== "object") {
      continue;
    }
    for (const [name, range] of Object.entries(
      section as Record<string, unknown>,
    )) {
      if (typeof range !== "string") {
        continue;
      }
      result.push({ name, category, range });
    }
  }
  return result;
}
