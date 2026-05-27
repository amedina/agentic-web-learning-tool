# Changelog

All notable changes to the NPM Advisor VSCode extension are recorded here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Lockfile-aware analysis: the extension now reads `package-lock.json` /
  `pnpm-lock.yaml` / `yarn.lock` to resolve the actually-installed version
  of every dependency. Hover renders `Installed · Range · Latest` when
  the three differ; the security-advisory diagnostic suffixes
  `(installed X)` or `(no lockfile, showing latest X)` so the Problems
  panel makes the resolution mode obvious. Lockfile changes invalidate
  the cache automatically via a `FileSystemWatcher`.
- OSV (Open Source Vulnerabilities) as a second advisory source
  alongside GitHub's `/security-advisories`. Findings from both feeds
  are deduplicated by GHSA / CVE identifier; the result surfaces an
  `advisorySources` field on each package so the UI can show which
  databases were consulted.

### Changed

- Advisories are now matched against the installed version via
  `semver.satisfies(consideredVersion, vulnerable_version_range)`. A CVE
  that only affects an older version no longer flags a newer install.
- Webview message handling now validates the inbound shape and refuses
  paths outside the workspace before any filesystem-effect handler
  runs.
- Diagnostic clears triggered by `onDidChangeTextDocument` are
  debounced (750 ms) so the Problems panel no longer flickers on every
  keystroke.

### Fixed

- The shared analyzer-core caches (`fetchWithCache`, `githubFetch`) are
  bounded LRU + TTL with single-flight semantics. Long-lived extension
  hosts no longer grow the cache unbounded; two concurrent reads of the
  same URL share one network round-trip.

## [0.3.0]

### Added

- Activity-bar side panel with Dependencies, Project Analysis, and
  Ask AI tabs.
- **Run project analysis** command that runs `publint` plus an `e18e`
  replacement-opportunities scan against the active workspace folder.
- **Run migration wizard** command — three-step flow that previews and
  applies `module-replacements-codemods` edits through a single
  `WorkspaceEdit` so the result is undoable with Ctrl+Z.
- **Set up MCP server for AI clients** wizard with per-client cards for
  Claude Code, Cursor, Claude Desktop, Windsurf, and Continue.
- GitHub sign-in command that lifts the analyzer-core REST quota from
  60 req/hr (anonymous) to 5 000 req/hr.
- Chat participant `@npm-advisor` for Copilot Chat.

### Removed

- CodeLens badge above each dependency. The same data is now in the
  hover popover and the Activity-bar side panel; the inline badge added
  visual noise and conflicted with other CodeLens providers.

### Fixed

- Refresh-stats no longer clears the spinner before the refetch lands.
- Re-runs of project analysis after a `package.json` save show a "stale
  — re-run" prompt instead of phantom-correct findings.
