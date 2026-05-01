# NPM Advisor for VSCode

Package intelligence, security insights, dependency analysis, and AI-powered evaluation for npm packages — directly inside VSCode.

## What it is

NPM Advisor for VSCode is the editor-side counterpart to the [NPM Advisor Chrome extension](../npm-advisor). The Chrome extension shines when you are *browsing* npm and GitHub. The VSCode extension shines when you are *coding* — it surfaces the same package intelligence right next to your `package.json`, your imports, and your lockfile, without making you leave the editor.

Both extensions share the analysis engine in [`@agentic-web-labs/package-analyzer-core`](../../shared/package-analyzer-core) and the UI primitives in [`@agentic-web-labs/package-analyzer-ui`](../../shared/package-analyzer-ui), so package scores and metrics are consistent across surfaces.

## Planned features

The extension is being built in tiers. Tier 1 focuses on inline feedback inside `package.json`:

- **Hover provider** — hover any dependency to see its advisor score, last commit date, bundle size, security advisory count, and license check.
- **CodeLens** — a compact one-line badge above each dependency with the same data at a glance.
- **Diagnostics** — vulnerable, license-incompatible, unmaintained, or out-of-date dependencies show up in the Problems panel.

Later tiers add a side-panel webview that reuses the existing React dashboards, codemod-driven migrations powered by [`@e18e/cli`](https://github.com/e18e/cli), and an AI chat panel that is aware of your project's actual dependencies.

## Build the `.vsix`

From the **repository root**:

```sh
pnpm build:vscode
```

The packaged extension is written to:

```
dist/vscode-npm-advisor/vscode-npm-advisor-<version>.vsix
```

Share that file with anyone who wants to install the extension without building it themselves.

## Install the `.vsix`

Either install from the command line:

```sh
code --install-extension dist/vscode-npm-advisor/vscode-npm-advisor-<version>.vsix
```

Or from inside VSCode:

1. Open the **Extensions** view (`⇧⌘X` on macOS, `Ctrl+Shift+X` elsewhere).
2. Click the `…` menu in the top-right of the Extensions view.
3. Choose **Install from VSIX…** and pick the `.vsix` file.

## Develop

From the repository root, start an esbuild watcher in the background:

```sh
pnpm dev:vscode
```

Then open [`packages/extensions/vscode`](.) in VSCode and press `F5`. That launches an Extension Development Host — a second VSCode window with the extension loaded against the watched bundle. Edit any file under `src/`, esbuild rebuilds, and you can reload the host window (`⌘R` / `Ctrl+R`) to pick up changes.

The launch configuration is in [`.vscode/launch.json`](.vscode/launch.json) and runs the `npm: build` task before launching to make sure `dist/extension.js` is up to date.

## Other scripts

```sh
pnpm test:vscode         # run vitest unit tests
pnpm format:vscode       # run prettier on the package
pnpm --filter vscode-npm-advisor check-types   # type-check without emitting
```

## Layout

```
src/
├── extension.ts          # activate / deactivate entry points
└── ...                   # providers, commands, cache, parsers (added per Tier 1 task)

esbuild.config.js         # bundles src/extension.ts → dist/extension.js (CJS, node20, vscode external)
                          # in production mode, also calls vsce to package the .vsix
.vscode/launch.json       # F5 → Extension Development Host
.vscodeignore             # excluded from .vsix (everything except dist/)
```

## Related

- [NPM Advisor Chrome extension](../npm-advisor) — browser side of the same project
- [`@agentic-web-labs/package-analyzer-core`](../../shared/package-analyzer-core) — analysis engine
- [`@agentic-web-labs/package-analyzer-ui`](../../shared/package-analyzer-ui) — shared React widgets
- [`@e18e/cli`](https://github.com/e18e/cli) — project-wide audit and codemod tool that powers later tiers
