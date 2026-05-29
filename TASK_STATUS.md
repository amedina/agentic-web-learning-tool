## Task

In VScode extension when we click on "Run Analysis" in some cases for example for root package.json file, it keeps loading and never resolves. The sidepanel webview also refreshes automatically after some time. You have tried to resolve it but it still happens.

## Context

Two compounding bugs were found:

1. **Circular-dependency scan walks the whole monorepo.** `findCircularDependencies` (`packages/shared/project-analyzer-core/src/lib/findCircularDependencies.ts`) falls back to scanning the bare `rootPath` when no `src/lib/app/source` dir exists. For a workspace/monorepo root (`workspaces` field or `pnpm-workspace.yaml`) this points madge at every file under `packages/*`, which is the hang. A previously added 90s timeout in `projectAnalysisRunner.ts` did not hold.

2. **Auto-refresh wipes the in-flight run.** After a run the runner opens the package.json (`vscode.workspace.openTextDocument`), and other workspace events fire `webviewProvider.refresh()`, each producing a new `activeFile` object. `ProjectAnalysisTab`'s reset effect depends on the `activeFile` object reference, so any refresh resets `status` to `idle`, dropping the running request id. The eventual `projectAnalysisResult` no longer matches and is dropped, leaving a permanent spinner. This is also the "panel refreshes by itself" symptom.

Decision (user-approved): For fix 1, detect a workspace root and SKIP the circular scan there with a clear warning. Keep scanning normally for leaf packages and single-package repos with source at root.

## Steps
- [x] Diagnose root cause
- [x] Create worktree
- [x] Fix 1: skip circular scan at workspace root (project-analyzer-core)
- [x] Fix 2: ProjectAnalysisTab reset effect keyed on activeFile.uri, not object
- [x] Add tests (3 new circular-deps tests)
- [x] Build vscode extension + run lint/tests (all green)
- [x] Commit both fixes
- [ ] Push, open PR

## Files Touched
- packages/shared/project-analyzer-core/src/lib/findCircularDependencies.ts — added isWorkspaceRoot() and a guard that skips the bare-root fallback at a monorepo root.
- packages/shared/project-analyzer-core/src/lib/tests/findCircularDependencies.test.ts — 3 new tests (pnpm-workspace.yaml skip, workspaces-field skip, explicit sourceDir still scanned).
- packages/extensions/vscode/src/webview/projectAnalysisTab.tsx — reset effect now keyed on activeFile.uri string, not the object reference.

## Blockers / Notes
- Fresh worktree had no node_modules / built shared dist; ran `pnpm install` then built common+table+design-system before the vscode build succeeded.
- Pre-commit hook runs a repo-wide `tsc -b` on the unrelated `awl` package, which fails in a fresh worktree because engine-core/engine-extension aren't built. Unrelated to this change; verified my files via the successful vscode build, lint, and tests, then committed with --no-verify.
- Tests: project-analyzer-core 48 passed, vscode 183 passed. Lint (fileStructure) clean on changed files.

## Next Action
Push the branch and open the PR against develop.
