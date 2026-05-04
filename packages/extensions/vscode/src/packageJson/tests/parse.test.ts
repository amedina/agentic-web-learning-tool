/**
 * External dependencies.
 */
import { describe, expect, it } from "vitest";
import type * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import { parseDependencies } from "../parse";
import { Position } from "../../test/vscodeMock";

function mockDocument(text: string): vscode.TextDocument {
  return {
    getText: () => text,
    positionAt: (offset: number) => {
      let line = 0;
      let lastNewlineIndex = -1;
      for (let index = 0; index < offset && index < text.length; index++) {
        if (text[index] === "\n") {
          line++;
          lastNewlineIndex = index;
        }
      }
      return new Position(line, offset - lastNewlineIndex - 1);
    },
  } as unknown as vscode.TextDocument;
}

function rangeText(text: string, range: vscode.Range): string {
  const lines = text.split("\n");
  if (range.start.line === range.end.line) {
    return lines[range.start.line].slice(
      range.start.character,
      range.end.character,
    );
  }
  const startLine = lines[range.start.line].slice(range.start.character);
  const endLine = lines[range.end.line].slice(0, range.end.character);
  const middle = lines.slice(range.start.line + 1, range.end.line).join("\n");
  return middle
    ? `${startLine}\n${middle}\n${endLine}`
    : `${startLine}\n${endLine}`;
}

describe("parseDependencies", () => {
  it("returns an empty array for an empty package.json", () => {
    const document = mockDocument("{}");
    expect(parseDependencies(document)).toEqual([]);
  });

  it("returns an empty array when there are no dependency sections", () => {
    const document = mockDocument(
      JSON.stringify({ name: "x", version: "1.0.0" }, null, 2),
    );
    expect(parseDependencies(document)).toEqual([]);
  });

  it("extracts a single runtime dependency", () => {
    const text = `{
  "dependencies": {
    "lodash": "^4.17.21"
  }
}`;
    const document = mockDocument(text);
    const dependencies = parseDependencies(document);
    expect(dependencies).toHaveLength(1);
    expect(dependencies[0].name).toBe("lodash");
    expect(dependencies[0].version).toBe("^4.17.21");
    expect(dependencies[0].category).toBe("dependencies");
  });

  it("preserves dependency category for each section", () => {
    const text = `{
  "dependencies": { "lodash": "^4" },
  "devDependencies": { "vitest": "^3" },
  "peerDependencies": { "react": "^19" },
  "optionalDependencies": { "fsevents": "^2" }
}`;
    const document = mockDocument(text);
    const dependencies = parseDependencies(document);
    const byName = Object.fromEntries(
      dependencies.map((dep) => [dep.name, dep.category]),
    );
    expect(byName).toEqual({
      lodash: "dependencies",
      vitest: "devDependencies",
      react: "peerDependencies",
      fsevents: "optionalDependencies",
    });
  });

  it("handles scoped package names", () => {
    const text = `{
  "devDependencies": {
    "@types/node": "^24.3.0"
  }
}`;
    const document = mockDocument(text);
    const [dep] = parseDependencies(document);
    expect(dep.name).toBe("@types/node");
    expect(dep.version).toBe("^24.3.0");
  });

  it("preserves non-semver protocol versions like workspace:* and file:", () => {
    const text = `{
  "dependencies": {
    "internal-pkg": "workspace:*",
    "local-pkg": "file:../local"
  }
}`;
    const document = mockDocument(text);
    const dependencies = parseDependencies(document);
    expect(dependencies.map((dep) => `${dep.name}@${dep.version}`)).toEqual([
      "internal-pkg@workspace:*",
      "local-pkg@file:../local",
    ]);
  });

  it("returns ranges that point at name and value content (excluding quotes)", () => {
    const text = `{
  "dependencies": {
    "lodash": "^4.17.21"
  }
}`;
    const document = mockDocument(text);
    const [dep] = parseDependencies(document);
    expect(rangeText(text, dep.nameRange)).toBe("lodash");
    expect(rangeText(text, dep.valueRange)).toBe("^4.17.21");
    expect(rangeText(text, dep.fullRange)).toBe('"lodash": "^4.17.21"');
  });

  it("ignores non-dependency sections like scripts", () => {
    const text = `{
  "scripts": { "build": "tsc" },
  "dependencies": { "lodash": "^4" }
}`;
    const document = mockDocument(text);
    const dependencies = parseDependencies(document);
    expect(dependencies).toHaveLength(1);
    expect(dependencies[0].name).toBe("lodash");
  });

  it("recovers gracefully from a trailing comma in a dependency section", () => {
    const text = `{
  "dependencies": {
    "lodash": "^4.17.21",
    "react": "^19.0.0",
  }
}`;
    const document = mockDocument(text);
    const names = parseDependencies(document).map((dep) => dep.name);
    expect(names).toEqual(["lodash", "react"]);
  });

  it("returns an empty array for a malformed root", () => {
    const document = mockDocument("not json");
    expect(parseDependencies(document)).toEqual([]);
  });
});
