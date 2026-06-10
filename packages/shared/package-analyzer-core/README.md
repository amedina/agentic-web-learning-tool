# Package Analyzer Core (`@agentic-web-labs/package-analyzer-core`)

> Fetches and scores npm package quality across bundle, deps, responsiveness, and security.

## Overview
Environment-agnostic core analysis engine for npm packages. Given a package name it fans out parallel requests to the npm registry, Bundlephobia, GitHub (repo metadata, issues, security advisories), OSV, and the e18e module-replacements feed. It produces a composite `PackageStats` object with a three-axis quality score (bundle size 45 pts, dependency count 35 pts, maintainer responsiveness 20 pts) plus a security-advisory penalty, license compatibility result, and replacement recommendations. Designed to be consumed by a Chrome extension side-panel and an MCP server without touching any browser or Node-specific APIs.

## Usage in the monorepo
Add as a `workspace:*` dependency in `package.json`:
```json
"@agentic-web-labs/package-analyzer-core": "workspace:*"
```
Import from the package:
```ts
import { getPackageStats, parseLockfile } from "@agentic-web-labs/package-analyzer-core";
```

## API / Exports

### Core library (`lib/`)
| Export | Signature | Description |
|--------|-----------|-------------|
| `getPackageStats` | `(packageName, targetLicense?, options?) → Promise<PackageStats \| null>` | Main orchestrator — fans out all fetches and returns composite scored result |
| `getDependencyTree` | `(packageName, version?, visited?, depth?, signal?) → Promise<DependencyTree>` | Recursive transitive dep walker (max depth 3) |
| `checkLicenseCompatibility` | `(packageLicense, targetProjectLicense?) → LicenseCompatibilityResult \| null` | OSADL matrix lookup |
| `matchesAdvisoryVersion` | `(advisory, packageName, consideredVersion) → boolean` | Semver-based advisory filter |

### Utilities (`utils/`)
| Export | Description |
|--------|-------------|
| `parseLockfile(filename, contents)` | Parses npm v1/v2/v3, pnpm v5–v9, yarn classic, yarn berry lockfiles |
| `resolutionsForImporter(parsed, importerPath)` | Extracts per-workspace-package resolutions from a parsed lockfile |
| `fetchWithCache(url, options?, signal?)` | LRU+TTL cached fetch with single-flight dedup |
| `clearCache()` | Invalidates the process-wide response cache |
| `githubFetch` / `GithubRateLimitError` | GitHub-authenticated fetch helper and rate-limit error class |
| `fetchNpmPackage`, `fetchGithubRepo`, `fetchGithubIssues`, `fetchGithubSecurityAdvisories`, `fetchBundlephobiaData`, `fetchModuleReplacements`, `fetchOsvAdvisories` | Individual data-source fetch utilities |
| `parseGithubUrl`, `extractGithubUrlFromReadme`, `lruCache` | URL parsing and cache utilities |

### Re-exported types
`PackageStats`, `ScoreBreakdownItem`, `DependencyCategory`, `GetPackageStatsOptions`, `DependencyTree`, `LicenseCompatibilityResult`, `AdvisoryVulnerability`, `AdvisoryForMatching`

## Example
```ts
import { getPackageStats, parseLockfile } from "@agentic-web-labs/package-analyzer-core";

const lock = parseLockfile("pnpm-lock.yaml", fs.readFileSync("pnpm-lock.yaml", "utf8"));
const version = lock.topLevel["react"];

const stats = await getPackageStats("react", "MIT", {
  resolvedVersion: version,
  includeDependencyTree: false,
  dependencyCategory: "runtime",
});
console.log(stats?.score, stats?.licenseCompatibility);
```

## Scripts
| Script | Command |
|--------|---------|
| `check-types` | `tsc --noEmit` |
| `test` | `vitest run --root . --silent` (52 test files cover all lib and util modules) |

> Note: There is no build step — exports point directly at TypeScript source (`./src/index.ts`); consumers must support TypeScript resolution.

## Dependencies
- Internal: `@agentic-web-labs/shared-config` (dev — tsconfig/vitest base)
- Key external:
  - `semver` ^7.7.4 — version range matching for advisory filtering and lockfile parsing
  - `js-yaml` ^4.1.1 — YAML parsing for pnpm and yarn berry lockfiles

## Related packages
- [shared-config](../shared-config/README.md)
