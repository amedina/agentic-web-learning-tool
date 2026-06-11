/**
 * External dependencies.
 */
import { describe, expect, it } from "vitest";
import { join } from "node:path";

/**
 * Internal dependencies.
 */
import { importerPathFor } from "../importerPath";

describe("importerPathFor", () => {
  it("returns '.' when the package.json sits beside the lockfile", () => {
    const root = join("/repo");
    expect(
      importerPathFor(join(root, "pnpm-lock.yaml"), join(root, "package.json")),
    ).toBe(".");
  });

  it("returns a posix path for a nested workspace package", () => {
    const root = join("/repo");
    expect(
      importerPathFor(
        join(root, "pnpm-lock.yaml"),
        join(root, "packages", "extensions", "vscode", "package.json"),
      ),
    ).toBe("packages/extensions/vscode");
  });
});
