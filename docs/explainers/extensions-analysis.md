# Chrome Extensions Analysis

This repo ships **three extensions** across two platforms:

---

## 1. **AWL (Agentic Web Learning Tool)** — Chrome Extension

**What it does:** Turns any browser page into an interactive playground for learning and experimenting with agentic web technologies. It's the flagship extension of the project.

**Key features:**
- Chat interface with Claude, Gemini, GPT, and Chrome's on-device Gemini Nano
- MCP server connections (SSE, Streamable HTTP, Stateless HTTP)
- WebMCP exploration — discover page-registered tools, author custom WebMCP scripts
- Chrome Built-in AI API sandboxes (Prompt, Writer, Rewriter, Summarizer, Translator, Proofreader)
- Visual workflow composer (ReactFlow node-graph editor)
- Custom DevTools panel for debugging agentic interactions

**Architecture:** Vite 7 + React 19, multi-page extension with side panel, popup, options page, devtools page, content script (`*://*/*`), and service worker. Heavily depends on internal workspace packages (engine-core, workflow-ui, chatbot, awl-mcp-inspector, etc.).

---

## 2. **NPM Advisor** — Chrome Extension

**What it does:** Provides real-time npm package intelligence directly while browsing npmjs.com and GitHub.

**Key features:**
- Package analysis dashboard with composite "advisor score," GitHub metrics, bundle footprint, security advisories, license compatibility
- Algolia-enhanced npm search (injected overlay on npmjs.com)
- Package comparison tool from the Options page
- AI-powered chat (Gemini, OpenAI, Anthropic via Vercel AI SDK) with context-aware prompts grounded in real package data
- D3.js force-directed dependency graphs + rc-tree component tree

**Architecture:** Vite 7 + React 19. Dual Vite builds (main for side panel/options/service worker, content script as IIFE). Content script runs only on npmjs.com and GitHub pages. Data flows from background service worker fetching npm registry, GitHub, Bundlephobia APIs in parallel. Uses Algolia for search.

---

## 3. **NPM Advisor** — VSCode Extension (`packages/extensions/vscode/`)

**What it does:** Brings the same package intelligence into the editor via VSCode-native APIs.

**Key features:**
- Hover popovers on any `package.json` dependency showing fitness score, bundle size, security advisories, license
- Problems panel diagnostics (errors for vulnerabilities, warnings for incompatible licenses/unmaintained packages)
- Activity bar side panel with "This Package" and "Project Health" views (workspace-wide rollup of issues)
- GitHub Copilot Chat chat participant (`@npm-advisor`) ground on real cache data
- Migration wizard with codemod capabilities (replaces dependencies with lighter alternatives, modifies source code directly via WorkspaceEdit)
- Bundled MCP server binary in the `.vsix` for external AI editors (Claude Code, Cursor, etc.)

**Architecture:** esbuild (not Vite — three separate bundles: extension.js CJS Node, webview.js IIFE React webview, mcpWizard.js). Activates on `workspaceContains:**/package.json`. Uses VSCode's Problems panel and hover providers. Filesystem-based analysis (jsonc-parser for package.json, lockfile resolution) rather than DOM manipulation.

---

## Comparison Summary

| | AWL | NPM Advisor (Chrome) | NPM Advisor (VSCode) |
|---|---|---|---|
| **Platform** | Chrome extension | Chrome extension | VSCode extension |
| **Domain** | Agentic web learning | npm package evaluation | npm package evaluation in-editor |
| **Build** | Vite 7 + Tailwind 4 plugin | Vite 7 + Tailwind 4 plugin | esbuild + Tailwind CLI |
| **Scope** | Every URL (`*://*/*`) | npmjs.com + GitHub only | Workspace filesystem |
| **Unique capability** | WebMCP polyfill + visual workflow engine + DevTools panel | Algolia search overlay + package comparison tool | Hover diagnostics + codemod migration wizard + bundled MCP server |
