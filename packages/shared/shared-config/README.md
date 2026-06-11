# Shared Config (`@agentic-web-labs/shared-config`)

> Centralises ESLint, Jest, Playwright, Prettier, Tailwind, and TypeScript configs for the monorepo.

## Overview

`shared-config` is a private, build-free package that acts as a single source of truth for all tooling configurations across the monorepo. Rather than each package maintaining its own copies of linting, testing, and formatting rules, they consume named export subpaths from this package. The package ships raw JS, JSON, and CSS files with no compilation step.

## Available configs

| Export subpath | What it provides |
|---|---|
| `./eslint` | Base flat config: `@eslint/js` + `typescript-eslint` recommended + Prettier compat + Turbo rule; all rules demoted to warnings via `eslint-plugin-only-warn` |
| `./eslint/react` | Extends base; adds `react`, `react-hooks`, `jsx-a11y`, browser + service-worker globals |
| `./eslint/vite` | Standalone Vite/React flat config with `react-hooks` + `react-refresh` (does not extend base) |
| `./jest` / `./jest/node` | Node Jest config using `ts-jest/presets/js-with-ts`, coverage enabled |
| `./jest/react` | Extends node config; `jsdom` env, CSS/file module-name mappers, `@/` alias |
| `./playwright` | Base Playwright config: parallel, 2 CI retries, HTML+list reporters, `baseURL http://localhost:5174` |
| `./prettier` | `@wordpress/prettier-config` with `useTabs: false` / `tabWidth: 2` |
| `./tailwind` | Full design-token CSS (`@import tailwindcss`, `tw-animate-css`), light/dark vars, `@theme` block |
| `./tailwind/postcss` | PostCSS config `{ plugins: [tailwindcss()] }` |
| `./typescript/base` | Strict ESNext tsconfig (`bundler` resolution, `noEmit`, strict flags) |
| `./typescript/library` | Extends base; adds `declaration`, `declarationMap`, `isolatedModules` |
| `./typescript/react-library` | Extends library; DOM libs, `jsx: react-jsx`, jest type roots |

## Usage

```js
// eslint.config.js — extend the React ESLint config
import { config } from "@agentic-web-labs/shared-config/eslint/react";
export default [...config, { /* local overrides */ }];
```

```jsonc
// tsconfig.json — extend a TypeScript config
{
  "extends": "@agentic-web-labs/shared-config/typescript/react-library"
}
```

```js
// jest.config.js — re-export a Jest preset
export { default } from "@agentic-web-labs/shared-config/jest/react";
```

```js
// playwright.config.js — re-export the Playwright base config
export { default } from "@agentic-web-labs/shared-config/playwright";
```

## Scripts

| Script | Command |
|---|---|
| `format` | `prettier . --write` |

There is no `build`, `lint`, or `test` script — the package ships config files directly without compilation.

## Notes

- `eslint/fileStructure.js` enforces `max-lines: 500` and `react/no-multi-comp` as hard errors but is intentionally absent from the `exports` map; it must be invoked directly via `eslint -c path/to/fileStructure.js`.
- The Playwright config hard-codes `baseURL: http://localhost:5174`; consuming packages that run on a different port must override this value.
- This package is `private: true` and is not published to npm.
