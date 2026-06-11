/**
 * External dependencies.
 */
import { describe, it, expect, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

/**
 * Internal dependencies.
 */
import { findCircularDependencies } from "../findCircularDependencies";

/**
 * Creates a throwaway project directory with a `package.json`, an `src/`
 * folder, and the given source files (paths relative to `src/`). Returns
 * the absolute project root so tests can pass it straight to the
 * analyzer.
 */
async function makeProject(sources: Record<string, string>): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "find-circular-deps-"));
  await fs.writeFile(
    path.join(dir, "package.json"),
    JSON.stringify({ name: "fixture", version: "1.0.0" }, null, 2),
    "utf8",
  );
  const srcDir = path.join(dir, "src");
  await fs.mkdir(srcDir, { recursive: true });
  for (const [relativePath, contents] of Object.entries(sources)) {
    const target = path.join(srcDir, relativePath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, contents, "utf8");
  }
  return dir;
}

describe("findCircularDependencies", () => {
  let projectDir: string | undefined;

  afterEach(async () => {
    if (projectDir) {
      await fs.rm(projectDir, { recursive: true, force: true });
      projectDir = undefined;
    }
  });

  it("returns no findings when the source tree has no cycles", async () => {
    projectDir = await makeProject({
      "a.js": "export const a = 1;\n",
      "b.js": "import { a } from './a.js';\nexport const b = a + 1;\n",
      "index.js": "import { b } from './b.js';\nexport default b;\n",
    });

    const result = await findCircularDependencies({ rootPath: projectDir });

    expect(result.findings).toEqual([]);
  });

  it("detects a simple two-file cycle", async () => {
    projectDir = await makeProject({
      "a.js": "import { b } from './b.js';\nexport const a = () => b;\n",
      "b.js": "import { a } from './a.js';\nexport const b = () => a;\n",
    });

    const result = await findCircularDependencies({ rootPath: projectDir });

    expect(result.findings.length).toBeGreaterThanOrEqual(1);
    const finding = result.findings[0];
    expect(finding.source).toBe("circular-deps");
    expect(finding.severity).toBe("warning");
    expect(finding.code).toContain("CIRCULAR_DEP");
    expect(finding.message).toMatch(/Circular dependency/i);
    const cycle = finding.data?.cycleRelative as string[] | undefined;
    expect(cycle).toBeDefined();
    expect(cycle!.length).toBeGreaterThanOrEqual(2);
    expect(cycle!.join(",")).toContain("a.js");
    expect(cycle!.join(",")).toContain("b.js");
  });

  it("attaches per-edge imported symbols to each cycle finding", async () => {
    projectDir = await makeProject({
      "a.js":
        "import { thingFromB } from './b.js';\nexport const thingFromA = () => thingFromB;\n",
      "b.js":
        "import { thingFromA } from './a.js';\nexport const thingFromB = () => thingFromA;\n",
    });

    const result = await findCircularDependencies({ rootPath: projectDir });
    const finding = result.findings[0];
    const edges = finding.data?.edges as
      | { symbols: string[]; fromIndex: number; toIndex: number }[]
      | undefined;
    expect(edges).toBeDefined();
    expect(edges!.length).toBeGreaterThanOrEqual(2);
    const allSymbols = edges!.flatMap((edge) => edge.symbols);
    expect(allSymbols).toContain("thingFromA");
    expect(allSymbols).toContain("thingFromB");
  });

  it("marks index-anchored cycles with the right symbols", async () => {
    const dir = await fs.mkdtemp(
      path.join(os.tmpdir(), "find-circular-deps-index-"),
    );
    projectDir = dir;
    await fs.writeFile(
      path.join(dir, "package.json"),
      JSON.stringify({ name: "fixture", version: "1.0.0" }, null, 2),
      "utf8",
    );
    const srcDir = path.join(dir, "src");
    await fs.mkdir(srcDir);
    await fs.writeFile(
      path.join(srcDir, "chipsList.tsx"),
      `import { ChipsFilter } from '.';\nexport const ChipList = () => null;\n`,
      "utf8",
    );
    await fs.writeFile(
      path.join(srcDir, "index.tsx"),
      `import { ChipList } from './chipsList';\nexport type ChipsFilter = string;\nexport { ChipList };\n`,
      "utf8",
    );

    const result = await findCircularDependencies({ rootPath: dir });
    expect(result.findings.length).toBeGreaterThanOrEqual(1);
    const edges = result.findings[0].data?.edges as
      | { symbols: string[] }[]
      | undefined;
    const allSymbols = (edges ?? []).flatMap((edge) => edge.symbols);
    expect(allSymbols).toContain("ChipsFilter");
    expect(allSymbols).toContain("ChipList");
  });

  it("returns a soft warning when no analyzable source directory exists", async () => {
    const tmp = await fs.mkdtemp(
      path.join(os.tmpdir(), "find-circular-deps-empty-"),
    );
    projectDir = tmp;
    // Project root exists but contains nothing analyzable. madge will
    // be pointed at the project root itself (the final fallback) and
    // simply return no cycles.
    await fs.writeFile(
      path.join(tmp, "package.json"),
      JSON.stringify({ name: "empty", version: "1.0.0" }),
      "utf8",
    );

    const result = await findCircularDependencies({ rootPath: tmp });

    expect(result.findings).toEqual([]);
  });

  it("skips the scan at a monorepo root marked by pnpm-workspace.yaml", async () => {
    const dir = await fs.mkdtemp(
      path.join(os.tmpdir(), "find-circular-deps-pnpm-"),
    );
    projectDir = dir;
    await fs.writeFile(
      path.join(dir, "package.json"),
      JSON.stringify({ name: "root", version: "1.0.0" }),
      "utf8",
    );
    await fs.writeFile(
      path.join(dir, "pnpm-workspace.yaml"),
      "packages:\n  - 'packages/*'\n",
      "utf8",
    );

    const result = await findCircularDependencies({ rootPath: dir });

    expect(result.findings).toEqual([]);
    expect(result.warnings.join(" ")).toMatch(/monorepo workspace root/i);
  });

  it("skips the scan at a monorepo root marked by a workspaces field", async () => {
    const dir = await fs.mkdtemp(
      path.join(os.tmpdir(), "find-circular-deps-workspaces-"),
    );
    projectDir = dir;
    await fs.writeFile(
      path.join(dir, "package.json"),
      JSON.stringify({
        name: "root",
        version: "1.0.0",
        workspaces: ["packages/*"],
      }),
      "utf8",
    );

    const result = await findCircularDependencies({ rootPath: dir });

    expect(result.findings).toEqual([]);
    expect(result.warnings.join(" ")).toMatch(/monorepo workspace root/i);
  });

  it("still scans an explicit sourceDir even at a workspace root", async () => {
    const dir = await fs.mkdtemp(
      path.join(os.tmpdir(), "find-circular-deps-ws-override-"),
    );
    projectDir = dir;
    await fs.writeFile(
      path.join(dir, "package.json"),
      JSON.stringify({
        name: "root",
        version: "1.0.0",
        workspaces: ["packages/*"],
      }),
      "utf8",
    );
    const pkgSrc = path.join(dir, "packages", "a", "src");
    await fs.mkdir(pkgSrc, { recursive: true });
    await fs.writeFile(
      path.join(pkgSrc, "a.js"),
      "import { b } from './b.js';\nexport const a = () => b;\n",
      "utf8",
    );
    await fs.writeFile(
      path.join(pkgSrc, "b.js"),
      "import { a } from './a.js';\nexport const b = () => a;\n",
      "utf8",
    );

    const result = await findCircularDependencies({
      rootPath: dir,
      sourceDir: path.join("packages", "a", "src"),
    });

    expect(result.findings.length).toBeGreaterThanOrEqual(1);
  });

  it("honours an explicit sourceDir override", async () => {
    const dir = await fs.mkdtemp(
      path.join(os.tmpdir(), "find-circular-deps-custom-"),
    );
    projectDir = dir;
    await fs.writeFile(
      path.join(dir, "package.json"),
      JSON.stringify({ name: "fixture", version: "1.0.0" }, null, 2),
      "utf8",
    );
    const customSrc = path.join(dir, "custom-src");
    await fs.mkdir(customSrc);
    await fs.writeFile(
      path.join(customSrc, "a.js"),
      "import { b } from './b.js';\nexport const a = () => b;\n",
      "utf8",
    );
    await fs.writeFile(
      path.join(customSrc, "b.js"),
      "import { a } from './a.js';\nexport const b = () => a;\n",
      "utf8",
    );

    const result = await findCircularDependencies({
      rootPath: dir,
      sourceDir: "custom-src",
    });

    expect(result.findings.length).toBeGreaterThanOrEqual(1);
  });
});
