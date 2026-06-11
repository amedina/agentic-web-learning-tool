# Design System (`@agentic-web-labs/design-system`)

> Shared React component library for agentic-web-labs apps, built on Radix UI and Tailwind CSS.

## Overview
Provides a single source of UI primitives and application-specific composed components consumed by other packages in the monorepo (extensions, apps, MCP-related UIs). It wraps Radix UI primitives with Tailwind utility classes via `class-variance-authority` and `tailwind-merge`. Higher-level components are tailored to agentic and AI-assistant workflows, covering chat thread lists, MCP server configuration dialogs, tool cards, event logs, and web-tool editors. The package is `private: true` and intended solely for internal monorepo consumption.

## Usage in the monorepo
Add the package as a workspace dependency:

```json
"@agentic-web-labs/design-system": "workspace:*"
```

Import components and the compiled stylesheet:

```tsx
import { Button, MarkdownText, ThreadList, MCPServerDialog, Toaster, toast, cn }
  from '@agentic-web-labs/design-system';
import '@agentic-web-labs/design-system/styles.css';
```

Individual sub-path exports are also available (e.g. `@agentic-web-labs/design-system/button`) via the `"./*"` export map.

## Components

| Category | Description |
|---|---|
| **Primitives / form** | Button, Input, InputGroup, Textarea, Label, Checkbox, ToggleSwitch, Select, Combobox, Command (cmdk) |
| **Overlay / feedback** | Dialog, Popover, Dropdown, Sheet, Tooltip, TooltipIconButton, Toast (sonner), Alert |
| **Layout / navigation** | Sidebar (+ SidebarProvider/Menu/Group/Trigger), Tabs, Accordion, Collapsible, Separator, Skeleton |
| **Content display** | MarkdownText (assistant-ui), SyntaxHighlighter, CodeEditor, DetailsCard, Circle, CirclePieChart, Matrix |
| **Agentic / MCP-specific** | ThreadList, ThreadListSidebar, ToolCard, ToolList, ToolFallback, WebMCPToolsTab, EditToolDialog, MCPServerDialog, EventLogger, OptionsPageTab, PromptCommands |
| **Icons** | Owl SVG / React component |
| **Utilities** | `cn()`, `splitLines`, `joinLines`, `isEmptyOrWhitespace`, `isComment`, `getToolNameWithoutPrefix`, `isJson` |

## Example

```tsx
import { Button, MarkdownText, ThreadList, MCPServerDialog, Toaster, toast, cn }
  from '@agentic-web-labs/design-system';
import '@agentic-web-labs/design-system/styles.css';
```

## Scripts

| Script | What it does |
|---|---|
| `build` | Tailwind CSS (`build:styles`) + TypeScript (`build:components`) in parallel |
| `dev` | Watch both CSS and TS |
| `check-types` | `tsc --noEmit` |
| `test` | Jest (jsdom) |
| `lint` / `format` | ESLint + Prettier |

## Dependencies

- Internal: `@agentic-web-labs/common` (workspace), `@agentic-web-labs/table` (workspace)
- Key external: `react ^19` (peer), `@radix-ui/react-*` (11 packages), `tailwindcss ^4`, `class-variance-authority`, `clsx`, `tailwind-merge`, `@assistant-ui/react` (+ markdown, syntax-highlighter), `cmdk`, `sonner`, `lucide-react` (peer), `victory-pie` (peer), `@babel/parser`, `@babel/traverse`, `acorn`

## Related packages

- [common](../common/README.md)
- [table](../table/README.md)
