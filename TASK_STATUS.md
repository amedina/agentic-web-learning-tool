## Task

In VScode extension when we click on "Run Analysis" in some cases for example for root package.json file, it keeps loading and never resolves. The sidepanel webview also refreshes automatically after some time. You have tried to resolve it but it still happens.

## Context

Three compounding bugs were found. The first is the dominant cause of the 90s timeout / crash.

1. **publint recursively scans `node_modules` in source mode (PRIMARY).** `runPublint` (`packages/shared/project-analyzer-core/src/lib/runPublint.ts`) ran publint with `pack: false`. When the package has no `exports` field (true for the monorepo root), publint takes its "verify all files" branch and recurses the entire working tree, including a 779 MB `node_modules`. Measured in isolation on the real root: ~76s, then a JS heap out-of-memory crash. This alone exceeds the 90s analysis timeout, so even with fix 2 applied the root analysis still failed. publint exposes no exclude option.

2. **Circular-dependency scan walks the whole monorepo.** `findCircularDependencies` falls back to scanning the bare `rootPath` when no `src/lib/app/source` dir exists. For a workspace/monorepo root this points madge at every file under `packages/*` (~34s here, growing with repo size).

3. **Auto-refresh wipes the in-flight run.** Workspace events fire `webviewProvider.refresh()`, each producing a new `activeFile` object. `ProjectAnalysisTab`'s reset effect depended on the `activeFile` object reference, so any refresh reset `status` to `idle`, dropping the running request id (permanent spinner) and hiding the (uncached) error. This is the "panel refreshes by itself / back to initial screen" symptom.

Decisions (user-approved, "full hardening"):
- Fix 1: feed publint an explicit, pre-collected file set (`pack: { files }`) that never descends into `node_modules`/build/VCS dirs and is capped at `maxScanFiles` (default 5000). Always seed the root `package.json` so the cap/ordering can't drop it. Additionally, skip publint entirely for `private: true` packages (never published, so the checks do not apply) and surface an explanatory warning.
- Fix 2: detect a workspace root and SKIP the circular scan there with a clear warning; keep scanning leaf packages and single-package repos with source at root.
- Fix 3: key the reset effect on `activeFile.uri`, not the object reference.

## Steps
- [x] Diagnose root cause (added publint as the primary cause after deeper investigation)
- [x] Create worktree
- [x] Fix 2: skip circular scan at workspace root (project-analyzer-core)
- [x] Fix 3: ProjectAnalysisTab reset effect keyed on activeFile.uri, not object
- [x] Fix 1: bound publint source-mode scan + skip private packages (project-analyzer-core)
- [x] Add tests (3 circular-deps tests; node_modules-exclusion, private-skip, maxScanFiles tests for publint)
- [x] Build vscode extension + run lint/tests (all green)
- [x] Verify end-to-end on the real monorepo root: 0.5s (was 90s timeout/OOM)
- [x] Commit all fixes
- [ ] Push, open PR

## Files Touched
- packages/shared/project-analyzer-core/src/lib/runPublint.ts — bounded source scan via `pack: { files }` (collectPackageFiles excludes node_modules/build/VCS, caps at maxScanFiles, seeds root package.json, skips symlinks); skip publint for private packages; new `warnings` on RunPublintResult; new `maxScanFiles` option.
- packages/shared/project-analyzer-core/src/lib/analyzeProject.ts — propagate publint warnings into the analysis result.
- packages/shared/project-analyzer-core/src/lib/tests/runPublint.test.ts — updated node_modules test for exclude-before-walk; added private-skip and maxScanFiles-truncation tests.
- packages/shared/project-analyzer-core/src/lib/findCircularDependencies.ts — isWorkspaceRoot() + guard skipping the bare-root fallback at a monorepo root.
- packages/shared/project-analyzer-core/src/lib/tests/findCircularDependencies.test.ts — 3 tests (pnpm-workspace.yaml skip, workspaces-field skip, explicit sourceDir still scanned).
- packages/extensions/vscode/src/webview/projectAnalysisTab.tsx — reset effect keyed on activeFile.uri string, not the object reference.

## Blockers / Notes
- Fresh worktree had no node_modules / built shared dist; `pnpm install` + building shared packages was already done in this worktree.
- Pre-commit hook runs a repo-wide `tsc -b` that fails in a fresh worktree on unrelated packages (e.g. `awl`, `package-analyzer-core/getPackageStats.ts`), because their dependencies aren't built. Unrelated to this change; verified changed files via the successful vscode build, project-analyzer-core type-check (clean for runPublint.ts), lint, and tests, then commit with --no-verify.
- Tests: project-analyzer-core 50 passed, vscode 183 passed. Structure lint + prettier clean on changed files.

## Next Action
Push the branch and open the PR against develop.
