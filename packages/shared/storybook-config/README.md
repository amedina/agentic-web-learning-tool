# Storybook Config (`@agentic-web-labs/storybook-config`)

> Centralized Storybook host that aggregates stories from design-system and the awl extension.

## Overview

This package is the single Storybook host for the monorepo. It owns `.storybook/main.ts` and `.storybook/preview.ts` and discovers stories from two source trees: `packages/shared/design-system/src/components/**` and `extensions/awl/src/view/**`. It defines the shared global CSS baseline (Tailwind + design-system styles) that all rendered stories inherit. The package is `private: true` and exports no module — other packages contribute stories via the glob patterns in `main.ts` rather than by importing anything from this package.

## Running Storybook

```sh
pnpm --filter @agentic-web-labs/storybook-config storybook
```

Storybook runs on port **6006**. Stories are auto-discovered — adding a `*.stories.tsx` file anywhere under `packages/shared/design-system/src/components/` or `extensions/awl/src/view/` makes it appear automatically without any additional configuration.

## Scripts

| Script | Command |
|---|---|
| `storybook` | `storybook dev -p 6006` |
| `build` | `storybook build` |
| `format` | `prettier . --write` |

Note: Vitest unit tests run via `@storybook/addon-vitest` on port 6007. There is no standalone test or lint script.

## Dependencies

- **Internal:** `@agentic-web-labs/design-system` (component stories and `styles.css`), `@agentic-web-labs/shared-config` (shared Tailwind base)
- **Key external:** `storybook` ^9.1.3, `@storybook/react-vite` ^9.1.3, `@storybook/addon-a11y`, `@storybook/addon-docs`, `@storybook/addon-onboarding`, `@storybook/addon-vitest`, `@chromatic-com/storybook` ^4.1.1 (Chromatic visual regression), `vite` ^7.3.2, `@vitejs/plugin-react`, `@tailwindcss/vite`, `vite-plugin-svgr`

## Notes

- Path aliases in `viteFinal` resolve workspace source directories directly, bypassing built dist and enabling live cross-package editing without rebuilds.
- `src/index.css` uses `@source` directives to scan the design-system, extension, and table packages for Tailwind class discovery.
