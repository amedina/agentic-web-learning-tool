# Contributing to NPM Advisor for VSCode

Internal documentation for the `vscode-npm-advisor` package. End-user docs live in [README.md](README.md).

## Architecture

The extension is the editor-side counterpart to the [NPM Advisor Chrome extension](../npm-advisor). Both share:

- [`@agentic-web-labs/package-analyzer-core`](../../shared/package-analyzer-core) — analysis engine (npm / GitHub / Bundlephobia fetching, scoring, license-compat matrix).
- [`@agentic-web-labs/package-analyzer-ui`](../../shared/package-analyzer-ui) — React widgets reused by the eventual webview report.

The Chrome extension shines when you are *browsing* npm and GitHub. The VSCode extension shines when you are *coding* — surfacing the same package intelligence inline in `package.json`, hovers, and the Problems panel.

## Build the `.vsix`

From the **repository root**:

```sh
pnpm build:vscode
```

The packaged extension is written to:

```
dist/vscode-npm-advisor/vscode-npm-advisor-<version>.vsix
```

Share that file with anyone who wants to install the extension without the marketplace.

## Install the `.vsix` locally

```sh
code --install-extension /absolute/path/to/dist/vscode-npm-advisor/vscode-npm-advisor-<version>.vsix --force
```

Then **fully quit** VSCode (`⌘Q` on macOS — closing the window is not enough) and reopen. The activity bar icon appears once VSCode picks up the new install.

## Deploy a worktree build and reinstall

When you build inside a git worktree, run `pnpm deploy:local <branch-or-worktree-name>` from the repository root to copy that worktree's `dist/` into the main checkout's root `dist/`.

To reinstall the extension in the same step, set `DEPLOY_LOCAL_VSIX_PATH` in `packages/extensions/vscode/.env` (see [`.env.example`](.env.example)) to opt in. Point it at the `dist/vscode-npm-advisor` directory (or any `.vsix` path inside it — the version in the filename is ignored):

```sh
DEPLOY_LOCAL_VSIX_PATH=/absolute/path/to/dist/vscode-npm-advisor
```

With it set, `deploy:local` installs the **newest** `.vsix` in that directory via `code --install-extension <path> --force` after copying the build, so you never have to update this after a version bump. **Reload the VSCode window** (`⌘⇧P` / `Ctrl+Shift+P`, then `Developer: Reload Window`) to view the changes. Leave the variable unset to skip the install entirely.

Notes:

- On a first install a window reload is not enough. Fully quit and reopen VSCode as in [Install the `.vsix` locally](#install-the-vsix-locally) so the activity bar icon appears.
- `deploy:local` always installs the newest `.vsix` in the directory, so stale `.vsix` files from earlier builds are ignored and version bumps need no `.env` edit.
- `deploy:local` skips the install gracefully when the `code` CLI is not on `PATH`.

## Develop with F5

From the repository root, start the esbuild watcher:

```sh
pnpm dev:vscode
```

Then open [`packages/extensions/vscode`](.) in VSCode and press `F5`. That launches an **Extension Development Host** — a second VSCode window with the extension loaded against the watched bundle. Edit any file under `src/`, esbuild rebuilds, and you can reload the host window (`⌘R` / `Ctrl+R`) to pick up changes.

The launch configuration is in [`.vscode/launch.json`](.vscode/launch.json) and runs the `npm: build` task before launching to make sure `dist/extension.js` is up to date.

## Other scripts

```sh
pnpm test:vscode                                 # run vitest unit tests
pnpm format:vscode                               # run prettier on the package
pnpm --filter vscode-npm-advisor check-types     # type-check without emitting
```

## Source layout

```
src/
├── extension.ts              # activate / deactivate entry points; wires everything together
├── cache/
│   └── statsCache.ts         # Memento-backed TTL cache for PackageStats with stale-while-revalidate
├── codeLens/
│   └── format.ts             # pure formatter for the badge text
├── commands/
│   ├── viewPackage.ts        # NPM Advisor: View package on npm
│   └── clearCache.ts         # NPM Advisor: Clear cached package stats
├── diagnostics/
│   ├── rules.ts              # pure rules engine (advisory / license / unmaintained / outdated)
│   ├── runner.ts             # owns the DiagnosticCollection and refresh lifecycle
│   └── settings.ts           # reads npmAdvisor.* configuration
├── hover/
│   └── render.ts             # pure markdown renderer for hovers
├── packageJson/
│   └── parse.ts              # jsonc-parser walker that returns dependency entries with ranges
├── providers/
│   ├── hoverProvider.ts      # vscode.HoverProvider glue
│   └── codeLensProvider.ts   # two-phase vscode.CodeLensProvider glue
└── test/
    └── vscodeMock.ts         # minimal vscode shim used by unit tests via vitest alias

esbuild.config.js             # bundles src/extension.ts → dist/extension.js (CJS, node20)
                              # in production mode also calls vsce to produce the .vsix
.vscode/launch.json           # F5 → Extension Development Host
.vscodeignore                 # excludes from .vsix (everything except dist/, media/, LICENSE, README)
```

## Tests

Unit tests live in `tests/` folders sibling to the file under test (e.g. `src/cache/tests/statsCache.test.ts`). Vitest is configured with a `vscode` module alias pointing at [src/test/vscodeMock.ts](src/test/vscodeMock.ts) so pure logic can run outside the extension host. Provider classes are deliberately not unit-tested — they are thin glue and are covered by manual smoke testing in the dev host.

## Related packages

- [NPM Advisor Chrome extension](../npm-advisor)
- [`@agentic-web-labs/package-analyzer-core`](../../shared/package-analyzer-core)
- [`@agentic-web-labs/package-analyzer-ui`](../../shared/package-analyzer-ui)
- [`@e18e/cli`](https://github.com/e18e/cli) — project-wide audit and codemod tool that powers later tiers
