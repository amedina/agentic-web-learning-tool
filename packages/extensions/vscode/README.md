# NPM Advisor for VSCode

Package intelligence, security insights, and dependency analysis for npm packages, directly inside VSCode.

## What you get

NPM Advisor surfaces information about every dependency in your `package.json` without making you leave the editor:

- **Hover popover**: hover any dependency to see its fitness score, last commit date, bundle size, security advisory count, license, and links to npm and GitHub. When a lockfile (`package-lock.json` / `pnpm-lock.yaml` / `yarn.lock`) is present the hover shows **Installed · Range · Latest** and runs advisory matching against the version you actually have on disk; without a lockfile it shows the latest version with a clear footer noting that no lockfile was found.
- **Problems panel diagnostics**: vulnerable, license-incompatible, unmaintained, or out-of-date dependencies appear in the Problems panel:
  - **Error** when a dependency has a security advisory at or above the configured severity floor.
  - **Warning** when its license is incompatible with your project's target license.
  - **Warning** when it appears unmaintained, with no commits to its repository within the configured window.
  - **Information** when its installed major version trails the latest published release by the configured threshold.
  Advisory messages annotate which version they reference: `(installed 4.17.20)` when a lockfile resolved it, `(no lockfile, showing latest 4.17.21)` otherwise.
- **Activity Bar side panel** provides a dedicated NPM Advisor view with a top-level toggle between **This package** and **Project Health**:
  - **This package** focuses on the active `package.json` and has two tabs:
    - **Dependencies**: every dependency in the active `package.json` with score, bundle size, advisory count, and a per-row drill-down.
    - **Project Analysis**: `publint` findings and `e18e` replacement opportunities, surfaced in both the panel and the Problems panel. Triggered manually via the **Run project analysis** command (never on save).
  - **Project Health** rolls up dependency vulnerabilities and license compatibility across every `package.json` in the workspace. It can run automatically once a day and notify you with a summary (on by default, configurable via `npmAdvisor.projectHealth.autoRun`), or on demand via the **Run full Project Health analysis** command.

Advisory coverage pulls from both **GitHub Security Advisories** and **OSV** (Open Source Vulnerabilities), deduplicated by canonical id. Each finding is filtered against the version your lockfile resolves to, so a CVE that only affects an older version no longer trips a warning on a newer install.

The first lookup of any package takes a few seconds while NPM Advisor fetches from npm, GitHub, OSV, and Bundlephobia. Subsequent lookups are instant because results are cached for 24 hours per package and shared with the side panel.

## Settings

Configure NPM Advisor under **Settings → Extensions → NPM Advisor**:

| Setting | Default | What it does |
|---|---|---|
| `npmAdvisor.targetLicense` | `MIT` | Project license used for compatibility checks. |
| `npmAdvisor.unmaintainedThresholdDays` | `730` | Days since last commit before a dependency is flagged as unmaintained. |
| `npmAdvisor.advisorySeverityFloor` | `high` | Lowest advisory severity (`critical` / `high` / `moderate` / `low`) that produces a Problems-panel diagnostic. |
| `npmAdvisor.outdatedMajorThreshold` | `2` | Major versions a dependency can be behind latest before being flagged as outdated. |
| `npmAdvisor.projectHealth.autoRun` | `daily` | Run the workspace-wide Project Health check (vulnerabilities and license compatibility across every `package.json`) once a day and notify you. Set to `off` to disable. |

## Commands

Open the Command Palette (`⇧⌘P` on macOS, `Ctrl+Shift+P` elsewhere) and look under **NPM Advisor**:

- **NPM Advisor: View package on npm** opens the npm page for a given dependency.
- **NPM Advisor: Show full insights for a package** opens the side panel and focuses the given package.
- **NPM Advisor: Clear cached package stats** drops every cached entry. Useful after changing `targetLicense`, since cached license-compatibility results stay until the 24-hour TTL expires otherwise.
- **NPM Advisor: Run project analysis** runs publint and a top-level replacement-opportunities scan against the current workspace folder and writes the findings to the Problems panel. It is a manual trigger only, never on save. The companion command **NPM Advisor: Clear project-analysis diagnostics** dismisses the results.
- **NPM Advisor: Run full Project Health analysis** runs the workspace-wide dependency health check (vulnerabilities and license compatibility across every `package.json`) and shows the roll-up in the Project Health view.
- **NPM Advisor: Run daily dependency health check now** runs the vulnerabilities and licenses check immediately and posts the summary notification, the same one the daily auto-run uses.
- **NPM Advisor: Run migration wizard** is a three-step flow that rewrites source files: pick which codemod-eligible deps to migrate, preview the first changed file in a diff editor, then confirm to commit every change via a single `WorkspaceEdit` (undoable with `Ctrl+Z`). See _Migration wizard packaging_ below for the runtime requirement.
- **NPM Advisor: Set up MCP server for AI clients (Claude Code, Cursor, …)** opens a one-click setup webview that installs the npm-advisor MCP server into the AI clients you already have on this machine and skips the ones you don't. The companion command **NPM Advisor: Remove MCP server from AI clients** undoes it.
- **NPM Advisor: Sign in to GitHub (lifts API rate limit)** authenticates with GitHub via VSCode's built-in OAuth flow so analyzer-core's GitHub fetches use the user's 5 000-req/hr quota instead of the 60-req/hr anonymous one. The companion command **Disconnect GitHub session** drops the credential.

## Chat participant

In Copilot Chat (or any GitHub Models chat surface in VSCode), invoke `@npm-advisor` to ask about the dependencies in your active `package.json`. The participant pulls scores, licenses, advisories, alternatives, and replacement codemods from analyzer-core and answers grounded against the cache.

## MCP server (Claude Code / Cursor / Claude Desktop / Windsurf / Continue)

The same analyzer the extension uses ships as an MCP server (`@agentic-web-labs/npm-advisor-mcp`). Run the setup command above and pick which clients to register. The wizard knows which configuration file each one wants and writes only the entries the user opts in to. The MCP server exposes `get_package_stats`, `analyze_package_json`, `analyze_project`, `list_known_vscode_projects`, and `list_workspace_dependencies` tools.

## Migration wizard packaging

The migration wizard depends on [`module-replacements-codemods`](https://www.npmjs.com/package/module-replacements-codemods), which transitively depends on [`@ast-grep/napi`](https://www.npmjs.com/package/@ast-grep/napi), a Rust-backed AST library that ships **platform-specific native bindings** (`darwin-arm64`, `darwin-x64`, `linux-x64`, `linux-arm64`, `win32-x64`, …). Because esbuild can't bundle `.node` files, the wizard loads these libraries lazily at runtime via Node's normal `require()` resolution.

What this means in practice:

- **Running from source** (the dev / contributor experience): the wizard works out of the box; `pnpm install` puts the binary for your platform in `node_modules`.
- **Marketplace / packaged `.vsix`**: the wizard will surface a friendly error explaining that `module-replacements-codemods` could not be loaded. Shipping it cross-platform requires VSCode's [platform-specific extension publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#platformspecific-extensions), one `.vsix` per `--target`, which is tracked as a follow-up. The rest of NPM Advisor (hover, diagnostics, side panel, project analysis, chat, MCP) keeps working.

## Privacy

NPM Advisor calls the public npm registry, GitHub REST API, OSV API, and Bundlephobia from your machine to gather package metadata. It does not send your `package.json` contents, source code, or any other workspace data anywhere. Cached results are stored locally in VSCode's global state.

## Issues

Report bugs and feature requests at <https://github.com/amedina/agentic-web-learning-tool/issues>.
