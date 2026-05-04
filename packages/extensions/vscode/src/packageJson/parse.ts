/**
 * External dependencies.
 */
import * as jsonc from "jsonc-parser";
import * as vscode from "vscode";

export type DependencyCategory =
  | "dependencies"
  | "devDependencies"
  | "peerDependencies"
  | "optionalDependencies";

const DEPENDENCY_SECTIONS: DependencyCategory[] = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

export interface PackageJsonDependency {
  name: string;
  version: string;
  category: DependencyCategory;
  /** Range of the dep name string, excluding surrounding quotes. */
  nameRange: vscode.Range;
  /** Range of the version string, excluding surrounding quotes. */
  valueRange: vscode.Range;
  /** Range of the full `"name": "version"` line. */
  fullRange: vscode.Range;
}

/**
 * Walks the four dependency sections of a package.json document and
 * returns one entry per dependency with name, version spec, category,
 * and three vscode.Range objects (name only, value only, full line).
 * Returns an empty array for malformed JSON or files with no
 * dependencies. Powered by jsonc-parser, which tolerates partial /
 * mid-edit JSON.
 */
export function parseDependencies(
  document: vscode.TextDocument,
): PackageJsonDependency[] {
  const text = document.getText();
  const errors: jsonc.ParseError[] = [];
  const root = jsonc.parseTree(text, errors);
  if (!root || root.type !== "object" || !root.children) {
    return [];
  }

  const result: PackageJsonDependency[] = [];
  for (const category of DEPENDENCY_SECTIONS) {
    const sectionNode = jsonc.findNodeAtLocation(root, [category]);
    if (
      !sectionNode ||
      sectionNode.type !== "object" ||
      !sectionNode.children
    ) {
      continue;
    }

    for (const propertyNode of sectionNode.children) {
      if (
        propertyNode.type !== "property" ||
        !propertyNode.children ||
        propertyNode.children.length < 2
      ) {
        continue;
      }
      const keyNode = propertyNode.children[0];
      const valueNode = propertyNode.children[1];
      if (
        keyNode.type !== "string" ||
        typeof keyNode.value !== "string" ||
        valueNode.type !== "string" ||
        typeof valueNode.value !== "string"
      ) {
        continue;
      }
      result.push({
        name: keyNode.value,
        version: valueNode.value,
        category,
        nameRange: stringContentRange(document, keyNode),
        valueRange: stringContentRange(document, valueNode),
        fullRange: nodeToRange(document, propertyNode),
      });
    }
  }
  return result;
}

/** Converts a jsonc-parser node's offset/length to a vscode.Range. */
function nodeToRange(
  document: vscode.TextDocument,
  node: jsonc.Node,
): vscode.Range {
  return new vscode.Range(
    document.positionAt(node.offset),
    document.positionAt(node.offset + node.length),
  );
}

/**
 * Like nodeToRange, but trims the surrounding quote characters that
 * jsonc-parser includes in a string node's offset/length so consumers
 * (hover, diagnostics) can highlight just the value content.
 */
function stringContentRange(
  document: vscode.TextDocument,
  node: jsonc.Node,
): vscode.Range {
  return new vscode.Range(
    document.positionAt(node.offset + 1),
    document.positionAt(node.offset + node.length - 1),
  );
}
