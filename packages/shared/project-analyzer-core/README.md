# Project Analyzer Core (`@agentic-web-labs/project-analyzer-core`)

> Runs publint, replacement-opportunity, and circular-dep analyses on a project root, returning unified findings.

## Overview
`project-analyzer-core` provides a single async orchestrator (`analyzeProject`) that runs three independent project-health analyzers in parallel against a given `rootPath`: publishing-hygiene linting via `publint`, dependency-replacement suggestions via the `es-tooling/module-replacements` preferred manifest, and circular import detection via `madge`. All findings are normalized into a flat `ProjectFinding[]` with a common severity/source vocabulary so VS Code diagnostics, MCP tool responses, and webviews can consume one list. Soft failures in any sub-analyzer become warnings rather than thrown exceptions.

## Usage in the monorepo
Add as a workspace dependency:

```json
"@agentic-web-labs/project-analyzer-core": "workspace:*"
```

Import from:

```ts
import { analyzeProject } from "@agentic-web-labs/project-analyzer-core";
```

## API / Exports

### Functions

| Function | Description |
|---|---|
| `analyzeProject(options): Promise<ProjectAnalysis>` | Top-level orchestrator — runs all analyzers in parallel |
| `runPublint(options): Promise<RunPublintResult>` | Runs publint in `"source"` or `"pack"` mode |
| `findReplacementOpportunities(options)` | Scans `package.json` deps against the preferred-replacements manifest |
| `findCircularDependencies(options)` | `madge`-based cycle detection with per-edge symbol detail |
| `runMigrationCodemods(options)` | Dry-runs `module-replacements-codemods`, returns edits without writing to disk |
| `listSupportedCodemodPackages()` | Returns packages that have a codemod available |
| `detectPackageManager(pkgDir)` | Wraps `package-manager-detector` for lockfile-based PM detection |
| `parseImports(source)` | Regex static import parser |
| `resolveModulePath(importerFile, specifier, extensions?)` | Resolves relative specifiers to absolute paths |

### Types

`ProjectAnalysis`, `ProjectFinding`, `FindingSeverity`, `FindingSource`, `AnalyzeProjectOptions`, `FindCircularDependenciesOptions`, `CycleEdge`, `MigrationEdit`, `RunMigrationCodemodsOptions`, `ParsedImport`, `DetectedPackageManager`, `PublintMode`, `PreferredManifest`

## Example

```ts
import { analyzeProject } from "@agentic-web-labs/project-analyzer-core";

const result = await analyzeProject({
  rootPath: "/path/to/my-package",
  publintMode: "source",
  skipCircularDependencies: false,
});
console.log(result.summary); // { total, bySeverity, bySource }
```

## Scripts

- `check-types`: `tsc --noEmit`
- `test`: `vitest run --root . --silent`

## Dependencies

- Internal: `@agentic-web-labs/package-analyzer-core` (workspace:*)
- Key external: `publint`, `@publint/pack`, `madge`, `module-replacements-codemods`, `@ast-grep/napi`, `package-manager-detector`

## Related packages

- [package-analyzer-core](../package-analyzer-core/README.md)
