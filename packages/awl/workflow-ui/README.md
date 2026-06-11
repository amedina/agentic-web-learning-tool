# Workflow UI (`@agentic-web-labs/workflow-ui`)

> React visual workflow editor with drag-and-drop node canvas for building browser automations.

## Overview

`workflow-ui` provides the full visual workflow editor rendered on the Chrome extension's Options page. It presents a three-panel ReactFlow layout: a collapsible left sidebar listing available tool nodes, a central canvas where users drag, drop, connect, and execute nodes, and a collapsible right sidebar for per-node configuration. Because it bootstraps `initContentScriptBridge` internally and registers `chrome.tabs` listeners, this package is Chrome-extension-only and cannot be used in a generic web context. Workflow state auto-saves to extension storage with a 100 ms debounce and supports manual save, JSON export, and JSON import.

## Usage in the monorepo

Add the package as a workspace dependency:

```json
"@agentic-web-labs/workflow-ui": "workspace:*"
```

Import from the package name:

```ts
import { Workflow } from "@agentic-web-labs/workflow-ui";
```

## API / Exports

Exported from `src/index.ts`:

| Export | Kind | Description |
|---|---|---|
| `Workflow` | default-exported React component | Root editor component. Accepts `{ theme: "light" \| "dark" \| "system" }`. Internally wraps `ApiProvider`, `FlowProvider`, and `ReactFlowProvider` around the full three-panel `Panel`. |
| `getUniqueNames(name, excludeId?)` | async utility | Resolves a collision-free display name and `sanitizedName` against the list of saved workflows. |

## Example

```tsx
import { Workflow } from "@agentic-web-labs/workflow-ui";

// Rendered inside the Chrome extension Options page
<Workflow theme="system" />
```

The component is self-contained: it bootstraps its own context providers and the engine content-script bridge internally.

## Scripts

| Script | Command |
|---|---|
| `build` | `tsc` |
| `dev` | `tsc --watch` |
| `check-types` | `tsc --noEmit` |
| `lint` | `eslint src --max-warnings 0` |
| `format` | `prettier . --write` |

No test runner script is present.

## Dependencies

- **Internal (`workspace:*`):**
  - `@agentic-web-labs/engine-core` — `NodeType` enum, `WorkflowJSON`/`WorkflowMeta` types, `WorkflowJSONSchema` (Zod)
  - `@agentic-web-labs/engine-extension` — `getWorkflowClient`, save/load/list/delete workflow, `initContentScriptBridge`, `getLastOpenedWorkflowId`
  - `@agentic-web-labs/design-system` — shared design tokens and UI primitives
  - `@agentic-web-labs/common` — shared utilities

- **Key external:**
  - `@xyflow/react ^12.9.3` — node-graph canvas engine
  - `immer ^9` — immutable state updates
  - `use-context-selector ^2` — fine-grained context subscriptions
  - `zod 4.1.13` — schema validation
  - `lucide-react` — icons
  - `tailwindcss ^4` — styling
  - `loglevel` — logging

## Related packages

- [engine-core](../engine-core/README.md)
- [engine-extension](../engine-extension/README.md)
- [design-system](../../shared/design-system/README.md)
- [common](../../shared/common/README.md)
