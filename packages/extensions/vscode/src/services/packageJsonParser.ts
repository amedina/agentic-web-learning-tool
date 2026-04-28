/**
 * External dependencies.
 */
import * as vscode from "vscode";

export interface ParsedPackageJson {
  dependencies: string[];
  devDependencies: string[];
  peerDependencies: string[];
}

/**
 * Reads and parses a package.json URI into categorised dependency name lists.
 * Returns null if the file cannot be read or parsed.
 */
export async function parsePackageJson(
  uri: vscode.Uri,
): Promise<ParsedPackageJson | null> {
  try {
    const raw = await vscode.workspace.fs.readFile(uri);
    const text = Buffer.from(raw).toString("utf8");
    const json = JSON.parse(text) as Record<string, unknown>;
    return {
      dependencies: Object.keys(
        (json.dependencies as Record<string, string>) ?? {},
      ),
      devDependencies: Object.keys(
        (json.devDependencies as Record<string, string>) ?? {},
      ),
      peerDependencies: Object.keys(
        (json.peerDependencies as Record<string, string>) ?? {},
      ),
    };
  } catch {
    return null;
  }
}

/**
 * Finds the text range of a package name string key inside a package.json
 * document for a given section (dependencies / devDependencies / peerDependencies).
 *
 * Returns the range of the key string (including quotes) or null if not found.
 */
export function findPackageNameRange(
  document: vscode.TextDocument,
  packageName: string,
): vscode.Range | null {
  const text = document.getText();
  // Match the quoted key exactly — `"<name>"` followed by whitespace and colon.
  const pattern = new RegExp(`"(${escapeRegex(packageName)}"\\s*:)`, "g");
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const start = document.positionAt(match.index + 1); // skip opening quote
    const end = document.positionAt(match.index + 1 + packageName.length);
    return new vscode.Range(start, end);
  }
  return null;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Given a position in a package.json document, returns the package name
 * the cursor is on (if it is a key inside a *Dependencies section), or null.
 */
export function getPackageNameAtPosition(
  document: vscode.TextDocument,
  position: vscode.Position,
): { name: string; category: "runtime" | "dev" } | null {
  const text = document.getText();

  // Find which section the cursor is in by scanning backwards for the nearest
  // known section header.
  const offset = document.offsetAt(position);

  const depSections: Array<{
    key: string;
    category: "runtime" | "dev";
  }> = [
    { key: '"peerDependencies"', category: "runtime" },
    { key: '"dependencies"', category: "runtime" },
    { key: '"devDependencies"', category: "dev" },
  ];

  let sectionCategory: "runtime" | "dev" = "runtime";
  let sectionStart = -1;

  for (const section of depSections) {
    const index = text.lastIndexOf(section.key, offset);
    if (index !== -1 && index > sectionStart) {
      sectionStart = index;
      sectionCategory = section.category;
    }
  }

  if (sectionStart === -1) {
    return null;
  }

  // Extract the line text and see if the cursor lands on a quoted key.
  const line = document.lineAt(position.line).text;
  const keyMatch = /^\s*"([^"]+)"\s*:/.exec(line);
  if (!keyMatch) {
    return null;
  }

  // Confirm the match position overlaps with the cursor column.
  const keyStart = line.indexOf(`"${keyMatch[1]}"`);
  const keyEnd = keyStart + keyMatch[1].length + 2;
  const col = position.character;
  if (col < keyStart || col > keyEnd) {
    return null;
  }

  return { name: keyMatch[1], category: sectionCategory };
}
