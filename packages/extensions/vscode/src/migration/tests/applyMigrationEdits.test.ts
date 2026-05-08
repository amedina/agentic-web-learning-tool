/**
 * External dependencies.
 */
import { describe, expect, it, vi } from "vitest";

/**
 * Internal dependencies.
 */
import { applyMigrationEdits } from "../applyMigrationEdits";

vi.mock("vscode", () => {
  class Position {
    constructor(
      public readonly line: number,
      public readonly character: number,
    ) {}
  }
  class Range {
    constructor(
      public readonly start: Position,
      public readonly end: Position,
    ) {}
  }
  class Uri {
    private constructor(private readonly value: string) {}
    static file(path: string): Uri {
      return new Uri(path);
    }
    toString(): string {
      return this.value;
    }
  }
  class WorkspaceEdit {
    public readonly entries: { uri: Uri; range: Range; newText: string }[] = [];
    replace(uri: Uri, range: Range, newText: string): void {
      this.entries.push({ uri, range, newText });
    }
  }
  return {
    Position,
    Range,
    Uri,
    WorkspaceEdit,
    workspace: {
      openTextDocument: vi.fn(async (_uri: Uri) => ({
        lineCount: 3,
        lineAt: (_line: number) => ({
          range: { end: new Position(2, 10) },
        }),
      })),
      applyEdit: vi.fn(async (_edit: WorkspaceEdit) => true),
    },
  };
});

describe("applyMigrationEdits", () => {
  it("returns 0/0 immediately for an empty edit list", async () => {
    const result = await applyMigrationEdits([]);
    expect(result).toEqual({ applied: 0, failed: [] });
  });

  it("builds one whole-document replacement per edit and applies it", async () => {
    const vscode = await import("vscode");
    const applyEditSpy = vi.mocked(vscode.workspace.applyEdit);
    applyEditSpy.mockClear();

    const result = await applyMigrationEdits([
      {
        file: "/tmp/a.ts",
        packageNames: ["chalk"],
        originalText: "import chalk from 'chalk';\n",
        newText: "import pc from 'picocolors';\n",
      },
      {
        file: "/tmp/b.ts",
        packageNames: ["chalk"],
        originalText: "import chalk from 'chalk';\n",
        newText: "import pc from 'picocolors';\n",
      },
    ]);

    expect(result).toEqual({ applied: 2, failed: [] });
    expect(applyEditSpy).toHaveBeenCalledTimes(1);
  });

  it("reports every input file as failed when applyEdit returns false", async () => {
    const vscode = await import("vscode");
    const applyEditSpy = vi.mocked(vscode.workspace.applyEdit);
    applyEditSpy.mockResolvedValueOnce(false);

    const result = await applyMigrationEdits([
      {
        file: "/tmp/a.ts",
        packageNames: ["chalk"],
        originalText: "x",
        newText: "y",
      },
    ]);

    expect(result.applied).toBe(0);
    expect(result.failed).toEqual(["/tmp/a.ts"]);
  });
});
