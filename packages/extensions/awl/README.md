# Agentic Web Labs (`@agentic-web-labs/awl`)

> Chrome MV3 extension bridging browser-tab WebMCP tools to an AI chatbot side panel via MCP.

## Overview

AWL is the flagship Chrome extension in the monorepo. It discovers MCP-compatible tools exposed by web pages through the WebMCP `navigator.modelContext` polyfill, proxies them through an in-extension MCP server (one per tab), and surfaces them to an AI chatbot rendered in the Chrome side panel. Beyond WebMCP discovery, AWL supports user-authored custom tool scripts, workflow automation, and external MCP server connections (SSE, Streamable-HTTP, and Stateless-HTTP). A DevTools panel provides live inspection of all tool calls and event logs, while an options page lets users configure models, MCP servers, WebMCP tools, workflows, prompt commands, and built-in Chrome AI playgrounds.

## Extension surfaces

| Surface | Responsibility |
|---|---|
| Service worker (`src/serviceWorker/index.ts`) | Maintains per-tab `McpHub` instances aggregating WebMCP tools from content scripts, user tool scripts, saved workflows, and external MCP servers; forwards tool calls; manages side-panel and context-menu lifecycle. |
| Content script (`src/contentScript/mcpBridge.ts`) | Injected into every page; injects the WebMCP polyfill and dynamic tool-registration scripts, establishes a `TabClientTransport` MCP client to the page's `navigator.modelContext` server, relays tool lists and results to the service worker. |
| Side panel (`src/view/sidePanel/`) | React UI hosting `SidepanelChatbot` (from `@agentic-web-labs/chatbot`) with a Workflows suffix tab, global status pill, and header. |
| Options page (`src/view/options/`) | Multi-section settings: Models, MCP Servers, WebMCP Tools, MCP Inspector, Built-in AI (API Status, API Playgrounds, Workflow Composer), Prompt Commands, Settings. |
| DevTools panel (`src/view/devtools/`) | Connects to the service worker via `ExtensionClientTransport`; tool-runner panel and event-log stream of all tool invocations. |
| Popup (`src/view/popup/`) | Popup stub. |
| Context menu (`src/view/contextMenu/`) | Dynamically populated with workflows by active-tab URL. |

## Development

Build all workspace dependencies and the extension bundle, then load as an unpacked extension:

```bash
# One-time / CI build
pnpm --filter @agentic-web-labs/awl build
```

After building, open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select the `dist/awl/` directory.

For iterative development, the `dev` script watches all workspace dependencies, the content script, and the Vite extension build concurrently:

```bash
pnpm --filter @agentic-web-labs/awl dev
```

Reload the extension in `chrome://extensions` after each rebuild to pick up service-worker changes.

## Scripts

| Script | What it does |
|---|---|
| `dev` | Concurrently watches all workspace deps + content script + Vite extension build |
| `build` | Sequential dep builds then parallel content-script + Vite bundle to `dist/awl/` |
| `build:contentScript` | Bundles content script via `scripts/contentScript.config.ts` |
| `test` | Jest unit tests (jsdom) |
| `test:e2e` | Playwright end-to-end tests |
| `check-types` | `tsc -b --noEmit` |

## Dependencies

- **Internal** (`workspace:*`): `chatbot`, `chrome-ai-playground`, `common`, `design-system`, `engine-core`, `engine-extension`, `engine-web`, `awl-mcp-inspector`, `table`, `workflow-ui`, `shared-config` (dev)
- **Key external**: `@modelcontextprotocol/sdk` ^1.23.0 (MCP protocol), `@mcp-b/transports` + `@mcp-b/extension-tools` + `@mcp-b/react-webmcp` (Chrome-extension MCP transports and WebMCP polyfill bridge), `@assistant-ui/react` (chat UI), `@xyflow/react` (workflow rendering), `react` ^19.1.1, `zod` 4.1.13, `p-queue` (serial tool-update queue), `vite` + `@tailwindcss/vite` (build), `playwright` (e2e)

## Notes

- Manifest V3; `incognito: split`; declares `userScripts` and `unlimitedStorage` permissions.
- The service worker exposes `globalThis.mcpData` (hub maps) for debugging directly in the SW console via `chrome://extensions`.
- WebMCP tool names are sanitized and prefixed; external MCP server tools are suffixed `_mcp_<serverName>`.
- Built-in Chrome API tools are toggled via `chromeAPIBuiltInToolsState` in `chrome.storage.local`.
