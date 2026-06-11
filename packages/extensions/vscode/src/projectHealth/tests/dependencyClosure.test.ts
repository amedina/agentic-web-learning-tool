/**
 * External dependencies.
 */
import { describe, expect, it, vi } from "vitest";

/**
 * Internal dependencies.
 */
import {
  buildDependencyClosure,
  entriesForManifest,
  type ParsedManifest,
} from "../dependencyClosure";

/** Builds a ParsedManifest with the given deps (all in `dependencies`). */
function manifest(
  uri: string,
  relativePath: string,
  deps: Array<[string, string]>,
): ParsedManifest {
  return {
    uri,
    relativePath,
    name: relativePath,
    dependencies: deps.map(([name, range]) => ({
      name,
      category: "dependencies",
      range,
    })),
  };
}

describe("buildDependencyClosure", () => {
  it("dedups identical (name, versionKey) pairs across manifests", async () => {
    const manifests = [
      manifest("a", "packages/a/package.json", [["lodash", "^4.17.0"]]),
      manifest("b", "packages/b/package.json", [["lodash", "4.17.21"]]),
    ];
    const resolve = vi.fn().mockResolvedValue("4.17.21");

    const closure = await buildDependencyClosure(manifests, resolve);

    expect(closure.uniqueCount).toBe(1);
    expect(closure.entries[0].name).toBe("lodash");
    expect(closure.entries[0].versionKey).toBe("4.17.21");
    expect(closure.entries[0].refs.map((ref) => ref.uri)).toEqual(["a", "b"]);
  });

  it("keeps distinct entries for different resolved versions", async () => {
    const manifests = [
      manifest("a", "a/package.json", [["lodash", "^4"]]),
      manifest("b", "b/package.json", [["lodash", "^3"]]),
    ];
    const resolve = vi
      .fn()
      .mockResolvedValueOnce("4.17.21")
      .mockResolvedValueOnce("3.10.1");

    const closure = await buildDependencyClosure(manifests, resolve);

    expect(closure.uniqueCount).toBe(2);
    expect(closure.entries.map((entry) => entry.versionKey).sort()).toEqual([
      "3.10.1",
      "4.17.21",
    ]);
  });

  it("sorts entries by name then version for stable output", async () => {
    const manifests = [
      manifest("a", "a/package.json", [
        ["zod", "3.0.0"],
        ["axios", "1.0.0"],
      ]),
    ];
    const resolve = vi.fn((_, dep) => Promise.resolve(dep.range));

    const closure = await buildDependencyClosure(manifests, resolve);

    expect(closure.entries.map((entry) => entry.name)).toEqual([
      "axios",
      "zod",
    ]);
  });

  it("entriesForManifest returns only refs for the given manifest", async () => {
    const manifests = [
      manifest("a", "a/package.json", [["lodash", "4.17.21"]]),
      manifest("b", "b/package.json", [["react", "19.0.0"]]),
    ];
    const resolve = vi.fn((_, dep) => Promise.resolve(dep.range));

    const closure = await buildDependencyClosure(manifests, resolve);
    const forA = entriesForManifest(closure, "a");

    expect(forA).toHaveLength(1);
    expect(forA[0].entry.name).toBe("lodash");
    expect(forA[0].ref.uri).toBe("a");
  });
});
