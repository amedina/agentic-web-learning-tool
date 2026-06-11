# Common (`@agentic-web-labs/common`)

> Foundational shared utilities, types, constants, and React context helpers for all packages.

## Overview

`@agentic-web-labs/common` provides the cross-cutting primitives consumed by every other package in the monorepo. It exposes shared TypeScript types for MCP server configuration and custom HTTP headers, string/object utility functions, a `loglevel`-backed logger wrapper, two string constants used to namespace tool names, and a performance-optimised React context selector abstraction that suppresses unnecessary re-renders. It sits in the `packages/shared/common` directory and belongs to the `shared` group within the monorepo.

## Usage in the monorepo

Add the package as a `workspace:*` dependency in any sibling package's `package.json`:

```json
{
  "dependencies": {
    "@agentic-web-labs/common": "workspace:*"
  }
}
```

Then import from the package name:

```ts
import { createContext, useContextSelector, mergeDeep } from '@agentic-web-labs/common';
```

Note: the `exports` field points directly to `src/index.ts` (TypeScript sources), so consumers must resolve `.ts` files via `tsconfig` path aliases or a bundler. A compiled `dist/` is only produced by the `build` script.

## API / Exports

All symbols are re-exported from `src/index.ts`.

| Export | Kind | Description |
|---|---|---|
| `CustomHeader` | Type | Shape of a single custom HTTP header entry |
| `CustomHeaders` | Type | Collection of `CustomHeader` entries |
| `MCPServerConfig` | Type | Configuration for an individual MCP server |
| `MCPConfig` | Type | Top-level MCP configuration object |
| `ConfigItem` | Type | Generic configuration item shape |
| `InspectorConfig` | Type | Configuration for the inspector feature |
| `EXTENSION_TOOL_PREFIX` | Constant | `"extension_tool_"` — namespace prefix for extension tools |
| `DOM_TOOL_NAME_PREFIX` | Constant | `"dom_extract_"` — namespace prefix for DOM extraction tools |
| `logger(logTypes, message)` | Function | Wrapper around `loglevel`; accepts log level array and message array |
| `Logger` | Class | Re-exported `loglevel` Logger class |
| `LogLevelDesc` | Type | Re-exported `loglevel` log level descriptor type |
| `createContext<T>(defaultValue)` | Function | Wraps `use-context-selector`'s `createContext` for optimised context creation |
| `useContextSelector(context, selector, equalityFn?)` | Function | Selector hook with memoisation to suppress unnecessary re-renders |
| `isEqual` | Function | Re-exported from `lodash-es`; deep equality check |
| `isUrl(url)` | Function | Returns `true` if `new URL(url)` succeeds |
| `getValueByKey(key, obj)` | Function | Dot-notation deep property access on an object |
| `mergeDeep(target, source)` | Function | Recursive object merge; arrays are concatenated |
| `noop` | Constant | Empty function constant |

## Example

```ts
import {
  useContextSelector, createContext, mergeDeep, isUrl, logger,
  EXTENSION_TOOL_PREFIX, type MCPServerConfig,
} from '@agentic-web-labs/common';

const MyCtx = createContext<{ count: number }>({ count: 0 });
const count = useContextSelector(MyCtx, (s) => s.count);
logger(['info'], ['server started']);
```

## Scripts

| Script | Command |
|---|---|
| `build` | `tsc` (preceded by `prebuild`: `rimraf dist dist-types`) |
| `dev` | `tsc --watch` |
| `test` | Jest with jsdom environment |
| `check-types` | `tsc --noEmit` |
| `lint` | ESLint |
| `format` | Prettier |

## Dependencies

- Internal: none at runtime (`@agentic-web-labs/shared-config` is dev-only)
- Key external:
  - `loglevel` ^1.9.2 — structured log levels
  - `lodash-es` ^4.17.22 — `isEqual`, `isPlainObject`
  - `use-context-selector` ^2.0.0 — React context selector primitive
  - `react` ^19 (peer dependency)

## Related packages

This package has no runtime internal dependencies, but it is consumed by virtually every other workspace package in the monorepo. Packages that depend on it will list `@agentic-web-labs/common` as a `workspace:*` dependency.
