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

## Privacy

NPM Advisor calls the public npm registry, GitHub REST API, and Bundlephobia from your machine to gather package metadata. It does not send your `package.json` contents, source code, or any other workspace data anywhere. Cached results are stored locally in VSCode's global state.

## Issues

Report bugs and feature requests at <https://github.com/amedina/agentic-web-learning-tool/issues>.
