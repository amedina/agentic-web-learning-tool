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
- [ ] Fix 1: skip circular scan at workspace root (project-analyzer-core)
- [ ] Fix 2: ProjectAnalysisTab reset effect keyed on activeFile.uri, not object
- [ ] Add/adjust tests
- [ ] Build npm-advisor and run lint/tests
- [ ] Commit, push, open PR

## Files Touched
- (pending)

## Blockers / Notes
- pnpm monorepo; build with `pnpm build:npm-advisor`.

## Next Action
Implement Fix 1 in findCircularDependencies.ts: add a workspace-root detection and skip the bare-root fallback for monorepo roots.
