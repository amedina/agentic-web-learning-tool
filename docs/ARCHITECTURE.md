# Agentic Web Learning Tool (AWL) — Architecture

## Overview

The Agentic Web Learning Tool (AWL) is a Chrome Extension (Manifest V3) that turns the browser into an AI-powered, tool-augmented development environment. It implements the **Model Context Protocol (MCP)** to expose browser capabilities — Chrome APIs, page DOM, user-defined scripts, and Chrome's built-in AI models — as structured tools that any connected AI model can discover and invoke. The result is a conversational side panel where users can ask an AI agent to inspect, navigate, and manipulate web pages using real browser primitives, while every tool call is rendered transparently in the chat stream.

AWL is developed as an open-source project:
- **Repository:** https://github.com/amedina/agentic-web-learning-tool

---

## What the Extension Does

| Manifest field | Value |
|---|---|
| **Manifest version** | 3 (MV3) |
| **Permissions** | `storage`, `tabs`, `webNavigation`, `scripting`, `activeTab`, `sidePanel`, `tabGroups`, `history`, `userScripts`, `contextMenus`, `unlimitedStorage` |
| **Host permissions** | `*://*/*` (all origins) |
| **Background** | Service worker (`serviceWorker/serviceWorker.js`, ES module) |
| **Content scripts** | `contentScript/contentScript.js` injected on all URLs |
| **UI surfaces** | Side panel (chat), Options page (settings/config), DevTools panel (MCP inspector) |
| **Web-accessible resources** | `webmcp-polyfill.js`, `registerTools.js`, `registerWorkflowTools.js` |
| **Incognito** | `split` (separate extension process per profile) |

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Chrome Browser                           │
│                                                                 │
│  ┌──────────────┐   ┌──────────────────┐   ┌────────────────┐  │
│  │  Page Context │   │  Content Script   │   │ Service Worker │  │
│  │              │   │                  │   │   (McpHub)     │  │
│  │  webmcp-     │◄─►│  mcpBridge.ts    │◄─►│                │  │
│  │  polyfill.js │   │                  │   │  MCP Server    │  │
│  │              │   │  TabClient       │   │  instances     │  │
│  │  register    │   │  Transport       │   │  per tab       │  │
│  │  Tools.js    │   │                  │   │                │  │
│  │              │   │                  │   │  Chrome API    │  │
│  │  register    │   │                  │   │  tool layer    │  │
│  │  Workflow    │   │                  │   │                │  │
│  │  Tools.js    │   │                  │   │  External MCP  │  │
│  │              │   │                  │   │  client conns  │  │
│  └──────────────┘   └──────────────────┘   └───────┬────────┘  │
│        ▲                                           │           │
│        │ window.postMessage          chrome.runtime ports      │
│        ▼                                           │           │
│  ┌──────────────┐                                  ▼           │
│  │  navigator.  │   ┌──────────────────────────────────────┐   │
│  │  modelContext│   │           Extension UI Layer          │   │
│  │  (WebMCP)    │   │                                      │   │
│  └──────────────┘   │  Side Panel    DevTools    Options   │   │
│                     │  ┌────────┐   ┌─────────┐ ┌───────┐ │   │
│                     │  │ Chat   │   │ Tool    │ │Models │ │   │
│                     │  │ Bot UI │   │ List    │ │MCP    │ │   │
│                     │  │        │   │ Run Tool│ │WebMCP │ │   │
│                     │  │Workflow│   │ Events  │ │AI Play│ │   │
│                     │  │ List   │   │         │ │Workfl.│ │   │
│                     │  └────────┘   └─────────┘ └───────┘ │   │
│                     └──────────────────────────────────────┘   │
│                                    │                           │
└────────────────────────────────────┼───────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
             ┌───────────┐   ┌───────────┐   ┌───────────────┐
             │ Anthropic  │   │  Google   │   │  OpenAI /     │
             │ (Claude)   │   │ (Gemini)  │   │  Ollama /     │
             │            │   │           │   │  Gemini Nano  │
             └───────────┘   └───────────┘   └───────────────┘
```

---

## Architecture Components

### 1. Background Service Worker (`packages/extension/src/serviceWorker/`)

The service worker is the central nervous system of AWL. It hosts one **MCP Server** instance per active tab and orchestrates all communication between the UI, content scripts, and external services.

**Core class — `McpHub`** (`mcpHub.ts`):
- Creates an `McpServer` (from `@modelcontextprotocol/sdk`) per tab.
- Maintains a `registeredTools` map for dynamic tool registration and removal.
- Connects to external MCP servers via SSE, Streamable HTTP, or Stateless HTTP transports.
- Wraps Chrome APIs (tabs, history, scripting, storage, tab groups, windows, DOM extraction) as MCP tools through `@mcp-b/extension-tools`.
- Registers user-authored WebMCP tools and workflow-derived tools.
- Uses `p-queue` for concurrency-controlled tool execution.
- Listens for `chrome.storage.local.onChanged` to reactively re-inject tools when user scripts, built-in tool states, or workflow definitions change.

**Instance management:**
```
mcpHubSidepanelInstances: Map<tabId, McpHub>   // one per side-panel tab
mcpHubDevtoolInstances:   Map<tabId, McpHub>   // one per DevTools tab
mcpHubOptionsInstances:   Map<tabId, McpHub>   // one per Options page
serverInstances:          Map<string, McpServer>
```

Instances are cleaned up on `chrome.tabs.onRemoved`.

**Chrome APIs used:**
`chrome.sidePanel`, `chrome.tabs`, `chrome.runtime` (ports and messages), `chrome.storage.local` / `.sync` / `.session`, `chrome.webNavigation`, `chrome.contextMenus`, `chrome.scripting`, `chrome.history`, `chrome.tabGroups`.

### 2. Content Scripts (`packages/extension/src/contentScript/`)

The content script layer bridges the extension's isolated world with the web page's main world.

**`mcpBridge.ts`** — Runs in the content script isolated world:
1. Injects three web-accessible scripts into the page's main world:
   - `webmcp-polyfill.js` — Implements a `TabServerTransport` on the page, exposing `navigator.modelContext` (the WebMCP API surface).
   - `registerTools.js` — Registers built-in page tools (e.g., `changeBgColor`, `getPageTitle`) on `navigator.modelContext`.
   - `registerWorkflowTools.js` — Registers workflow-derived tools.
2. Creates a `TabClientTransport` (from `@mcp-b/transports`) that communicates with the page's `TabServerTransport` via `window.postMessage`.
3. Connects an MCP `Client` with a retry loop (1000ms intervals) until the page-side transport is ready.
4. Discovers tools via `client.listTools()` and relays the list to the service worker.
5. Forwards `execute-tool` messages from the service worker to the page context and returns results via `tool-result` messages.

**Data flow for tool execution:**
```
Side Panel → (chrome.runtime port) → Service Worker
  → (chrome.runtime.sendMessage) → Content Script
    → (window.postMessage) → Page Context (tool runs)
    ← (window.postMessage) ← Page Context (result)
  ← (chrome.runtime.sendMessage) ← Content Script
← (chrome.runtime port) ← Service Worker → Side Panel
```

### 3. Side Panel — Chat Interface (`packages/extension/src/view/sidePanel/`)

The primary user-facing surface, built with **React 19** and the **`@assistant-ui/react`** chat framework. It opens by clicking the extension icon in the Chrome toolbar — no popup window is involved.

**Layout:**
The side panel occupies a vertical strip alongside the active web page. It presents two tabs:

- **Chat** — A full conversational interface that supports:
  - **Markdown rendering** including code blocks and tables.
  - **Real-time streaming** of model responses as the agent works.
  - **Tool Call Cards** — When the agent invokes a tool (e.g., navigating to a URL or extracting DOM), the chat renders a distinct card inline in the stream. Expanding the card reveals the full input arguments passed to the tool, the JSON response received, and the execution duration — making the agent's actions fully transparent and inspectable.
  - **Reasoning Display** — For reasoning-capable models (e.g., Gemini with thinking mode), a collapsible "Thought Process" block shows the model's internal reasoning steps — which tools it plans to call and why — before delivering its final answer.
- **Workflows** — Lists available workflows for one-click execution from the panel.

**Model & Persona Selector:** A dropdown at the bottom of the chat panel lets users switch the active model or provider on the fly. Models can be added and configured in the Models section of the Options page.

**Key hooks and providers:**
- `useModelProvider` — Resolves the currently selected AI model and API key.
- `AssistantRuntime` ref — Manages the chat session lifecycle.
- Tab tracking via `chrome.tabs.query` / `onActivated` / `onUpdated` to keep the side panel context-aware of the active page.

### 4. Options Page (`packages/extension/src/view/options/`)

A full-page configuration UI with a collapsible sidebar navigation (dark theme). The sidebar organizes settings into four top-level groups, each with sub-sections:

#### Models
Configure AI providers and their connection settings. The Models list view shows registered providers (e.g., Anthropic, Gemini) with status indicators. Clicking a provider opens a detail form with fields for:
- **API key** — Stored in `chrome.storage.sync`.
- **Thinking Mode** toggle — Enables chain-of-thought reasoning for supported models.
- **System Prompt** — Custom instructions prepended to every conversation.

#### MCP
Three sub-sections for managing the Model Context Protocol ecosystem:

- **MCP Servers** — Connect to external MCP servers. The UI provides an "Add Server" button and two views: **Box/Proxy** (for servers behind a proxy) and **Discovered** (auto-detected). Once connected, the side panel's tool list is augmented with the server's tools (visible in the tool dropdown).
- **WebMCP Tools** — A card grid showing all registered tools (both built-in and user-created). Each card displays the tool name, a short description, and its status. Examples: `change_bg_color`, `get_page_title`, `built_in_smart_translator`, `auto_quick_summarize`.
- **MCP Inspector** — Debug MCP server connections and inspect tool discovery in real time.

#### Built-in AI
Three sub-sections for Chrome's on-device AI capabilities:

- **API Status** — Check availability of Chrome's built-in AI APIs (Prompt, Summarizer, Rewriter, Translator, Writer, Language Detector, Proofreader).
- **API Playgrounds** — A grid of sandboxed UIs for experimenting with individual built-in APIs in isolation. Each playground is a self-contained form where users can set parameters and run the API to see results. Available playgrounds:
  - **Prompt Lab** — Free-form prompting against Gemini Nano.
  - **Writer's Studio** — Test the Writer API.
  - **Summarization Station** — Test the Summarizer API.
  - **Polyglot Panel** — Test the Translator API.
  - **Proofreader** — Test the Proofreader API.

#### Workflow Composer
A visual, node-based editor for chaining multiple built-in APIs (including Nano APIs) into simple agentic workflows. The editor presents:
- A **left palette** of available node types (Start, Static Input, Rewriter API, Summarizer API, Condition, Tooltip, Alert, etc.).
- A **center canvas** where users drag, drop, and connect nodes into a directed graph.
- **Per-node configuration panels** on the right for setting parameters.
- A toolbar for saving, loading, and running workflows.

Example workflow: `Start → Static Input → Rewriter API → Summarizer API → Condition → (true) Tooltip / (false) Alert Notification`.

#### Prompt Commands
Create custom slash commands for the chat interface — user-defined shortcuts that expand into prompts.

#### Settings
Theme (light/dark/auto) and log level (Debug, Warn, Error, Silent).

### 5. DevTools Panel (`packages/extension/src/view/devtools/`)

A Chrome DevTools tab labeled **AWL** that provides three sub-panels for inspecting and debugging the MCP layer:

- **Tool List** — A table view of all MCP tools registered for the current tab. Each row shows the tool name, description, and input schema summary. Selecting a tool reveals its full JSON schema definition in a detail pane below the table.
- **Run Tool** — A form-based interface for manually executing any registered tool. Users select a tool, fill in its input parameters, and click "Run Tool" to see the raw JSON result — useful for testing tools outside of the AI chat flow.
- **Events** — A real-time log of MCP communication events with timestamps. Shows tool calls, results, registrations, and transport-level messages — useful for debugging message flow between components.

Connects to the service worker via a dedicated port: `mcp-devtools-{tabId}`.

---

## Messaging Patterns

### Connection names (long-lived ports)

```typescript
CONNECTION_NAMES = {
  CONTENT_SCRIPT: 'mcp-content-script-proxy',
  MCP_HOST_SIDEPANEL: 'mcp-sidepanel',       // + URL hash #tab={tabId}
  MCP_HOST_DEVTOOLS: 'mcp-devtools',          // + -{tabId} suffix
}
```

### Message types (request/response)

```typescript
MESSAGE_TYPES = {
  REGISTER: 'register-tools',        // content script → service worker
  UPDATE: 'tools-updated',           // service worker → UI
  RESULT: 'tool-result',             // content script → service worker
  REFRESH_REQUEST: 'request-tools-refresh',
  EXECUTE: 'execute-tool',           // service worker → content script
  TOOL_LOG: 'tool-execution-log',    // logging
}
```

### Communication matrix

| From | To | Mechanism |
|---|---|---|
| Side Panel | Service Worker | Named port (`mcp-sidepanel`) |
| DevTools | Service Worker | Named port (`mcp-devtools-{tabId}`) |
| Service Worker | Content Script | `chrome.runtime.sendMessage` |
| Content Script | Page Context | `window.postMessage` (TabClient/TabServer transports) |
| Page Context | Content Script | `window.postMessage` |
| Storage changes | Service Worker | `chrome.storage.*.onChanged` listeners |

---

## Key Features

### MCP Tool Ecosystem

AWL implements a layered tool architecture where all tools — regardless of origin — are unified under the MCP protocol and made available to the AI agent:

1. **Chrome API tools** (`@mcp-b/extension-tools`) — DOM extraction, tabs, windows, history, scripting, storage, tab groups. Each can be individually enabled/disabled in the Options page.
2. **WebMCP user tools** — Custom JavaScript authored in the Options page via an inline code editor, stored in `chrome.storage.local`, injected per-tab. The editor provides syntax highlighting and a live preview of the tool's registration.
3. **External MCP servers** — Connected via SSE, Streamable HTTP, or Stateless HTTP transports with optional custom headers and domain filtering. Once connected, their tools appear alongside built-in tools.
4. **Workflow tools** — Workflows created in the Workflow Composer are automatically exposed as invocable MCP tools, bridging the visual editor and the conversational interface.
5. **Page-registered tools** — Any web page can register tools on `navigator.modelContext` that the extension discovers and surfaces to the agent.

### Workflow Engine (`packages/engine-core/`)

A node-graph execution engine with pluggable executors. The Workflow Composer provides a visual drag-and-drop interface for building these graphs, while the engine handles parsing, validation, and sequential execution with data passing between nodes.

**Built-in API executors:**

| Executor | Built-in API |
|---|---|
| `promptApiExecutor` | Prompt API (Gemini Nano) |
| `summarizerApiExecutor` | Summarizer API |
| `rewriterApiExecutor` | Rewriter API |
| `translatorApiExecutor` | Translator API |
| `writerApiExecutor` | Writer API |
| `languageDetectorApiExecutor` | Language Detector API |
| `proofreaderApiExecutor` | Proofreader API |
| `textToSpeechExecutor` | Text-to-Speech API |

**Control flow executors:**

| Executor | Purpose |
|---|---|
| `conditionExecutor` | Conditional branching (true/false paths) |
| `loopExecutor` | Loop iteration |
| `staticInputExecutor` | Hardcoded input values |
| `selectionToolExecutor` | Text selection from page |
| `domInputExecutor` | DOM element input |

**Output executors:**

| Executor | Purpose |
|---|---|
| `domReplacementExecutor` | Replace DOM content |
| `clipboardWriterExecutor` | Write to clipboard |
| `fileCreatorExecutor` | Create file downloads |
| `alertNotificationExecutor` | Show alert/notification |
| `tooltipExecutor` | Display tooltip overlay |
| `dataTransformerExecutor` | Transform data between nodes |
| `mathExecutor` | Math operations |

The engine has three layers:
- **`engine-core`** — Parser (`WorkflowParser`), node registry (`NodeRegistry`), and engine (`WorkflowEngine`) — platform-agnostic.
- **`engine-extension`** — Extension-specific bindings (workflow-to-MCP-tool conversion via `transformWorkflowToTool()`).
- **`engine-web`** — Page-context runtime for executors that need direct DOM access.

### AI Model Integration

AWL supports multiple AI providers via the Vercel AI SDK (`ai` package):

| Provider | Package | Models |
|---|---|---|
| Anthropic | `@ai-sdk/anthropic` | Claude family |
| Google | `@ai-sdk/google` | Gemini family |
| OpenAI | `@ai-sdk/openai` | GPT family |
| Ollama | `ollama-ai-provider-v2` | Local models |
| Chrome Built-in | Native browser API | Gemini Nano (on-device) |

Each provider is configured with an API key, optional thinking mode toggle, and a custom system prompt on the Options page. The side panel's model selector dropdown allows switching providers mid-conversation.

### Built-in AI Playgrounds

A set of sandboxed UIs that allow users to experiment with individual Chrome Built-in APIs in isolation, helping them learn each API's parameters and behavior before incorporating them into workflows or custom tools. Each playground is a self-contained form with parameter controls and a results pane:

- **Prompt Lab** — Free-form prompting against Gemini Nano with configurable parameters.
- **Writer's Studio** — Experiment with the Writer API (tone, length, format).
- **Summarization Station** — Test summarization with different input lengths and styles.
- **Polyglot Panel** — Test translation between languages.
- **Proofreader** — Grammar and style checking.

### Transparent Tool Execution

When the AI agent invokes a tool, the chat UI renders an inline **Tool Call Card** showing:
- The tool name and invocation status.
- Full input arguments (expandable).
- The JSON response returned.
- Execution duration.

For reasoning-capable models, a collapsible **Thought Process** block shows the model's planning steps before delivering its answer.

---

## User Flows

### Flow 1: Chat with tool use
1. User opens the side panel by clicking the extension icon in the Chrome toolbar.
2. The side panel appears alongside the active web page with a "How can I help you today?" prompt.
3. User types a question or instruction (e.g., "What recipes are on this page?").
4. The side panel sends the prompt to the selected AI provider with the full list of available MCP tools.
5. The AI model decides to call one or more tools (e.g., `dom_extraction` to read page content).
6. The side panel routes each tool call through the MCP server in the service worker.
7. For page-context tools: service worker → content script → page context → execute → return result chain.
8. For Chrome API tools: service worker executes directly via `chrome.*` APIs.
9. The tool result is sent back to the AI model, which formulates a response.
10. The chat UI renders the tool call card(s) inline and the model's final answer with full Markdown formatting.

### Flow 2: WebMCP tool authoring
1. User opens Options → WebMCP Tools and sees a card grid of existing tools.
2. User clicks to create a new tool or opens the custom scripts editor.
3. User writes JavaScript in the code editor that defines a tool (name, description, input schema, handler function).
4. On save, the script is stored in `chrome.storage.local`.
5. The service worker detects the storage change via `onChanged` listener and re-injects the tool script into active tabs.
6. The content script bridge discovers the new tool via `client.listTools()` and registers it with the MCP server.
7. The tool appears in the WebMCP Tools card grid and becomes available to the AI agent in chat.

### Flow 3: Workflow creation and execution
1. User opens Options → Workflow Composer.
2. User drags node types from the left palette onto the canvas (e.g., Start → Static Input → Rewriter API → Summarizer API → Condition → Tooltip/Alert).
3. User connects nodes by drawing edges and configures each node's parameters in the right panel.
4. The workflow is saved to `chrome.storage.local`.
5. The service worker converts it into an MCP tool via `transformWorkflowToTool()`.
6. The workflow appears in: the side panel's Workflows tab, the right-click context menu, and as an invocable tool in chat.
7. When triggered, the `WorkflowEngine` in `engine-core` parses the graph and executes nodes sequentially, passing data between executors via the node output/input contract.

### Flow 4: External MCP server connection
1. User opens Options → MCP Servers and clicks "Add Server".
2. User enters a server URL (SSE or HTTP endpoint) with optional custom headers and domain allowlist.
3. The `McpHub` creates a `Client` with the appropriate transport (`SSEClientTransport`, `StreamableHTTPClientTransport`, or `StatelessHTTPClientTransport`).
4. The client connects, discovers tools via `listTools()`, and registers them on the MCP server.
5. The discovered tools appear in the side panel's tool list and become available to the AI agent alongside built-in and user tools.

### Flow 5: Built-in AI experimentation
1. User opens Options → API Playgrounds.
2. User selects a playground (e.g., Prompt Lab).
3. User configures parameters and provides input text.
4. The playground calls the Chrome Built-in AI API directly (e.g., `ai.languageModel.create()` for Prompt Lab).
5. Results are displayed in the playground's output pane.
6. User iterates on parameters to understand the API's behavior before using it in workflows or custom tools.

### Flow 6: DevTools debugging
1. Developer opens Chrome DevTools and navigates to the **AWL** tab.
2. The **Tool List** panel shows all MCP tools registered for the current tab in a table format, with each tool's name, description, and input schema.
3. Selecting a tool reveals its full JSON schema definition.
4. The **Run Tool** panel lets the developer manually execute any tool by filling in its parameters and clicking "Run Tool" — the raw JSON result is displayed immediately.
5. The **Events** panel streams all MCP communication (tool calls, results, registrations) with timestamps for real-time debugging.

---

## Monorepo Structure

```
packages/
├── extension/              Main Chrome extension (React 19, Vite, Tailwind)
├── engine-core/            Workflow execution engine (platform-agnostic)
├── engine-extension/       Extension bindings for engine-core
├── engine-web/             Page-context runtime for workflow executors
├── common/                 Shared types, constants, and utilities
├── design-system/          Reusable UI components (Tabs, Sidebar, Cards, etc.)
├── chrome-ai-playground/   Sandboxed AI API experimentation UIs
├── mcp-inspector/          MCP server debugging and inspection UI
└── workflow-ui/            Visual workflow composer (node-graph editor)
```

**Build system:** Vite + TypeScript 5.8 + pnpm workspaces (pnpm >= 10).
**UI framework:** React 19 + Tailwind CSS (via `@tailwindcss/vite`).
**Development:** `pnpm dev` runs six concurrent watch builds (engine-core, engine-extension, engine-web, workflow-ui, contentScript, extension). Output goes to `dist/extension/`.

---

## Storage Model

| Store | Scope | Data |
|---|---|---|
| `chrome.storage.sync` | Cross-device | API keys, agent selection, theme, log level, prompt commands |
| `chrome.storage.local` | Per-browser | WebMCP tool scripts, MCP server configs, workflows, built-in tool states |
| `chrome.storage.session` | Per-session | Sidebar position, transient tab state |

---

## Configuration Types

```typescript
type SettingsType = {
  config: {
    apiKeys?: Record<string, APIKeys>;       // per-provider API keys
    extensionSettings?: { theme, logLevel };
    userWebMCPTools?: string;                 // serialized user tool scripts
    mcpConfigs?: string;                      // serialized MCP server configs
    builtInToolsState?: Record<string, boolean>;
    promptCommands?: PromptCommand[];
    workflows?: WorkflowJSON[];
    chromeAPIBuiltInToolsState?: Record<string, { enabled: boolean }>;
  };
  version: string;
  extensionVersion: string;
  timestamp: number;
};

type APIKeys = {
  apiKey: string;
  thinkingMode?: boolean;    // enable chain-of-thought for supported models
  status: boolean;
  systemPrompt: string;     // custom instructions prepended to conversations
};
```
