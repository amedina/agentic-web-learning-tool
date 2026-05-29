/**
 * External dependencies.
 */
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

/**
 * Internal dependencies.
 */
import * as vscodeMock from "../../test/vscodeMock";
import { LockfileResolver } from "../lockfileResolver";

const fixtures = {
  npmV3: `{
  "name": "demo",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "demo",
      "version": "1.0.0",
      "dependencies": { "lodash": "^4.0.0", "react": "^18.0.0" }
    },
    "node_modules/lodash": { "version": "4.17.20" },
    "node_modules/react": { "version": "18.2.0" }
  }
}
`,
  pnpmV9: `lockfileVersion: '9.0'

settings:
  autoInstallPeers: true

importers:
  .:
    dependencies:
      react:
        specifier: ^18.0.0
        version: 18.2.0
  packages/a:
    dependencies:
      react:
        specifier: ^18.0.0
        version: 18.2.0

packages:
  react@18.2.0:
    resolution: {integrity: sha512-x}
`,
  pnpmV9Workspace: `lockfileVersion: '9.0'

settings:
  autoInstallPeers: true

importers:
  .:
    dependencies:
      react:
        specifier: ^18.0.0
        version: 18.2.0
  packages/extensions/vscode:
    dependencies:
      react:
        specifier: ^19.1.1
        version: 19.2.4
    devDependencies:
      '@types/node':
        specifier: ^24.3.0
        version: 24.12.0

packages:
  react@18.2.0:
    resolution: {integrity: sha512-x}
  react@19.2.4:
    resolution: {integrity: sha512-y}
`,
};

let tempRoot: string;

beforeEach(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "lockfile-resolver-"));
  vscodeMock._watchersForTests.clear();
});

afterEach(async () => {
  await fs.rm(tempRoot, { recursive: true, force: true });
});

/**
 * Create a package.json + lockfile pair under the given relative subdir
 * of the temp root and return the package.json URI.
 */
async function setupProject(
  subdir: string,
  lockfileName: string,
  lockfileContents: string,
): Promise<vscodeMock.Uri> {
  const dir = path.join(tempRoot, subdir);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, "package.json"),
    JSON.stringify({ name: "demo", version: "1.0.0" }),
  );
  await fs.writeFile(path.join(dir, lockfileName), lockfileContents);
  return vscodeMock.Uri.file(path.join(dir, "package.json"));
}

describe("LockfileResolver", () => {
  it("resolves a dependency to its installed version from package-lock.json", async () => {
    const uri = await setupProject(".", "package-lock.json", fixtures.npmV3);
    const resolver = new LockfileResolver();
    try {
      expect(await resolver.resolveVersion(uri as never, "lodash")).toBe(
        "4.17.20",
      );
      expect(await resolver.resolveVersion(uri as never, "react")).toBe(
        "18.2.0",
      );
    } finally {
      resolver.dispose();
    }
  });

  it("resolves from a pnpm-lock.yaml at the workspace root", async () => {
    const uri = await setupProject("packages/a", "pnpm-lock.yaml", "");
    // Overwrite — the helper places the lockfile in the same dir as
    // package.json. Move it to the project root and re-create.
    await fs.rm(path.join(tempRoot, "packages/a/pnpm-lock.yaml"));
    await fs.writeFile(path.join(tempRoot, "pnpm-lock.yaml"), fixtures.pnpmV9);
    const resolver = new LockfileResolver();
    try {
      expect(await resolver.resolveVersion(uri as never, "react")).toBe(
        "18.2.0",
      );
    } finally {
      resolver.dispose();
    }
  });

  it("resolves a sub-package against its own importer in a pnpm workspace", async () => {
    const uri = await setupProject(
      "packages/extensions/vscode",
      "pnpm-lock.yaml",
      "",
    );
    await fs.rm(
      path.join(tempRoot, "packages/extensions/vscode/pnpm-lock.yaml"),
    );
    await fs.writeFile(
      path.join(tempRoot, "pnpm-lock.yaml"),
      fixtures.pnpmV9Workspace,
    );
    const resolver = new LockfileResolver();
    try {
      expect(await resolver.resolveVersion(uri as never, "@types/node")).toBe(
        "24.12.0",
      );
      // The sub-package pins react 19, not the root's 18.
      expect(await resolver.resolveVersion(uri as never, "react")).toBe(
        "19.2.4",
      );
    } finally {
      resolver.dispose();
    }
  });

  it("does not leak root-importer deps to a sub-package", async () => {
    const rootUri = await setupProject(".", "pnpm-lock.yaml", "");
    await fs.writeFile(
      path.join(tempRoot, "pnpm-lock.yaml"),
      fixtures.pnpmV9Workspace,
    );
    const subDir = path.join(tempRoot, "packages/extensions/vscode");
    await fs.mkdir(subDir, { recursive: true });
    await fs.writeFile(
      path.join(subDir, "package.json"),
      JSON.stringify({ name: "vscode", version: "1.0.0" }),
    );
    const subUri = vscodeMock.Uri.file(path.join(subDir, "package.json"));
    const resolver = new LockfileResolver();
    try {
      // root has react@18 but no @types/node; sub has @types/node@24.
      expect(await resolver.resolveVersion(rootUri as never, "react")).toBe(
        "18.2.0",
      );
      expect(
        await resolver.resolveVersion(rootUri as never, "@types/node"),
      ).toBeUndefined();
      expect(
        await resolver.resolveVersion(subUri as never, "@types/node"),
      ).toBe("24.12.0");
    } finally {
      resolver.dispose();
    }
  });

  it("returns undefined when no lockfile is found anywhere above", async () => {
    const dir = path.join(tempRoot, "no-lockfile");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "package.json"), "{}");
    const uri = vscodeMock.Uri.file(path.join(dir, "package.json"));
    const resolver = new LockfileResolver();
    try {
      expect(
        await resolver.resolveVersion(uri as never, "react"),
      ).toBeUndefined();
    } finally {
      resolver.dispose();
    }
  });

  it("returns undefined for a dep that isn't in the lockfile", async () => {
    const uri = await setupProject(".", "package-lock.json", fixtures.npmV3);
    const resolver = new LockfileResolver();
    try {
      expect(
        await resolver.resolveVersion(uri as never, "not-installed"),
      ).toBeUndefined();
    } finally {
      resolver.dispose();
    }
  });

  it("memoises the discovery and parse per directory", async () => {
    const uri = await setupProject(".", "package-lock.json", fixtures.npmV3);
    const resolver = new LockfileResolver();
    try {
      const first = await resolver.resolveVersion(uri as never, "lodash");
      const second = await resolver.resolveVersion(uri as never, "react");
      expect(first).toBe("4.17.20");
      expect(second).toBe("18.2.0");
      // Only one watcher should have been created — we hit the cache on
      // the second call.
      expect(vscodeMock._watchersForTests.list()).toHaveLength(1);
    } finally {
      resolver.dispose();
    }
  });

  it("invalidates the cache when the lockfile changes", async () => {
    const uri = await setupProject(".", "package-lock.json", fixtures.npmV3);
    const resolver = new LockfileResolver();
    try {
      expect(await resolver.resolveVersion(uri as never, "lodash")).toBe(
        "4.17.20",
      );

      // Update the lockfile on disk and fire the watcher.
      const updated = fixtures.npmV3.replace('"4.17.20"', '"4.17.21"');
      await fs.writeFile(path.join(tempRoot, "package-lock.json"), updated);
      const [watcher] = vscodeMock._watchersForTests.list();
      watcher.__fire(
        "change",
        vscodeMock.Uri.file(path.join(tempRoot, "package-lock.json")),
      );

      expect(await resolver.resolveVersion(uri as never, "lodash")).toBe(
        "4.17.21",
      );
    } finally {
      resolver.dispose();
    }
  });

  it("fires onDidChange when the lockfile updates", async () => {
    const uri = await setupProject(".", "package-lock.json", fixtures.npmV3);
    const resolver = new LockfileResolver();
    let fired = false;
    try {
      // Seed the cache so the watcher exists.
      await resolver.resolveVersion(uri as never, "lodash");
      resolver.onDidChange(() => {
        fired = true;
      });
      const [watcher] = vscodeMock._watchersForTests.list();
      watcher.__fire(
        "change",
        vscodeMock.Uri.file(path.join(tempRoot, "package-lock.json")),
      );
      expect(fired).toBe(true);
    } finally {
      resolver.dispose();
    }
  });
});
