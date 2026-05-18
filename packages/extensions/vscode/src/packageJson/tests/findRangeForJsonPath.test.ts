/**
 * External dependencies.
 */
import { describe, expect, it } from "vitest";
import type * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import { findRangeForJsonPath } from "../findRangeForJsonPath";
import { Position } from "../../test/vscodeMock";

/**
 * Returns a fake `vscode.TextDocument` exposing the bare minimum surface
 * `findRangeForJsonPath` consumes (`getText` + `positionAt`). `positionAt`
 * walks the source text to convert an absolute offset into line/column,
 * matching the behaviour of the real VS Code TextDocument.
 */
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

/**
 * Returns the substring of `text` covered by a `vscode.Range`. Used so
 * tests assert against the range's content rather than line/column ints.
 */
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

describe("findRangeForJsonPath", () => {
  const sample = `{
  "name": "fixture",
  "exports": {
    ".": "./index.js",
    "./sub": "./sub.js"
  }
}
`;

  it("returns the value range for a leaf string path", () => {
    const document = mockDocument(sample);
    const range = findRangeForJsonPath(document, ["exports", "."]);
    expect(range).toBeDefined();
    expect(rangeText(sample, range!)).toBe(`"./index.js"`);
  });

  it("returns the property-key range for an object-valued path", () => {
    const document = mockDocument(sample);
    const range = findRangeForJsonPath(document, ["exports"]);
    expect(range).toBeDefined();
    expect(rangeText(sample, range!)).toBe(`"exports"`);
  });

  it("returns undefined when the path does not exist", () => {
    const document = mockDocument(sample);
    const range = findRangeForJsonPath(document, ["exports", "./missing"]);
    expect(range).toBeUndefined();
  });
});
