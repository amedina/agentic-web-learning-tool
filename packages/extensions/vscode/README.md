# NPM Advisor for VSCode

Package intelligence, security insights, and dependency analysis for npm packages — directly inside VSCode.

## What you get

NPM Advisor surfaces information about every dependency in your `package.json` without making you leave the editor:

- **Hover popover** — hover any dependency to see its advisor score, last commit date, bundle size, security advisory count, license, and links to npm and GitHub.
- **CodeLens badge** — a compact one-line badge above each dependency, e.g. `Score 78 · 42KB · 2 advisories · MIT ✓`. Click it to open the package's npm page.
- **Problems panel diagnostics** — vulnerable, license-incompatible, unmaintained, or out-of-date dependencies appear in the Problems panel:
  - **Error** when a dependency has a security advisory at or above the configured severity floor.
  - **Warning** when its license is incompatible with your project's target license.
  - **Warning** when it appears unmaintained — no commits to its repository within the configured window.
  - **Information** when its installed major version trails the latest published release by the configured threshold.
- **Activity Bar entry** — a dedicated NPM Advisor side panel (a richer report view is coming in a future release).

The first lookup of any package takes a few seconds while NPM Advisor fetches data from npm, GitHub, and Bundlephobia. Subsequent lookups are instant — results are cached for 24 hours per package.

## Settings

Configure NPM Advisor under **Settings → Extensions → NPM Advisor**:

| Setting | Default | What it does |
|---|---|---|
| `npmAdvisor.targetLicense` | `MIT` | Project license used for compatibility checks. |
| `npmAdvisor.unmaintainedThresholdDays` | `730` | Days since last commit before a dependency is flagged as unmaintained. |
| `npmAdvisor.advisorySeverityFloor` | `high` | Lowest advisory severity (`critical` / `high` / `moderate` / `low`) that produces a Problems-panel diagnostic. |
| `npmAdvisor.outdatedMajorThreshold` | `2` | Major versions a dependency can be behind latest before being flagged as outdated. |

## Commands

Open the Command Palette (`⇧⌘P` on macOS, `Ctrl+Shift+P` elsewhere) and look under **NPM Advisor**:

- **NPM Advisor: View package on npm** — opens the npm page for a given dependency.
- **NPM Advisor: Clear cached package stats** — drops every cached entry. Useful after changing `targetLicense`, since cached license-compatibility results stay until the 24-hour TTL expires otherwise.
- **NPM Advisor: Run project analysis** — runs publint and a top-level replacement-opportunities scan against the current workspace folder and writes the findings to the Problems panel. Manual trigger only — never on save. Companion command **NPM Advisor: Clear project-analysis diagnostics** dismisses the results.
- **NPM Advisor: Run migration wizard** — three-step flow that rewrites source files: pick which codemod-eligible deps to migrate, preview the first changed file in a diff editor, then confirm to commit every change via a single `WorkspaceEdit` (undoable with `Ctrl+Z`). See _Migration wizard packaging_ below for the runtime requirement.

## Migration wizard packaging

The migration wizard depends on [`module-replacements-codemods`](https://www.npmjs.com/package/module-replacements-codemods), which transitively depends on [`@ast-grep/napi`](https://www.npmjs.com/package/@ast-grep/napi) — a Rust-backed AST library that ships **platform-specific native bindings** (`darwin-arm64`, `darwin-x64`, `linux-x64`, `linux-arm64`, `win32-x64`, …). Because esbuild can't bundle `.node` files, the wizard loads these libraries lazily at runtime via Node's normal `require()` resolution.

What this means in practice:

- **Running from source** (the dev / contributor experience) — the wizard works out of the box; `pnpm install` puts the binary for your platform in `node_modules`.
- **Marketplace / packaged `.vsix`** — the wizard will surface a friendly error explaining that `module-replacements-codemods` could not be loaded. Shipping it cross-platform requires VSCode's [platform-specific extension publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#platformspecific-extensions) — one `.vsix` per `--target` — which is tracked as a follow-up. The rest of NPM Advisor (hover, code lenses, diagnostics, project analysis) keeps working.

## Privacy

NPM Advisor calls the public npm registry, GitHub REST API, and Bundlephobia from your machine to gather package metadata. It does not send your `package.json` contents, source code, or any other workspace data anywhere. Cached results are stored locally in VSCode's global state.

## Issues

Report bugs and feature requests at <https://github.com/amedina/agentic-web-learning-tool/issues>.
