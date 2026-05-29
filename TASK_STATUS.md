## Task

The VSCode extension is unable to locate a lockfile for packages inside the
`packages/` folders because those packages do not have their own lockfile. The
single root `pnpm-lock.yaml` is the workspace lockfile for all workspace
packages. We want to show stats and vulnerabilities based on the version that is
actually installed. Handle these cases.

## Context

Root cause: in a pnpm workspace there is a single `pnpm-lock.yaml` at the
workspace root. Its `importers` map is keyed by each package's path relative to
the root (e.g. `packages/extensions/vscode`). `parsePnpmLockfile` in
`package-analyzer-core` only read `importers["."]` (the root package's own
deps), so when a hover/diagnostic walked up from a sub-package's `package.json`
and found the root lockfile, the sub-package's dependencies were never in
`topLevel`. The resolver therefore returned `undefined` and the hover fell back
to "No lockfile found, showing latest" even though the version was right there
in the lockfile.

Verified against the real repo lockfile: `@types/node` under
`packages/extensions/vscode` resolves to `24.12.0`, which matches the
screenshot.

Approach chosen: expose per-importer resolutions from the parser
(`ParsedLockfile.importers`) plus a pure `resolutionsForImporter(parsed,
importerPath)` helper. Each node-side caller (VSCode `lockfileResolver`, MCP
`getPackageStats`, MCP `analyzePackageJson`) computes the importer path as the
posix-relative path from the lockfile's directory to the package.json's
directory and selects the matching importer. `topLevel` stays populated with the
root importer for backward compatibility. When a lockfile HAS an importer graph
but the package is not a member, we return no resolution (latest-fallback)
rather than misattributing the root package's versions.

## Steps
- [x] Investigate lockfile resolution + installed-version flow
- [x] Confirm root cause against the real pnpm-lock.yaml
- [x] Create worktree + TASK_STATUS.md
- [x] parseLockfile.ts: add `importers` to ParsedLockfile, parse per-importer, add `resolutionsForImporter`
- [x] MCP: add importer-path helper + wire getPackageStats & analyzePackageJson
- [x] VSCode lockfileResolver: select importer by relative path
- [x] Tests (analyzer-core, vscode resolver, MCP)
- [x] Build npm-advisor / mcp / vscode + run tests (all green)
- [ ] PR description + push

## Files Touched
- packages/shared/package-analyzer-core/src/utils/parseLockfile.ts — added `ParsedLockfile.importers` (per-importer maps) and exported `resolutionsForImporter`; pnpm parser now builds a map per importer, `topLevel` mirrors `.` for back-compat.
- packages/mcp/npm-advisor-mcp/src/workspace/importerPath.ts — new `importerPathFor(lockfilePath, packageJsonPath)` helper.
- packages/mcp/npm-advisor-mcp/src/tools/getPackageStats.ts — resolve via `resolutionsForImporter` for the package's importer.
- packages/mcp/npm-advisor-mcp/src/tools/analyzePackageJson.ts — resolve every dep via the package's importer.
- packages/extensions/vscode/src/workspace/lockfileResolver.ts — `resolveVersion` selects the importer by posix-relative path from the lockfile dir.
- tests: parseLockfile.test.ts (+ pnpm-lock.v9-workspace.yaml fixture), lockfileResolver.test.ts, importerPath.test.ts.

## Blockers / Notes
- pnpm v9 lockfile; `workspace:*` deps resolve to `link:...` (non-semver) and are
  correctly omitted by `isResolvableSemver`.
- Pre-existing, unrelated type errors exist on `develop` in
  package-analyzer-core/src/lib/getPackageStats.ts and a githubFetch test; not
  touched here.
- Fresh worktrees need workspace deps built (engine-core, engine-extension,
  engine-web, workflow-ui, chrome-ai-playground, common, table, design-system)
  before the husky `pnpm check-types` pre-commit hook passes.

## Next Action
Push the branch and open the PR against develop.
