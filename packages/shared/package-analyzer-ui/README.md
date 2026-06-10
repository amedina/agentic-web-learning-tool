# Package Analyzer UI (`@agentic-web-labs/package-analyzer-ui`)

> React component library for displaying npm package health, dependencies, and insights panels.

## Overview

Provides the complete React UI for the package-analyzer feature, covering an Insights tab (header and per-metric widgets) and a Dependencies tab (dashboard, filterable accordion rows, and dependency tree). UI components are intentionally decoupled from any runtime — Chrome extension, VS Code webview, or CLI — via the `StatsClient` interface. Each host implements `StatsClient` and injects it through the `StatsClientProvider` context, making the components reusable across all surfaces without modification.

## Usage in the monorepo

Add the package as a `workspace:*` dependency:

```json
"@agentic-web-labs/package-analyzer-ui": "workspace:*"
```

Import directly from TypeScript sources — there is no build step. Consumers must configure their own bundler to transpile TS/JSX:

```ts
import { StatsClientProvider, InsightsTab } from '@agentic-web-labs/package-analyzer-ui';
```

The `exports` field in `package.json` points at `./src/index.ts`.

## API / Exports

| Export | Kind | Description |
|---|---|---|
| `StatsClientProvider` / `useStatsClient` | Context | Injects the data-fetching adapter (`StatsClient`) into the component tree. |
| `useDependencyStats` | Hook | Concurrently fetches `PackageStats` for all deps in a `package.json` (concurrency 3); module-scope cache + `clearDependencyStatsCache`. |
| `useCountUp` | Hook | Animates numeric values with ease-out cubic easing; snaps for cached data. |
| `InsightsTab` | Component | Full single-package insights view. |
| `DependenciesTab` | Component | Paginated/filterable dependency list with pie-chart dashboard. |
| `Header` | Widget | Package header widget. |
| `BundleFootprint` | Widget | Bundle size widget. |
| `DependencyTree` | Widget | D3 force-directed graph and recursive list view. |
| `LicenseCheck` | Widget | License compatibility widget. |
| `Recommendations` | Widget | Recommendation suggestions widget. |
| `Responsiveness` | Widget | Responsiveness metric widget. |
| `SecurityAdvisories` | Widget | Security advisories widget. |
| `Dashboard` | Sub-component | Dependencies tab dashboard. |
| `DependencySection` | Sub-component | Dependency section grouping. |
| `DependencyAccordionRow` | Sub-component | Filterable accordion row. |
| `FilterPills` | Sub-component | Filter pill controls. |
| `StatsClient` | Type | Key extension point; each host wires its own implementation. |
| `PackageJsonDependencies` | Type | Shape of parsed `package.json` dependencies. |
| `BundleData` | Type | Bundle size data shape. |
| `DEPENDENCIES_COLORS` | Token | Color map for dependency categories. |
| `BRAND_PRIMARY_COLOR` | Token | Brand primary color constant. |
| `dominantDependencyColor` | Token | Utility for dominant category color. |

## Example

```tsx
import { StatsClientProvider, InsightsTab } from '@agentic-web-labs/package-analyzer-ui';

<StatsClientProvider client={myStatsClient}>
  <InsightsTab stats={packageStats} pendingPackageName="lodash" isLoading={false}
    onAddToCompare={() => {}} isAddedToCompare={false}
    onAddRecommendationToCompare={(name) => {}} comparisonBucketNames={new Set()}
    addingRecommendations={new Set()} />
</StatsClientProvider>
```

## Scripts

| Script | Command | Notes |
|---|---|---|
| `check-types` | `tsc --noEmit` | Type-checks the package. **No build script** — sources are consumed directly. |

## Dependencies

- Internal:
  - `@agentic-web-labs/package-analyzer-core` (`workspace:*`) — provides `PackageStats`, `DependencyTree`, `DependencyCategory`, `LicenseCompatibilityResult`, `ScoreBreakdownItem` types.
  - `@agentic-web-labs/design-system` (`workspace:*`) — provides `Tooltip`, `CirclePieChart`, `Matrix`, `MatrixComponentProps`.
- Key external:
  - `d3` ^7.9.0 — force-directed graph in `dependencyGraph.tsx`.
  - `lucide-react` ^0.468.0 — icons.
  - `react` ^19 (peer).

## Related packages

- [package-analyzer-core](../package-analyzer-core/README.md)
- [design-system](../design-system/README.md)
