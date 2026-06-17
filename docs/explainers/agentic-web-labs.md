# Agentic Web Labs (AWL) — Explainer

## Summary

Agentic Web Labs is a pnpm monorepo that ships tools for the emerging
"agentic web" — the shift from websites that only serve HTML to humans
toward sites that also expose structured tools and capabilities to AI
agents. It contains **two distinct product lines** built on a shared set
of internal packages: the **AWL Chrome extension**, a hands-on learning
playground for MCP, WebMCP, and Chrome's built-in AI; and **NPM Advisor**,
a package-intelligence suite that ships as a Chrome extension, a VSCode
extension, and a standalone MCP server — all three driven by one shared
analysis engine.

> **Note on curated docs:** the repo-root [README.md](../../README.md) is
> authoritative and thorough — but only for the AWL extension. The entire
> NPM Advisor product line is documented in its own package READMEs, not
> at the root. An untracked working note,
> [extensions-analysis.md](../../extensions-analysis.md), is currently the
> only top-level document that mentions all three extensions together.
> Mismatches found during this review are flagged in **Gotchas** below.

---

## For users

The repo produces two things you can actually use.

### 1. AWL — the Agentic Web learning Chrome extension

**What it does.** Turns any browser tab into an interactive lab for the
technologies of the agentic web. From a side-panel chat you can talk to
cloud models (Claude, Gemini, GPT) or Chrome's on-device Gemini Nano, and
give those models the ability to *act* on the page: call Chrome APIs,
invoke tools a page exposes via WebMCP, connect to remote MCP servers, and
run visual AI workflows.

**How to use it.**
- Build and load it: `pnpm install && pnpm build`, then load the
  `dist/extension` directory as an unpacked extension at
  `chrome://extensions` (see [README.md](../../README.md) §Getting
  Started). `pnpm dev` runs a watch build.
- Click the AWL toolbar icon to open the side-panel chat; use the Options
  page to configure model API keys, connect MCP servers, author WebMCP
  tools, and build workflows.
- Some features (custom WebMCP scripts) require enabling the **User
  Scripts** permission on the extension's details page.

**Key concepts.**
- **MCP (Model Context Protocol)** — the standard by which agents discover
  and call external tools.
- **WebMCP** — a page registering tools on `navigator.modelContext` so
  agents can call page-level functionality.
- **Built-in AI** — Chrome's on-device Gemini Nano APIs (Prompt, Writer,
  Rewriter, Summarizer, Translator, Proofreader).
- **Workflow** — a node graph of built-in-AI steps that, once built, is
  itself exposed as a callable MCP tool.

**Common workflows.** Chat with a model that can act on the current page;
connect to and inspect an external MCP server; author a WebMCP tool and
watch an agent call it; experiment with a built-in AI API in a sandboxed
playground; compose a multi-step AI workflow on a canvas.

### 2. NPM Advisor — package intelligence, three ways

**What it does.** Evaluates npm packages — a "fitness" score, security
advisories, license compatibility, bundle size, GitHub activity, and
lighter-weight replacement suggestions — and surfaces that intelligence
wherever you work.

**How to use it.**
- **Chrome extension:** browse [npmjs.com](https://www.npmjs.com) or a
  `package.json` on GitHub and a side-panel dashboard appears
  automatically, with an AI chat and a multi-package comparison tool.
- **VSCode extension** (`vscode-npm-advisor`): hover any dependency in
  `package.json` for inline stats; vulnerable/incompatible/unmaintained
  deps surface in the Problems panel; an Activity-Bar panel rolls up
  project health; `@npm-advisor` answers in Copilot Chat; a migration
  wizard rewrites deps to lighter alternatives.
- **MCP server** (`@agentic-web-labs/npm-advisor-mcp`): run
  `npx -y @agentic-web-labs/npm-advisor-mcp` and wire it into Claude Code,
  Claude Desktop, Cursor, Continue, or VSCode to give those agents five
  package-analysis tools. See
  [its README](../../packages/mcp/npm-advisor-mcp/README.md).

**Key concepts.**
- **Fitness score (0–100)** — composite of bundle size, dependency count,
  and issue responsiveness, with a security-advisory penalty.
- **Target license** — the license you're checking compatibility against
  (defaults to MIT), evaluated via the OSADL matrix.
- **Replacements** — lighter alternatives sourced from the
  [e18e/module-replacements](https://github.com/e18e/module-replacements)
  project.

**Common workflows.** Decide whether to adopt a package; audit every
dependency in a project; check publish-readiness and import cycles for a
package you maintain; migrate a heavy dependency to a lighter one; ask an
AI agent about your dependencies through MCP.

> The repo also ships **Claude Code skills** under [skills/](../../skills/)
> (Chrome built-in AI guides, a web-compatibility audit pipeline, and a
> WebMCP builder). These are authoring aids for developers, not part of
> either shipped product — see [skills/README.md](../../skills/README.md).

---

## For engineers

### Responsibilities & boundaries

The repo is a **pnpm workspace monorepo** (`packages/*`, see
[pnpm-workspace.yaml](../../pnpm-workspace.yaml)) organized into four
buckets:

| Dir | Owns |
|---|---|
| `packages/extensions/*` | The three shipped extensions: `awl` (Chrome), `npm-advisor` (Chrome), `vscode` (VSCode). |
| `packages/mcp/*` | `npm-advisor-mcp` (the standalone MCP server) and `awl-mcp-inspector`. |
| `packages/awl/*` | AWL-specific engines/UI: `engine-core`, `engine-extension`, `engine-web`, `workflow-ui`, `chrome-ai-playground`. |
| `packages/shared/*` | Cross-cutting libraries: `package-analyzer-core` (the NPM Advisor brain), `project-analyzer-core`, `package-analyzer-ui`, `chatbot`, `common`, `design-system`, `table`, `shared-config`, `storybook-config`. |

The two product lines are **deliberately decoupled** — they share generic
infrastructure (`chatbot`, `design-system`, `common`, build/lint config)
but not domain logic. AWL knows nothing about npm package scoring; NPM
Advisor knows nothing about WebMCP or workflows.

What the repo deliberately does *not* do: no backend service of its own —
all analysis runs client-side or in a locally-spawned process, hitting
only public third-party APIs. No telemetry. Keys and caches stay local.

### Architecture — the big picture

```
                         packages/shared
   ┌─────────────────────────────────────────────────────────────┐
   │ chatbot · common · design-system   package-analyzer-core     │
   │ (generic UI/runtime/utilities)      project-analyzer-core     │
   │                                     package-analyzer-ui       │
   └───────┬──────────────────────────────────┬──────────────────-┘
           │ (generic infra)                   │ (the "brain": one
           │                                   │  getPackageStats fn)
   ┌───────┴───────────┐            ┌──────────┴───────────────────┐
   │  AWL PRODUCT LINE │            │   NPM ADVISOR PRODUCT LINE    │
   │                   │            │                               │
   │ extensions/awl    │            │ extensions/npm-advisor (Chrome)│
   │  + packages/awl/* │            │ extensions/vscode (VSCode)     │
   │   engine-core     │            │ mcp/npm-advisor-mcp (server)   │
   │   engine-extension│            │                               │
   │   engine-web      │            │  all 3 import the same         │
   │   workflow-ui     │            │  package-analyzer-core         │
   │   chrome-ai-...   │            │                               │
   └───────────────────┘            └───────────────────────────────┘
```

#### Engineer subsection A — the AWL Chrome extension

**Entry points** (declared in
[packages/extensions/awl/src/manifest.json](../../packages/extensions/awl/src/manifest.json),
Manifest V3, host permissions `*://*/*`):

| Surface | File |
|---|---|
| Service worker (module) | `serviceWorker/serviceWorker.js` |
| Content script (all URLs) | `contentScript/contentScript.js` |
| Side panel (chat) | `view/sidePanel/sidePanel.tsx` |
| Options page | `view/options/options.tsx` |
| DevTools page | `view/devtools/devtools.tsx` |
| Popup | `view/popup/popup.tsx` |
| Web-accessible (injected into page) | `webmcp-polyfill.js`, `registerTools.js`, `registerWorkflowTools.js` |

**The MCP Hub is the heart.** `McpHub` in
[serviceWorker/mcpHub.ts](../../packages/extensions/awl/src/serviceWorker/mcpHub.ts)
(~1200 lines) runs in the service worker and acts as a *proxy MCP server*
that aggregates tools from several sources into one unified tool list the
chat runtime sees:

1. **Chrome API tools** — wrapped Chrome APIs (tabs, history, bookmarks)
   from `contentScript/tools/mcpbTools.ts`, registered per the
   `chromeAPIBuiltInToolsState` in `chrome.storage.local`.
2. **WebMCP page tools** — tools a page registers on
   `navigator.modelContext`, discovered by the content script and reported
   up to the hub.
3. **Workflow tools** — visual workflows transformed into WebMCP tool
   shapes by
   [engine-extension/src/utils/toolTransformer.ts](../../packages/awl/engine-extension/src/utils/toolTransformer.ts).

Each source is filtered (enable/disable flags, domain allowlists) and the
result is held in a `Map<name, RegisteredTool>` with a full lifecycle
(register/update/remove). Storage-change listeners trigger re-registration
when the user edits tools or workflows.

**WebMCP tool-execution flow** — the most non-obvious path in the repo.
A tool call originating in the chat travels across three process
boundaries and two transports:

```
chat (side panel)
  → McpHub.executeTool()                    serviceWorker/mcpHub.ts
      → executeWebMCPTool()  ── chrome.runtime.sendMessage ──▶
  content script: 'execute-tool' listener   contentScript/mcpBridge.ts
      → client.callTool() ── TabClientTransport / postMessage ──▶
  page context: tool runs on navigator.modelContext
      ◀── 'tool-result' (requestId) ── back up the same chain
  RequestManager.resolve(requestId)         serviceWorker/utils/requestManager.ts
```

The `RequestManager` correlates async responses by id. External MCP
servers take a different branch (`executeMCPTool` → `Client.callTool` over
SSE / Streamable HTTP / Stateless HTTP transports). The content↔page hop
uses MCP-B's `TabClientTransport`/`TabServerTransport`.

**Chat runtime.** The side panel composes
[shared/chatbot](../../packages/shared/chatbot/src/) components
(`PropProvider` → `SidepanelChatbot` → `ModelProvider`). Providers are
built in
[chatbot/src/transports/transportGenerator.ts](../../packages/shared/chatbot/src/transports/transportGenerator.ts):
a `CloudHostedTransport` wraps the Vercel AI SDK for Anthropic / OpenAI /
Gemini (Anthropic gets the `anthropic-dangerous-direct-browser-access`
header for browser-origin calls), and `GeminiNanoChatTransport` targets
the on-device model. Model defaults and prompt commands live in
[extensions/awl/src/constants.ts](../../packages/extensions/awl/src/constants.ts).

**Workflow engine — three layers**, all under `packages/awl/`:
- `engine-core` — pure, host-agnostic execution: `WorkflowEngine` (DAG
  executor), `NodeRegistry`, node executors, and an abstract
  `RuntimeInterface` (`engine-core/src/runtime/RuntimeInterface.ts`).
- `engine-extension` — implements `RuntimeInterface` for the service
  worker; bridges DOM operations to the content script; manages global
  run state (`serviceWorker/stateManager.ts`).
- `engine-web` — implements `RuntimeInterface` for the page itself
  (`WebRunner`/`WebRuntime`), attached to `window.awltWorkflow` so a
  workflow-as-tool can execute directly in page context with direct DOM
  access.
- `workflow-ui` — the ReactFlow canvas editor mounted in the Options page.

**Built-in AI playgrounds** live in
[packages/awl/chrome-ai-playground/src/components/apiPlaygrounds/](../../packages/awl/chrome-ai-playground/src/components/apiPlaygrounds/)
(one component per Chrome AI API).

#### Engineer subsection B — the NPM Advisor product line

**The reuse story is the whole point.** A single function,
`getPackageStats` in
[shared/package-analyzer-core/src/lib/getPackageStats.ts](../../packages/shared/package-analyzer-core/src/lib/getPackageStats.ts),
is imported and called identically by all three frontends:

- VSCode: `extensions/vscode/src/extension.ts` (via `cache/statsCache.ts`)
- Chrome: `extensions/npm-advisor/src/serviceWorker/serviceWorker.ts` (via
  `services/packageStats.ts`)
- MCP: `mcp/npm-advisor-mcp/src/tools/getPackageStats.ts`

`getPackageStats` fans out in parallel to the npm registry, GitHub
(repo/issues/security advisories), OSV, and Bundlephobia; merges and
deduplicates advisories (GitHub + OSV by canonical id); applies
version-aware filtering against the lockfile-resolved version; computes the
score; and returns one `PackageStats` shape
(`lib/packageStatsTypes.ts`). Scoring is isolated in
[computeScoreBreakdown.ts](../../packages/shared/package-analyzer-core/src/lib/computeScoreBreakdown.ts):
bundle size (≤45 pts), dependency count (≤35), responsiveness (≤20), minus
a capped security penalty.

A sibling brain,
[shared/project-analyzer-core](../../packages/shared/project-analyzer-core/src/lib/analyzeProject.ts),
handles *project-level* analysis: `runPublint` (publish hygiene),
`findCircularDependencies` (madge), `findReplacementOpportunities`
(e18e), and `runMigrationCodemods` (the VSCode migration wizard's engine).

Frontend specifics:

- **MCP server** ([mcp/npm-advisor-mcp/src/server.ts](../../packages/mcp/npm-advisor-mcp/src/server.ts)):
  registers five tools (`get_package_stats`, `list_known_vscode_projects`,
  `list_workspace_dependencies`, `analyze_package_json`,
  `analyze_project`). Defaults to stdio; `--http` switches to a stateful
  Streamable HTTP transport (`transports/httpTransport.ts`, session reaper,
  optional `MCP_HTTP_TOKEN` bearer auth). Imports
  `redirectConsoleToStderr` first so analyzer logging never corrupts the
  stdout JSON-RPC stream — a subtle but critical detail.
- **VSCode extension** (`extensions/vscode/src/extension.ts`): hover
  provider, Problems-panel diagnostics, an Activity-Bar React webview
  (`providers/webviewViewProvider.ts` + `webview/app.tsx`, talking over a
  `postMessage` protocol), the `@npm-advisor` chat participant, and
  commands including the MCP setup wizard and the migration wizard. Built
  with **esbuild** (three bundles), not Vite.
- **Chrome extension** (`extensions/npm-advisor/src/`): service worker
  orchestrates fetches and caches; the content script
  (`contentScript/contentScript.tsx`) detects npm/GitHub pages and mounts
  React UI in a Shadow DOM; the Options page hosts the comparison tool and
  an AI chat reusing `shared/chatbot`.
- **Shared UI** ([shared/package-analyzer-ui](../../packages/shared/package-analyzer-ui/src/))
  provides the dependency/insights tabs and widgets consumed by both the
  VSCode webview and the Chrome options page via a `StatsClient` interface
  — so the *display* is shared too, not just the data.

### Data / control flow (one example each)

**AWL — "summarize this page" with a page tool:** user message → chat
runtime asks the model → model emits a tool call → `McpHub.executeTool`
routes it to the page via the content-script bridge → tool runs against the
DOM → result returns up the `RequestManager` chain → model continues with
the tool result → rendered as an expandable tool card.

**NPM Advisor — VSCode hover:** hover a dep → `hoverProvider` resolves the
installed version from the nearest lockfile → `statsCache.get(name@version)`
→ cache miss calls `getPackageStats` (parallel API fan-out + score) →
markdown popover rendered. The *same* `getPackageStats` call would have
served an MCP `get_package_stats` request or a Chrome side-panel render.

### Key abstractions

- `McpHub` (AWL) — the tool-aggregation proxy server.
- `RuntimeInterface` (AWL engines) — the seam that lets one workflow engine
  run in three host contexts.
- `getPackageStats` / `PackageStats` (NPM Advisor) — the single analysis
  entry point and its output contract.
- `StatsClient` (`package-analyzer-ui`) — the interface that lets shared UI
  fetch stats without knowing which frontend it's in.

### Patterns & conventions

- **Monorepo via pnpm workspaces**, with a long list of `pnpm.overrides`
  and `patchedDependencies` in the root
  [package.json](../../package.json) (e.g. pinned `zod@4.3.5`, patched
  `@mcp-b/*` transports) — pin/patch carefully, several are load-bearing.
- **Shared brain, thin frontends** — domain logic lives in
  `packages/shared/*-core`; extensions are presentation + host glue.
- **Message-passing transports** — Chrome runtime messaging, MCP-B tab
  transports, and MCP SDK transports are each abstracted rather than called
  inline.
- **Lint enforces structure** — `lint:structure` runs a custom
  `fileStructure.js` ESLint config over the NPM Advisor packages; mirror
  the existing file layout when adding code there.
- Contribute against the **`develop`** branch (per README).

### External dependencies & integration points

- **AWL:** Vercel AI SDK (`ai`), `@assistant-ui/react`,
  `@modelcontextprotocol/sdk`, `@mcp-b/*` (WebMCP transports/polyfill),
  `@xyflow/react` (ReactFlow), Chrome Extension APIs, Chrome built-in AI.
- **NPM Advisor:** npm registry, GitHub REST/GraphQL, OSV, Bundlephobia,
  OSADL license matrix (bundled), e18e/module-replacements; plus
  `publint`, `madge`, `module-replacements-codemods` (`@ast-grep/napi`) for
  project analysis and migration.

### Gotchas & non-obvious decisions (incl. doc/code mismatches)

- **`packages/extensions/awl/README.md` is stale boilerplate.** It is still
  the default "React + TypeScript + Vite" template and says nothing about
  AWL. The real AWL documentation is the repo-root README. *Fixing this is
  low-risk, high-value.*
- **The root README documents only AWL.** The NPM Advisor product line —
  three of the repo's most substantial packages — is invisible at the root.
  The only top-level mention is the untracked
  [extensions-analysis.md](../../extensions-analysis.md), which is a working
  note, not committed docs.
- **Inconsistent repo URL in docs.** The root README clones
  `github.com/amedina/agentic-web-learning-tool`, the npm-advisor-mcp README
  points to `github.com/amedina/agentic-web-labs`, and the VSCode README's
  issues link uses `agentic-web-learning-tool`. The directory and package
  name is `agentic-web-labs`; the `-learning-tool` URLs look like a rename
  left a stale trail. Verify the canonical remote before relying on either.
- **`redirectConsoleToStderr` ordering** in the MCP server is not
  cosmetic — any stray `console.log` on stdout breaks the JSON-RPC stream
  in stdio mode.
- **Migration wizard is platform-bound.** It depends on `@ast-grep/napi`
  native bindings that esbuild can't bundle; it works from source but a
  packaged `.vsix` currently surfaces a friendly error (platform-specific
  publishing is a tracked follow-up). See the VSCode README.
- **WebMCP runs real code in page context** via injected scripts and the
  User Scripts permission — that's why custom tools need a permission
  toggle the rest of the extension doesn't.

### Invariants

- All three NPM Advisor frontends must keep calling the *same*
  `getPackageStats` / `analyzeProject` with the same contracts — divergence
  would split the "single brain" guarantee.
- The MCP server's stdout must carry **only** JSON-RPC in stdio mode.
- AWL's aggregated tool list must stay consistent across the three sources;
  the `Map<name, RegisteredTool>` and its storage-change listeners are the
  single source of truth.
- Advisories are filtered against the lockfile-resolved version, not the
  latest — a finding must reference the version actually installed.

---

## Pointers

Read these first, in order:

1. [README.md](../../README.md) — AWL product framing and setup (note: AWL
   only).
2. [packages/mcp/npm-advisor-mcp/README.md](../../packages/mcp/npm-advisor-mcp/README.md)
   — the clearest single doc for the NPM Advisor analysis pipeline and its
   architecture diagram.
3. [packages/extensions/vscode/README.md](../../packages/extensions/vscode/README.md)
   and [packages/extensions/npm-advisor/README.md](../../packages/extensions/npm-advisor/README.md)
   — the two other NPM Advisor frontends.

Most important code to read:

- AWL: [serviceWorker/mcpHub.ts](../../packages/extensions/awl/src/serviceWorker/mcpHub.ts),
  then [contentScript/mcpBridge.ts](../../packages/extensions/awl/src/contentScript/mcpBridge.ts)
  and [engine-core/src/runtime/RuntimeInterface.ts](../../packages/awl/engine-core/src/runtime/RuntimeInterface.ts).
- NPM Advisor: [package-analyzer-core/src/lib/getPackageStats.ts](../../packages/shared/package-analyzer-core/src/lib/getPackageStats.ts)
  and [computeScoreBreakdown.ts](../../packages/shared/package-analyzer-core/src/lib/computeScoreBreakdown.ts),
  then [mcp/npm-advisor-mcp/src/server.ts](../../packages/mcp/npm-advisor-mcp/src/server.ts).

Related: [skills/](../../skills/) (Claude Code authoring skills),
[bin/](../../bin/) (local npm registry + deploy helpers for testing the MCP
server), and [extensions-analysis.md](../../extensions-analysis.md) (the
informal three-extension comparison).
