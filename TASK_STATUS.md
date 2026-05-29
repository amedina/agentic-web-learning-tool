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
- [ ] parseLockfile.ts: add `importers` to ParsedLockfile, parse per-importer, add `resolutionsForImporter`
- [ ] MCP: add importer-path helper + wire getPackageStats & analyzePackageJson
- [ ] VSCode lockfileResolver: select importer by relative path
- [ ] Tests (analyzer-core, vscode resolver, MCP)
- [ ] Build npm-advisor + run tests
- [ ] PR description + push

## Files Touched
- (pending)

## Blockers / Notes
- pnpm v9 lockfile; `workspace:*` deps resolve to `link:...` (non-semver) and are
  correctly omitted by `isResolvableSemver`.

## Next Action
Edit parseLockfile.ts to add per-importer parsing and the resolutionsForImporter helper.
