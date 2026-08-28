# Task: extract AWL's "user-authored WebMCP tools" feature into a reusable package, then adopt it in `<TARGET_REPO>`

## 0. Fill these in before running

- `AWL_REPO` = `/Users/albertomedina/DevRel/agentic-web-labs`
- `TARGET_REPO` = `<absolute path>`
- `TARGET_EXT_PATH` = `<path within TARGET_REPO to the MV3 extension>`
- Package name to create = `<@scope/webmcp-user-tools>`

Both repos are MV3 Chrome extensions on React 19 + TypeScript + Vite. They are **separate repos**, so the shared package needs a real distribution path — see §6, which is the one decision I want you to bring back to me before writing code.

---

## 1. What you are building

AWL lets a user author their own WebMCP tools: write an ES-module script in an in-extension code editor, give it a name/description/JSON Schema/domain allowlist, and have the extension register it on `navigator.modelContext` of matching pages so an agent can call it. I want that same capability in `TARGET_REPO`.

**In scope:** user-authored tools only.

**Out of scope (do not port):** the workflow composer (`engine-core` / `engine-extension` / `engine-web` / `workflow-ui`), the DevTools panel, the MCP-server-connection features, the chat side panel, Chrome Built-in AI playgrounds, and AWL's built-in Chrome-API tools (`mcpbTools`, `contentScript/tools/*`). Where the code you are extracting touches those, cut the dependency — do not drag them along.

**But note what AWL's tab actually is, because it constrains the design.** `WebMCPToolsTab` is not a user-tools screen; it is a shared surface over *four* tool sources — `userTools`, `builtInTools`, `mcpbTools`, and `workflowTools` (workflows with `meta.isWebMCP`, mapped through `transformWorkflowToTool`). Only user tools are authored there; the other three are listed and toggled, and workflows are composed in a separate React Flow canvas. We are porting one source now and may add others later — workflows in particular. So the extracted package must be **multi-source by construction** (see §4), not a single-array UI that has to be torn open the first time a second source shows up. Building the seam is in scope; building any second source is not.

Deliverable is a **framework-agnostic-at-the-core, React-at-the-edges package**, consumed by both AWL and `TARGET_REPO`, with AWL's behavior unchanged.

---

## 2. Ground truth — read these before you plan

Everything below is in `AWL_REPO`. Read all of it. My descriptions are a map, not a substitute; where this brief and the code disagree, **the code wins** — and tell me about the disagreement.

### Storage + domain model
- `packages/shared/design-system/src/components/types.ts` — the `WebMCPTool` interface. Note it lives in the *design system*, which is backwards; the domain type should own itself in the new package.
- Persistence is `chrome.storage.local`, key `userWebMCPTools`, holding `WebMCPTool[]`. Related keys `builtInWebMCPToolsState` and `chromeAPIBuiltInToolsState` are AWL-specific and **out of scope**.

### Authoring UI
- `packages/shared/design-system/src/components/webMCPTools/webMCPToolsTab/index.tsx` — list + create/edit/delete shell.
- `packages/shared/design-system/src/components/webMCPTools/editToolDialog/index.tsx` — the editor dialog, `DEFAULT_SCRIPT_TEMPLATE`, validate/save/copy/delete.
- `.../editToolDialog/metadataPanel.tsx` — metadata form.
- `.../editToolDialog/validateCode.ts` — acorn parse + regex structural checks.
- `.../editToolDialog/extractMetadata.ts` — regex scrape of metadata out of the script.
- `packages/shared/design-system/src/components/codeEditor/*` — the editor widget (`react-syntax-highlighter`-based).
- `packages/shared/design-system/src/components/tools/{toolList,toolCard}/*` — list rendering.

### Extension wiring
- `packages/extensions/awl/src/view/options/components/webmcpTools/index.tsx` — options-page binding (also mixes in workflow + built-in tools; ignore those paths).
- `packages/extensions/awl/src/view/options/providers/toolProvider/toolProvider.tsx` — storage read/write, `chrome.storage.local.onChanged` sync, `saveUserTools`.
- `packages/extensions/awl/src/serviceWorker/mcpHub.ts` — the core. Read specifically:
  - `54–96` — `userToolScripts` cache, `toolInjected` latch, storage-change and `webNavigation.onCompleted` listeners.
  - `599–700` — `registerOrUpdateWebMCPTools`: enabled-filtering, domain-filtering, registration into the per-tab `McpServer`.
  - `786–822` — `executeWebMCPTool`: forwards to the content script via `requestManager`.
  - `824–930` — `executeTool`: execution logging/broadcast.
  - `938–1053` — `injectToolsAndRegisterFunction`: the load-bearing part. `chrome.scripting.executeScript({ world: 'MAIN' })` → `Blob` → `URL.createObjectURL` → `await import(url)` → `{ ...module.metadata, execute: module.execute }` → `navigator.modelContext.registerTool`.
- `packages/extensions/awl/src/serviceWorker/utils/domainMatcher.ts` — `isDomainAllowed`; `<all_urls>`, bare host (implicitly includes subdomains), `*.host`, and full-URL glob. Has the only unit test in the whole slice: `serviceWorker/utils/tests/domainMatcher.test.ts`.
- `packages/extensions/awl/src/serviceWorker/utils/sanitizeToolName.ts`
- `packages/extensions/awl/src/serviceWorker/utils/handleToolEnableDisableOnLocalStorageChange.ts` — enable/disable propagation.
- `packages/extensions/awl/src/serviceWorker/utils/requestManager.ts` — SW↔content-script request correlation.
- `packages/extensions/awl/src/serviceWorker/index.ts` `~130–170` — the `updateScript` message handler behind the live-edit `editedScript` field.
- `packages/extensions/awl/src/serviceWorker/chromeListeners/tabOnClosedCallback.ts` — clears `editedScript.tabId` on tab close.
- `packages/extensions/awl/src/contentScript/mcpBridge.ts` — injects the polyfill, opens `TabClientTransport` → MCP `Client` into the page, `listTools()` → `register-tools` to the SW, handles `execute-tool` / `tool-result`.
- `packages/extensions/awl/src/contentScript/assets/webmcp-polyfill.js` — vendored `@mcp-b/global` IIFE. Provides `navigator.modelContext` and the `TabServerTransport` side when Chrome's native WebMCP isn't available.
- `packages/extensions/awl/src/manifest.json` — permissions, `web_accessible_resources`.

### The end-to-end contract you must preserve
1. User writes an ES module exporting `metadata` (object) and `execute` (async function) in the options page; it is validated and saved into `chrome.storage.local.userWebMCPTools`.
2. On navigation-complete and on any change to that storage key, the SW filters tools by `enabled !== false` **and** `isDomainAllowed(tabUrl, tool.allowedDomains)`, then injects the survivors into the tab's MAIN world and registers them on `navigator.modelContext`.
3. The content script's MCP client lists page tools and reports them to the SW, which registers each into the per-tab `McpServer` under `sanitizeToolName(name)`.
4. An agent calling the tool goes SW → `requestManager` → content script → MCP `callTool` over `TabClientTransport` → page → the user's `execute`, and the result comes back the same way.
5. Every execution is broadcast as a structured log entry (id, tool, args, timing, status, result/error, and the script source).

---

## 3. Defects and sharp edges in AWL — fix these in the extraction, don't port them faithfully

I found these while mapping the feature. Confirm each against the code, then decide with me whether to fix in the package, fix in AWL too, or explicitly carry forward. Do not silently reproduce them.

1. **The CSP claim is false.** `mcpHub.ts:1004` comments *"This works because we stripped CSP headers"*, but the manifest declares no `declarativeNetRequest` permission and no code anywhere modifies response headers. `import(blobURL)` therefore throws on any page with a restrictive `script-src`. This is the single biggest portability risk. Note the manifest *does* declare the `userScripts` permission, which is entirely unused — `chrome.userScripts` is the more likely correct mechanism. **Decide and justify the injection strategy explicitly; don't inherit this by accident.**
2. **`saveUserTools` crashes on a fresh profile.** `toolProvider.tsx:147–152` destructures `userWebMCPTools` from `chrome.storage.local.get` with no default and immediately calls `.find()` on it. First-ever save on a clean install is a `TypeError`.
3. **Enable/disable matches tool names by substring.** `handleToolEnableDisableOnLocalStorageChange.ts` uses `toolName.includes(key)`, so toggling a tool named `get` toggles every tool whose name contains `get`. Needs exact-match keying.
4. **Tool identity is the mutable `name`.** `WebMCPTool.id` exists but is unused on the user-tool path; create/edit/delete/dedupe all key off `name`. Renaming in the editor orphans the old entry. Give tools a stable id in the new package.
5. **`sanitizeToolName` can collide.** It maps each invalid char to `_` with no collapsing and no uniqueness check, so `my tool` and `my-tool` both become `my_tool` and clobber each other in `registeredTools`.
6. **Validation is regex-shaped, not AST-shaped.** `validateCode.ts` parses with acorn for *syntax* and then asserts structure with regexes (`/export\s+const\s+metadata\s*=\s*\{/`, `/export\s+async\s+function\s+execute\s*\(/`). Valid modules — `export const execute = async () => {}`, or a `metadata` object built before export — fail validation. Walk the acorn AST you already produced.
7. **`extractMetadata.ts` returns `inputSchema` as a raw string,** captured by a non-greedy regex that breaks on any nested object. Parse from the AST instead.
8. **`toolInjected` is a single latch shared by two injection paths** (user tools and workflows), set inconsistently across `mcpHub.ts:74–96` and `1097`, so an injection can be skipped. In the extracted package there is only one path — give it clear, single-owner state.
9. **Per-hub `chrome.storage.local.onChanged` listener is registered in the `McpHub` constructor and never removed** — one leaked listener per tab hub.
10. **`isDomainAllowed` denies by default** when `allowedDomains` is empty, while the editor's default template ships `["<all_urls>"]`. That combination is defensible, but make it a documented, deliberate policy rather than an accident of two files.
11. **Effectively no test coverage.** `domainMatcher` has the only unit test in the slice. `validateCode`, `extractMetadata`, `sanitizeToolName`, the storage layer, and the injection path have none.

**Security posture — state it, don't bury it.** User-authored code is imported as a blob module into the page's MAIN world and runs with full page privileges: same-origin fetch, cookies, DOM, storage. The only controls are the per-tool domain allowlist and the enable flag. The package must make that explicit in its README and its UI, and must not widen it (no cross-origin execution, no auto-enable, no default `<all_urls>` for imported tools).

---

## 4. Package design

Structure it so the target repo only has to supply glue:

- **Core (no React, no `chrome.*`)** — `WebMCPTool` type and its zod/JSON-Schema validation, AST-based script validation and metadata extraction, `isDomainAllowed`, tool-name sanitization + collision resolution, the default script template.
- **Extension runtime (`chrome.*`, no React)** — a storage adapter over `chrome.storage.local` with a **configurable key namespace** (do not hardcode `userWebMCPTools`), the injection/registration routine, the SW↔content-script execute/result protocol with a `requestManager`, and the execution-log event shape. Registration into an `McpServer` must be injected, not assumed — the target may host MCP differently.
- **React UI** — `WebMCPToolsPanel` (list + CRUD) and `EditToolDialog`, taking tools + callbacks as props, with the code-editor component **injectable** so the target isn't forced onto `react-syntax-highlighter`. No AWL design-system, `@agentic-web-labs/common` `logger`, or `toast` dependency; accept a logger and a notifier as options.
- **The multi-source seam.** `WebMCPToolsPanel` takes a list of *tool source* descriptors rather than a hardcoded `userTools` array. A source declares at minimum: an id and display label; how to read its tools (as a common list-item shape — name, description, `allowedDomains`, `enabled`); whether its tools are user-authored (i.e. whether Create/Edit/Delete apply, or only the enable toggle); and its enable/disable handler. The user-tools source is one implementation of that contract and the only one you build.

  Validate the seam against the sources you are *not* porting: AWL's four categories must each be expressible as a descriptor without changing the contract. Sanity-check specifically that a read-only, externally-owned source with its own persistence — workflows, whose enable flag lives in `workflow.meta.enabled` and is written via `saveWorkflow`, not in the user-tools storage key — fits with no special-casing. If it doesn't, the contract is wrong; fix the contract, not the example.

  Keep this proportionate. It is an interface shape, not a plugin framework: no registry, no dynamic loading, no abstraction over storage backends beyond the handler each source supplies.

Every AWL-specific import in the extracted code must be severed: `@agentic-web-labs/design-system`, `@agentic-web-labs/common`, `engine-*`, `mcpbTools`, `builtInTools`, AWL's `MESSAGE_TYPES`.

Ship the `@mcp-b/global` polyfill decision explicitly: either the package vendors/loads it, or it documents that the host extension must provide `navigator.modelContext`. Don't leave it implicit.

---

## 5. Working protocol

Do this in phases and stop at each gate.

- **Phase 0 — Report.** Read everything in §2. Produce: a file-by-file inventory with real line counts; the true dependency graph of the slice; confirmation or correction of each item in §3; and your recommendation on §6. **Stop. Wait for me.**
- **Phase 1 — Extract in place, in `AWL_REPO`.** Create the new package inside AWL's pnpm workspace and move the code into it. AWL becomes the first consumer. Behavior must be identical: the options-page tool tab, save, enable/disable, domain gating, injection, and execution all still work. Fix only the §3 items we agreed on. **Gate: AWL's existing lint, typecheck, and tests pass, and you have manually loaded the unpacked extension and confirmed create → save → navigate → agent-invokes a tool still works.**
- **Phase 2 — Cover it.** Unit tests for validation, metadata extraction, domain matching, name sanitization/collision, and the storage layer. This code had almost none; it should not leave AWL that way.
- **Phase 3 — Distribute.** Implement the §6 decision.
- **Phase 4 — Adopt in `TARGET_REPO`.** Wire the package in: manifest permissions and `web_accessible_resources`, service-worker registration/injection, content-script bridge, options-page panel. **Gate: unpacked build in `TARGET_REPO`, tool authored, tool invoked end-to-end, evidence shown.**

Rules:
- **Do not regress AWL.** It is the reference implementation and a live project. Work on a branch off `develop`; never commit to `develop` directly.
- Do not commit or push in either repo unless I ask.
- Do not "improve" adjacent AWL code that the extraction doesn't require.
- When you hit a fork not covered here, ask rather than guess — especially anything touching the security posture in §3.
- Report honestly: if a gate fails, show me the output. If you skip something, say so.

---

## 6. The decision I need from you first

The two repos are separate, so "shared package" needs a mechanism. Assess and recommend one, with the tradeoff stated plainly:

- **Publish to npm** (public or private/GitHub Packages) — cleanest consumption, adds release process and versioning overhead.
- **Git subtree or submodule** — no registry, but sync is manual and easy to get wrong.
- **Vendor a copy into `TARGET_REPO`** — fastest to working code, guarantees drift; would make "extract to a shared package" a fiction.

Give me your recommendation and why, in Phase 0, before writing any code.

---

## 7. Acceptance criteria

- A single package is the only home for the user-tool logic; AWL and `TARGET_REPO` both consume it, neither forks it.
- AWL's behavior is unchanged, verified by a manual end-to-end run, not just a green build.
- In `TARGET_REPO`: a user can author a tool in the options page, validation catches a genuinely malformed script and accepts a valid arrow-function `execute`, the tool registers only on allowed domains, disabling it removes it from the agent's tool list, and invoking it returns the result with a log entry.
- The panel is driven by tool-source descriptors, and you can show me AWL's four categories written as descriptors — including the workflow source — even though only the user-tools source is implemented.
- Each §3 item is resolved, or carried forward with a written reason.
- The package README states the security model in §3 plainly.
