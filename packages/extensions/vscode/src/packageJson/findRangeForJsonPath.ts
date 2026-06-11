/**
 * External dependencies.
 */
import * as jsonc from "jsonc-parser";
import * as vscode from "vscode";

/**
 * Resolves a JSON-pointer-like path (e.g. `["exports", ".", "import"]`) to
 * a `vscode.Range` inside the given text document. The resolved range
 * spans the *property name* node when the path lands on an object key,
 * which is the right thing to underline for publint-style findings ("the
 * problem is at this key"). Returns `undefined` when the path does not
 * exist in the document — callers should fall back to a 0-length range
 * at the start of the file in that case.
 */
export function findRangeForJsonPath(
  document: vscode.TextDocument,
  path: ReadonlyArray<string | number>,
): vscode.Range | undefined {
  const text = document.getText();
  const errors: jsonc.ParseError[] = [];
  const root = jsonc.parseTree(text, errors);
  if (!root) {
    return undefined;
  }
  const node = jsonc.findNodeAtLocation(root, [...path]);
  if (!node) {
    return undefined;
  }
  const target = preferKeyOverValue(node);
  return new vscode.Range(
    document.positionAt(target.offset),
    document.positionAt(target.offset + target.length),
  );
}

/**
 * When a path resolves to a property's *value* node (e.g. the string
 * `"./index.js"` under `exports."."`), most editor surfaces want to
 * underline the value itself. But when the path resolves to an *object*
 * value (e.g. the whole `exports` block), we prefer to underline the key
 * one level up so the squiggle isn't a giant multi-line band. This helper
 * picks the more useful of the two.
 */
function preferKeyOverValue(node: jsonc.Node): jsonc.Node {
  if (node.type !== "object" && node.type !== "array") {
    return node;
  }
  const property = node.parent;
  if (!property || property.type !== "property" || !property.children) {
    return node;
  }
  const keyNode = property.children[0];
  if (!keyNode) {
    return node;
  }
  return keyNode;
}
