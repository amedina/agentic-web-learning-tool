# Potential Issues & Edge Cases

This document lists all identified scenarios where the extension may not work as expected. Use the checkboxes to track testing progress.

**Legend:**
- [ ] = Not yet tested / needs runtime verification
- [x] = Tested & verified working OR fixed
- `CONFIRMED` = Static analysis confirmed the issue is present in the source code
- `MITIGATED` = Static analysis found the issue is addressed/mitigated
- `NEEDS RUNTIME TEST` = Cannot be verified statically; requires manual testing

> **Automated check:** Run `node bin/check-potential-issues.mjs` to re-run static analysis.

---

## 1. First-Time Installation & Setup

- [ ] **1.1 — Open side panel immediately after install without configuring API key** `CONFIRMED`
  - Steps: Install extension -> click icon -> send a chat message before any API key is configured.
  - Risk: No model configured; `this.model` is null in transport. Chat may crash or show a cryptic error instead of a friendly prompt to configure an API key.
  - Analysis: Both GeminiNano and CloudHosted transports return an empty `ReadableStream()` when runtime/model is null. No user-friendly "configure API key" message is shown.

- [ ] **1.2 — Extension update from older version with incompatible storage format** `CONFIRMED`
  - Steps: Have an old version installed -> update to the new version.
  - Risk: `onInstalledCallback` does `JSON.parse()` on `extensionSettings` without try-catch. If old format stored a non-JSON value, the entire initialization crashes.
  - Analysis: `onInstalledCallback.ts` line 49 has `JSON.parse()` with no surrounding try-catch.

- [ ] **1.3 — Open extension on a `chrome://` page** `CONFIRMED`
  - Steps: Navigate to `chrome://settings` -> open side panel -> try using chat with tools.
  - Risk: Content script cannot be injected into `chrome://` pages. Tools won't be available. No clear error message to the user.
  - Analysis: McpHub skips `chrome://` URLs via `startsWith('chrome://')` but no error message is surfaced to the user in the side panel.

- [ ] **1.4 — Open extension on a `file://` page** `CONFIRMED`
  - Steps: Open a local HTML file -> open side panel.
  - Risk: Content script injection likely blocked. Extension may appear functional but tools silently fail.
  - Analysis: No `file://` URL check found in McpHub. Content script injection will silently fail.

---

## 2. API Key Configuration (Options -> Models Tab)

- [ ] **2.1 — Enter an invalid/expired API key** `CONFIRMED`
  - Steps: Options -> Models -> paste a malformed or expired API key -> try chatting.
  - Risk: No API key format validation. The key is stored and used as-is. First chat message fails with a provider-specific error that may not be user-friendly.
  - Analysis: No API key format/structure validation found in model provider. Keys stored as-is.

- [ ] **2.2 — Enter API key with leading/trailing whitespace** `CONFIRMED`
  - Steps: Copy-paste key with extra spaces.
  - Risk: Whitespace not trimmed. Requests fail with auth errors.
  - Analysis: Options model provider does NOT call `.trim()` on API keys before saving.

- [ ] **2.3 — Configure Ollama without running Ollama locally** `CONFIRMED`
  - Steps: Set Ollama as provider -> enter localhost URL -> send message.
  - Risk: Connection refused error. No specific error handling for Ollama offline scenario.
  - Analysis: `initializeSession` has try-catch but only logs error and sets `model=null`. User sees empty response, no "connection failed" message.

- [ ] **2.4 — Switch providers mid-conversation** `CONFIRMED`
  - Steps: Chat with Claude -> switch to GPT in options -> return to side panel.
  - Risk: Transport re-initialization race condition. The old transport may still reference the old runtime. Messages may route incorrectly.
  - Analysis: Neither transport implements `dispose`/`destroy`/cleanup. Old transport is not cleaned up when switching providers.

- [ ] **2.5 — Enable "thinking mode" for a model that doesn't support it** `CONFIRMED`
  - Steps: Enable thinking mode for a non-Claude model.
  - Risk: No validation that the selected model supports extended thinking. May cause API errors or be silently ignored.
  - Analysis: No model-capability check found for thinking mode in options provider.

- [ ] **2.6 — Delete API key while chat is in progress** `CONFIRMED`
  - Steps: Start a streaming response -> go to options -> clear the API key.
  - Risk: Streaming continues with old transport reference. Next message fails with unclear error.
  - Analysis: Neither transport listens for storage changes to abort active streams when API key is deleted.

---

## 3. Chat (Side Panel)

- [ ] **3.1 — Send message before model finishes initializing** `CONFIRMED`
  - Steps: Open side panel -> immediately type and send a message.
  - Risk: `this.model` may still be null. `streamText()` throws. Race between `initialize()` and `sendMessages()` is not guarded.
  - Analysis: `sendMessages()` does not await `initializeSession()`. If model is null, returns empty stream silently.

- [ ] **3.2 — Send very long message (>100K characters)** `CONFIRMED`
  - Steps: Paste a huge document into chat and send.
  - Risk: No input length validation. May exceed API token limits. Provider returns error that may not be displayed cleanly.
  - Analysis: No message length/token limit check in either transport before sending to API.

- [ ] **3.3 — Rapid-fire multiple messages** `CONFIRMED`
  - Steps: Send message -> immediately send another before first responds.
  - Risk: Multiple concurrent `streamText()` calls. No request queuing. Responses may interleave or one may be lost.
  - Analysis: No queue/mutex/lock mechanism found in either transport.

- [x] **3.4 — Abort/cancel a streaming response** `MITIGATED`
  - Steps: Click stop while response is streaming.
  - Risk: Abort signal fires but cleanup may be incomplete (especially for Gemini Nano transport). Deadlock paths when abort happens during tool-call fence parsing.
  - Analysis: Both CloudHosted and GeminiNano transports pass `abortSignal` to `streamText()`. Abort should work for stream cancellation.

- [ ] **3.5 — Network disconnection during streaming** `CONFIRMED`
  - Steps: Start chat -> disconnect WiFi mid-response.
  - Risk: Stream interruption not explicitly handled. Partial response may freeze on screen with no error indicator.
  - Analysis: `streamText` has `onError` callback (logs error) but no retry/reconnect logic. Stream fails permanently on network drop.

- [x] **3.6 — Use Browser AI (Gemini Nano) on unsupported device** `MITIGATED`
  - Steps: Select "Browser AI" provider -> send message.
  - Risk: `LanguageModel` API unavailable. Returns empty ReadableStream. User sees blank response with no explanation.
  - Analysis: GeminiNano checks `LanguageModel` existence and `availability()`. Guard exists and throws descriptive error if unavailable.

- [ ] **3.7 — Chat exceeds Chrome storage quota** `CONFIRMED`
  - Steps: Have a very long conversation (thousands of messages).
  - Risk: `chrome.storage.local.set()` in chatStorage has no error handling. When quota exceeded, messages silently fail to persist. Conversation lost on reload.
  - Analysis: 6 `chrome.storage.local.set()` calls in chatStorage.ts, 0 error handlers. No quota exceeded handling.

- [ ] **3.8 — Switch tabs rapidly while chatting** `CONFIRMED`
  - Steps: Open side panel -> switch between 5+ tabs quickly.
  - Risk: Tab tracking race condition. `setActiveTab` called with stale data. Thread may load for wrong tab.
  - Analysis: No debounce/mutex mechanism in either transport. Rapid tab switches can trigger concurrent requests.

- [ ] **3.9 — Delete a chat thread then immediately refresh** `CONFIRMED`
  - Steps: Delete thread -> refresh side panel before storage write completes.
  - Risk: `chrome.storage.local.set()` in delete is not awaited. Thread metadata deleted but messages may remain orphaned.
  - Analysis: `chatStorage.threads.delete()` does NOT `await` `chrome.storage.local.set()` (line 76).

- [ ] **3.10 — First message has no text parts (only tool results)** `CONFIRMED`
  - Steps: Trigger a scenario where the first message in a thread has no text parts.
  - Risk: Thread title extraction does `.filter(part => part.type === 'text')[0].text.substring(0, 30)`. If no text parts, `.text` on undefined throws TypeError.
  - Analysis: Unsafe `[0]` access after `.filter()` without checking array length in both `historyAdpter.tsx` and `chatAdapter.ts`.

- [ ] **3.11 — Use chat from multiple browser windows simultaneously** `CONFIRMED`
  - Steps: Open side panel in Window A and Window B, both chatting.
  - Risk: Concurrent modification of `assistant-ui-threads` in storage. Last write wins — earlier messages from one window may be lost.
  - Analysis: chatStorage uses read-modify-write on chrome.storage.local without any locking. Concurrent writes from multiple windows can cause data loss.

- [ ] **3.12 — MAX_LOOPS (10) hit during multi-step tool use with Browser AI** `CONFIRMED`
  - Steps: Use Gemini Nano with a task requiring >10 tool calls.
  - Risk: Hardcoded `MAX_LOOPS = 10`. Conversation silently cuts off with "other" finish reason. No indication to user why response stopped.
  - Analysis: `stopWhen: ({ steps }) => steps.length === 10` in Gemini Nano transport. No user notification.

---

## 4. Slash Commands

- [ ] **4.1 — Type `/settings` command** `CONFIRMED`
  - Steps: In chat, type `/settings` and send.
  - Risk: Opens options page via `setTimeout` with async function that's never awaited. If `openOptionsPage()` fails, error is silently swallowed.
  - Analysis: `setTimeout(async () => { await openOptionsPage(); }, 500)` with no `.catch()`.

- [ ] **4.2 — Use custom slash command when storage is corrupted** `CONFIRMED`
  - Steps: Create custom command -> corrupt `promptCommands` in storage -> use command.
  - Risk: `promptCommands` retrieved from storage without validation. If it's not an array, `.forEach` fails.
  - Analysis: `promptCommands.forEach()` called without `Array.isArray()` validation.

- [ ] **4.3 — Rapid slash commands in succession** `CONFIRMED`
  - Steps: Type `/clear` -> immediately type `/help`.
  - Risk: Global `window.command` state mutation. Second command may be missed because first command clears `window.command = ''`.
  - Analysis: `window.command = ''` at end of execute(). Second command can be missed if fired before first completes.

---

## 5. MCP Server Configuration (Options -> MCP Servers)

- [ ] **5.1 — Add MCP server with invalid URL** `CONFIRMED`
  - Steps: Options -> MCP Servers -> enter `not-a-url` -> connect.
  - Risk: No URL format validation before attempting connection. Connection attempt fails with generic error.
  - Analysis: `new URL(serverConfig.url)` will throw on invalid URLs. No pre-validation. Error caught in generic catch block only.

- [ ] **5.2 — One offline MCP server blocks all others on startup** `CONFIRMED`
  - Steps: Configure 3 MCP servers, one is offline -> reload extension.
  - Risk: If `Promise.all()` is used instead of `Promise.allSettled()`, one failure rejects the entire batch. All 3 servers fail to load even if 2 are fine.
  - Analysis: Uses `Promise.all`. However, `addNewServer` has its own try-catch, so in practice one failure won't crash the others. The risk is lower than described but `Promise.allSettled` would still be cleaner.

- [ ] **5.3 — Toggle MCP server on/off rapidly** `CONFIRMED`
  - Steps: Enable -> disable -> enable a server in quick succession.
  - Risk: Race condition in `addConfig` with `setState` callbacks. Clients and transports may become inconsistent.
  - Analysis: McpHub storage change listener has no debounce. Rapid toggles trigger concurrent `addNewServer`/`removeMCPServer` calls.

- [ ] **5.4 — Connect to MCP server requiring OAuth, token expires** `CONFIRMED`
  - Steps: Add server with OAuth -> use it until token expires mid-session.
  - Risk: OAuth token stored without refresh mechanism. Once expired, all tool calls to that server fail. No automatic re-auth flow.
  - Analysis: No OAuth token refresh logic found in McpHub. Expired tokens cause silent failures.

- [ ] **5.5 — Add MCP server with empty auth header value** `CONFIRMED`
  - Steps: Configure server with Authorization header but leave value empty.
  - Risk: Header validation only checks for exact "bearer" string match. Empty "Bearer " header sent to server. Server returns 401.
  - Analysis: Checks `header.value.trim().toLowerCase() === 'bearer'` (exact match). Correctly catches empty Bearer but only lowercase.

- [x] **5.6 — Add MCP server with extra whitespace in headers** `MITIGATED`
  - Steps: Set header `Authorization: "  Bearer  mytoken  "`.
  - Risk: Extra whitespace not trimmed. Invalid authorization header sent.
  - Analysis: Header names AND values ARE trimmed before use.

- [ ] **5.7 — MCP server returns tools with `outputSchema`** `NEEDS RUNTIME TEST`
  - Steps: Connect to MCP server whose tools have outputSchema.
  - Risk: StatelessHTTPClientTransport deletes `outputSchema` from tools. If `connectionMessage.result.tools` is not an array, `.map()` throws.

- [ ] **5.8 — MCP server takes >30 seconds to respond to tool call** `CONFIRMED`
  - Steps: Use a tool from a very slow MCP server.
  - Risk: Hardcoded 30-second timeout in RequestManager. Request times out but server keeps processing. If user retries, duplicate execution occurs.
  - Analysis: RequestManager has hardcoded `setTimeout(..., 30000)`. No idempotency/dedup mechanism.

- [ ] **5.9 — Remove MCP server config while tool is executing** `CONFIRMED`
  - Steps: Start a tool call -> go to options -> delete that MCP server.
  - Risk: `executeMCPTool()` checks connector but server reference may already be gone. Returns "connection lost" error mid-execution.
  - Analysis: No active execution guard. `removeMCPServer` runs immediately regardless of whether a tool call is in progress.

---

## 6. Custom WebMCP Tools (Options -> Web MCP Tools)

- [ ] **6.1 — Create tool with syntax error in JavaScript** `CONFIRMED`
  - Steps: Web MCP Tools -> write JS with syntax error -> save -> use tool.
  - Risk: Dynamic `import(url)` fails with generic error. No line numbers or syntax details shown to user.
  - Analysis: No try-catch around `import()` call. Syntax errors propagate as unhandled promise rejections.

- [ ] **6.2 — Create tool that doesn't export `metadata` or `execute`** `CONFIRMED`
  - Steps: Write valid JS that exports wrong shape -> use tool.
  - Risk: `module.metadata` and `module.execute` accessed without checking existence. Runtime error.
  - Analysis: `module.metadata` and `module.execute` used directly via spread operator. No check if exports are missing.

- [ ] **6.3 — Create tool with infinite loop in top-level code** `CONFIRMED`
  - Steps: Tool code: `while(true) {}` at module level.
  - Risk: `import(url)` has no timeout. Browser tab becomes unresponsive. No way to cancel.
  - Analysis: No execution timeout for tool code evaluation. Module-level infinite loops will freeze the tab indefinitely.

- [ ] **6.4 — Tool with invalid JSON schema (circular `$ref`)** `CONFIRMED`
  - Steps: Create tool with schema containing `$ref` cycles.
  - Risk: Schema-to-Zod conversion silently falls back to empty object `{}`. Tool gets wrong schema, causing validation errors downstream.
  - Analysis: `jsonSchemaToZod` has no `$ref` handling. Circular references cause stack overflow or produce incorrect schema.

- [ ] **6.5 — Two tools with the same name** `CONFIRMED`
  - Steps: Create tool "myTool" -> create another tool "myTool".
  - Risk: No name uniqueness validation. Second tool overwrites first in registration. Edited script cache uses tool name as key, causing conflicts.
  - Analysis: No duplicate name check in `saveUserTools`.

- [ ] **6.6 — Edit tool while it's being executed** `CONFIRMED`
  - Steps: Start tool execution -> quickly edit tool code -> save.
  - Risk: Race between storage update triggering re-registration and ongoing execution. Tool may be unregistered mid-execution.
  - Analysis: No concurrency guard. Saving a tool triggers immediate re-registration regardless of active execution state.

- [ ] **6.7 — Tool code that destroys the page DOM** `CONFIRMED`
  - Steps: Create tool that does `document.body.innerHTML = ''`.
  - Risk: Custom tool code runs in page context without sandbox isolation. Can destroy the entire page DOM.
  - Analysis: No sandbox isolation for user-defined tool code. Tool executes in page context with full DOM access.

- [ ] **6.8 — Delete tool that has breakpoints attached** `CONFIRMED`
  - Steps: Set breakpoint on tool -> delete tool.
  - Risk: Logic error in `saveUserTools`: comparison checks every tool against `editedTool?.name` instead of current iteration. Breakpoint removal notification may be wrong.
  - Analysis: In `saveUserTools` `.map()`, `userWebMCPTools.find(tool => tool.name === editedTool?.name)` uses the outer `editedTool?.name` for all iterations instead of the current iteration's tool name.

---

## 7. Built-in Chrome API Tools

- [ ] **7.1 — Toggle a built-in tool that doesn't exist in mcpbTools** `CONFIRMED`
  - Steps: Programmatically call `saveExtensionToolsState` with an unknown tool name.
  - Risk: `keyToChange[0]` is undefined. `newValue[undefined].enabled = value` causes runtime error.
  - Analysis: `newValue[keyToChange[0]].enabled = value` without checking if `keyToChange[0]` exists. Will throw if `.filter()` returns empty array.

- [x] **7.2 — Use DOM Extraction tool on page with strict CSP** `MITIGATED`
  - Steps: Navigate to page with CSP -> use DOM extraction tool.
  - Risk: `chrome.scripting.executeScript()` blocked by CSP. Error only logged. Tool fails silently.
  - Analysis: Uses `chrome.scripting.executeScript` (bypasses CSP for extension scripts). CSP headers are stripped for Blob URL imports. Error handling exists but is generic.

- [x] **7.3 — Use Tabs API tool after tab is closed** `MITIGATED`
  - Steps: Start tool that references a tab -> close that tab.
  - Risk: `chrome.tabs.sendMessage()` to closed tab fails. Error not gracefully handled.
  - Analysis: `chrome.runtime.lastError` IS checked after tab operations.

- [ ] **7.4 — Use History API without history permission granted** `NEEDS RUNTIME TEST`
  - Steps: Disable history permission -> try history tool.
  - Risk: Permission check may not reflect real-time permission state. Tool fails with unclear error.

---

## 8. Tool Domain Filtering

- [ ] **8.1 — Tool with domain filter on `javascript:` or `data:` URL pages** `CONFIRMED`
  - Steps: Open page with special protocol -> check tools.
  - Risk: `extractDomainFromUrl` returns "unknown" for invalid URLs. All tools blocked on special protocol pages instead of selectively allowing.
  - Analysis: `extractDomainFromUrl` catches `new URL()` errors and returns `'unknown'`.

- [ ] **8.2 — Tool name is substring of another tool name** `CONFIRMED`
  - Steps: Tools named "search" and "research" -> toggle "search".
  - Risk: `handleToolEnableDisableOnLocalStorageChange` uses `.includes()` (substring match) instead of exact match. Toggling "search" also affects "research".
  - Analysis: `toolName.includes(key)` and `toolName.includes(tool.name)` used throughout `handleToolEnableDisableOnLocalStorageChange.ts`.

- [ ] **8.3 — Domain pattern with catastrophic backtracking** `CONFIRMED`
  - Steps: Set domain filter `*.*.*.*.example.com`.
  - Risk: Dynamic regex constructed from user input without validation. Potential ReDoS. CPU spike during pattern matching.
  - Analysis: `isDomainAllowed` builds `new RegExp()` from user-supplied patterns without ReDoS protection.

- [ ] **8.4 — URL with query string vs domain pattern** `CONFIRMED`
  - Steps: Pattern: `https://example.com/path`, URL: `https://example.com/path?id=1`.
  - Risk: Pattern matching doesn't handle query strings. Filter fails even though it should match.
  - Analysis: Pattern matched against full URL (`urlObj.href`) which includes query strings. Pattern `example.com/path` won't match `example.com/path?id=1`.

---

## 9. Workflows

- [x] **9.1 — Tab gets closed mid-workflow execution** `MITIGATED`
  - Steps: Start workflow -> close the tab it's operating on.
  - Risk: Tab ID becomes invalid. All subsequent `chrome.tabs.sendMessage()` calls fail with `chrome.runtime.lastError`. No graceful recovery.
  - Analysis: Unit test confirms runtime method rejection propagates error and marks node as error. Error handled gracefully. See `engine/tests/potential-issues.test.ts`.

- [ ] **9.2 — Workflow requiring user activation without user interaction** `NEEDS RUNTIME TEST`
  - Steps: Workflow needs `navigator.userActivation.isActive` -> run programmatically.
  - Risk: Workaround creates a button, clicks it, and removes it -- but button may be removed before click handler fires.

- [ ] **9.3 — Run empty workflow (only Start + End nodes)** `CONFIRMED`
  - Steps: Create workflow with just start/end -> run.
  - Risk: Should complete but returns empty context. End executor returns empty string if input is null.
  - Analysis: `endExecutor` returns `(config.input as string) || ""`. Null/undefined input produces empty string.

- [ ] **9.4 — Workflow with circular variable references** `CONFIRMED`
  - Steps: Node A references `{{steps.A.data}}` (itself).
  - Risk: Variable resolution uses `string.replace()` with no cycle detection. May cause infinite substitution loop or garbage output.
  - Analysis: `resolveStringVariables` uses a single-pass `str.replace()`. Self-referencing variables won't infinite-loop but will be left unresolved. Risk is lower than described.

- [ ] **9.5 — Workflow with orphaned/disconnected nodes** `CONFIRMED`
  - Steps: Create workflow -> disconnect a middle node from the graph.
  - Risk: Parser silently skips orphaned nodes. Downstream nodes get wrong/missing data with no warning.
  - Analysis: Unit test confirms: orphaned nodes cause misleading "Workflow graph contains cycles" error in Kahn's algorithm (unreachable nodes aren't processed, count mismatch). See `engine/tests/potential-issues.test.ts`.

- [ ] **9.6 — Workflow with very large loop (10,000+ items)** `CONFIRMED`
  - Steps: Create loop node with 10K item array.
  - Risk: No iteration limit. Memory exhaustion possible. No progress indicator or ability to cancel mid-loop.
  - Analysis: `loopExecutor` iterates over entire input array with no upper bound. No `maxIterations` check.

- [ ] **9.7 — Run same workflow twice simultaneously** `CONFIRMED`
  - Steps: Click run -> click run again immediately.
  - Risk: Global state race condition in stateManager. Both executions try to modify same DOM elements. Second `initWorkflow()` overwrites first's state.
  - Analysis: Unit test confirms: concurrent `engine.execute()` calls corrupt shared `this.context` and `this.abortController`. Second call overwrites first's context. See `engine/tests/potential-issues.test.ts`.

- [ ] **9.8 — Nested loops** `CONFIRMED`
  - Steps: Create workflow with a loop inside a loop.
  - Risk: Inner loop's `delete context.loop` removes loop context. Outer loop's metadata (index, item) is lost.
  - Analysis: `loopExecutor.ts` line 48: `delete context.loop` in cleanup. Outer loop's index/total would be lost when inner loop completes.

- [ ] **9.9 — Division by zero in math node** `CONFIRMED`
  - Steps: Math node: `input / 0`.
  - Risk: Returns `Infinity`, not an error. Serialized as `null` in JSON. Next node fails with unexpected input.
  - Analysis: Unit test confirms: `mathExecutor` explicitly returns `Infinity` on division by zero. Infinity propagates through downstream math operations (e.g. `Infinity + 5 = Infinity`). See `executors/tests/potential-issues.test.ts`.

- [x] **9.10 — Stop a workflow mid-execution** `MITIGATED`
  - Steps: Click stop button while workflow is running.
  - Risk: `isStopping` flag may get stuck as `true` if `stopWorkflow()` completes instantly. Race condition between state updates.
  - Analysis: Unit test confirms: `engine.abort()` correctly throws "Workflow aborted" during execution, and `abort()` when idle is a no-op. See `engine/tests/potential-issues.test.ts`.

- [ ] **9.11 — Workflow node produces non-text output for End node** `CONFIRMED`
  - Steps: Loop produces an array -> feeds into End node.
  - Risk: End executor assumes input is always a string. Arrays become empty string. Workflow final output is empty.
  - Analysis: `endExecutor`: `(config.input as string) || ""`. Array input coerced → likely empty string.

- [ ] **9.12 — User navigates away during workflow selection UI** `NEEDS RUNTIME TEST`
  - Steps: Workflow shows selection overlay -> user navigates to new page.
  - Risk: Selection container stays on page. Event listeners not cleaned up. May cause errors on new page.

- [ ] **9.13 — Writer/Rewriter API with malformed response** `CONFIRMED`
  - Steps: Use Writer API node -> API returns unexpected `measureInputUsage` values.
  - Risk: Binary search for input truncation has no iteration limit. If `measureInputUsage` returns inconsistent values, loop becomes infinite.
  - Analysis: Unit test confirms: when `measureInputUsage` always exceeds quota, binary search truncates to empty string. `while (low <= high)` terminates but produces empty output silently. See `executors/tests/potential-issues.test.ts`.

- [ ] **9.14 — Context menu workflow on restricted page** `NEEDS RUNTIME TEST`
  - Steps: Right-click on `chrome://` page -> run workflow from context menu.
  - Risk: `isDomainAllowed()` may not handle `chrome://` URLs. Context menu creation silently fails.

- [ ] **9.15 — Proofreader API returns unexpected correction format** `CONFIRMED`
  - Steps: Use proofreader node -> API returns different correction structure.
  - Risk: `(correction as any).suggestions?.[0]` assumption. Malformed corrections produce corrupted text flowing to next node.
  - Analysis: Unit test confirms: undefined `startIndex` in corrections causes data loss; missing `suggestions` field silently produces `undefined` replacements that corrupt the output. See `executors/tests/potential-issues.test.ts`.

---

## 10. DevTools Panel

- [x] **10.1 — Open DevTools panel after extension reload** `MITIGATED`
  - Steps: Reload extension -> open DevTools -> go to extension panel.
  - Risk: `chrome.runtime?.id` becomes undefined. Panel shows "context invalidated" but recovery may fail silently.
  - Analysis: DevTools uses `useContextInvalidated` hook that checks `chrome.runtime?.id`. Context invalidation is detected.

- [x] **10.2 — Run tool with invalid JSON input** `MITIGATED`
  - Steps: DevTools -> Tools -> enter `{broken json}` -> run.
  - Risk: `JSON.parse(value)` without schema validation. Parse error caught but error message may be unclear.
  - Analysis: JSON.parse in DevTools panel has try-catch wrapping. Error is handled.

- [ ] **10.3 — Run tool that takes >30 seconds** `CONFIRMED`
  - Steps: DevTools -> run a slow tool.
  - Risk: Component stays locked in "running" state forever. No timeout or cancel button for stuck tools.
  - Analysis: No timeout or cancel mechanism in DevTools tool runner. Component stays in "running" state indefinitely.

- [ ] **10.4 — Boolean input with wrong casing** `CONFIRMED`
  - Steps: Type `"True"` or `"TRUE"` for boolean field.
  - Risk: `value === 'true'` only matches exact lowercase. Other casings treated as `false`.
  - Analysis: Found `value === 'true'` without `.toLowerCase()` in DevTools panel code.

- [ ] **10.5 — Rapidly open/close tool run panels** `NEEDS RUNTIME TEST`
  - Steps: Open -> close -> open -> close quickly.
  - Risk: Timeout cleanup bug. `timeoutRef.current` cleared on unmount, then timeout callback tries to call stale `onClose()`.
  - Analysis: Timeout cleanup exists (`clearTimeout` on ref). Race condition between unmount and callback needs runtime verification.

- [ ] **10.6 — Event logs grow very large** `CONFIRMED`
  - Steps: Execute many tools in a long session.
  - Risk: `chrome.storage.session.set()` has no quota handling. When session storage fills up, log writes fail silently. Older logs lost.
  - Analysis: No log rotation or size cap. Event logs grow unbounded until session storage quota is hit.

- [ ] **10.7 — Edit tool script in DevTools, service worker is dead** `CONFIRMED`
  - Steps: DevTools -> Tools -> edit a tool's code -> save (after idle period).
  - Risk: `chrome.runtime.sendMessage()` sent without error handling. If service worker is dead, save fails silently.
  - Analysis: No error handling on `chrome.runtime.sendMessage` for tool script updates in DevTools panel.

---

## 11. Settings & Data Management

- [ ] **11.1 — Import settings file with corrupted JSON** `CONFIRMED`
  - Steps: Options -> Settings -> Import -> select file with invalid JSON.
  - Risk: `settingsValidator.ts` does `JSON.parse()` on `userWebMCPTools` and `mcpConfigs` without try-catch. Entire import crashes.
  - Analysis: `settingsValidator.ts` lines 42-43: `JSON.parse(config.userWebMCPTools)` and `JSON.parse(config.mcpConfigs)` without try-catch.

- [ ] **11.2 — Import settings from different extension version** `CONFIRMED`
  - Steps: Export from v1 -> update to v2 -> import v1 settings.
  - Risk: Settings validator only checks key existence, not structure. Missing fields from newer version pass validation but cause runtime errors.
  - Analysis: Unit test confirms: settings from older version with missing keys are rejected, but malformed JSON in `userWebMCPTools`/`mcpConfigs` crashes without try-catch. See `utils/tests/potential-issues.test.ts`.

- [ ] **11.3 — Import settings with empty `apiKeys: {}`** `CONFIRMED`
  - Steps: Import file where `apiKeys` is `{}`.
  - Risk: Empty object is truthy, passes `!config.apiKeys` check. Later code expects specific provider keys inside and may crash.
  - Analysis: Validator uses `!config.apiKeys` which is `false` for `{}`. Empty object passes validation.

- [ ] **11.4 — Click "Clear All Data" during active chat** `CONFIRMED`
  - Steps: Have active streaming chat -> Settings -> Clear All Data.
  - Risk: `clearSettings()` clears storage while transport is streaming. Next operation fails.
  - Analysis: No abort mechanism for active streams before clearing storage. Active chat will lose its transport context.

- [ ] **11.5 — Export settings with very large workflow data** `NEEDS RUNTIME TEST`
  - Steps: Have many large workflows -> export.
  - Risk: No size limit on exported data. Import of large file may exceed storage quota.

- [ ] **11.6 — Change theme while side panel is open** `NEEDS RUNTIME TEST`
  - Steps: Side panel open -> Options -> change theme.
  - Risk: Theme change propagates via storage listener. Multiple listener fires may cause theme flickering.

---

## 12. Tab & Navigation Edge Cases

- [ ] **12.1 — Navigate page while tool is executing** `CONFIRMED`
  - Steps: AI calls a DOM tool -> navigate to different page mid-execution.
  - Risk: Port disconnects. `RequestManager` promise hangs for 30 seconds then times out. Tool result lost.
  - Analysis: No error boundary for port disconnection. Navigation destroys the content script port; pending requests timeout after 30s.

- [ ] **12.2 — Open side panel, then open same page in new tab** `NEEDS RUNTIME TEST`
  - Steps: Side panel on Tab 1 -> Ctrl+T -> same URL.
  - Risk: Side panel may show Tab 1's thread on Tab 2 due to tab ID parsing from URL hash. `parseInt(hash.substring(5))` can return NaN if hash format is unexpected.

- [x] **12.3 — Close all tabs** `MITIGATED`
  - Steps: Close every tab while extension is running.
  - Risk: Tab close callback runs for each tab. Concurrent storage writes for tab cleanup race with each other. Some tab IDs may not be cleaned up.
  - Analysis: Tab close handler uses `PromiseQueue` to serialize writes. Race condition is mitigated.

- [ ] **12.4 — Use extension in Incognito mode** `NEEDS RUNTIME TEST`
  - Steps: Enable extension for incognito -> open side panel.
  - Risk: `chrome.storage.sync` may not sync. Settings may not persist across incognito sessions.

- [ ] **12.5 — Extension service worker goes to sleep (idle >5 min)** `CONFIRMED`
  - Steps: Leave extension idle for >5 minutes -> try to use it.
  - Risk: Chrome MV3 kills idle service workers. All in-memory state (McpHub, ports, registered tools) is lost. Reconnection retries every 1 second with no max retry limit.
  - Analysis: `registerTools.ts`: `setTimeout(register, ...)` retries indefinitely with no max retry count or exponential backoff.

- [ ] **12.6 — Open 50+ tabs with extension active** `CONFIRMED`
  - Steps: Open many tabs, each injecting content script.
  - Risk: Each tab creates ports to service worker. McpHub maintains tool registrations for all tabs. Memory grows unbounded. No cleanup for inactive tabs.
  - Analysis: No mechanism to limit or clean up tool registrations for inactive tabs. Memory grows with each open tab.

---

## 13. Content Script & Page Interaction

- [ ] **13.1 — Page with strict CSP blocks polyfill injection** `CONFIRMED`
  - Steps: Visit page with `script-src 'self'` CSP -> open side panel.
  - Risk: WebMCP polyfill injection fails. `registerTools.ts` retries indefinitely (no max retry, no backoff). Degrades page performance.
  - Analysis: 2 retry points via `setTimeout(register, ...)` with no retry cap. Will poll indefinitely.

- [ ] **13.2 — Page overrides `navigator.modelContext`** `CONFIRMED`
  - Steps: Visit page that defines its own `navigator.modelContext`.
  - Risk: Conflict between page's implementation and extension's polyfill. Tools may register on wrong context.
  - Analysis: No guard against pre-existing `navigator.modelContext`. Extension polyfill overwrites without checking.

- [ ] **13.3 — iframe-heavy page (e.g., Google Docs)** `CONFIRMED`
  - Steps: Open Google Docs -> try DOM extraction tools.
  - Risk: Content script only injected into top frame. Cross-origin iframes are inaccessible. DOM extraction returns incomplete data with no warning.
  - Analysis: Manifest uses `all_frames: false` (default). Content script only runs in top frame. No cross-origin iframe handling.

- [ ] **13.4 — SPA navigation (React Router, etc.)** `CONFIRMED`
  - Steps: On SPA -> navigate via client-side routing -> use tools.
  - Risk: `webNavigation.onCommitted` may not fire for SPA navigations. Tab data becomes stale. Tools may reference old DOM state.
  - Analysis: No `popstate`/`pushState` listener. Only `webNavigation.onCommitted` is used, which doesn't fire for client-side SPA navigation.

- [ ] **13.5 — Page content set via innerHTML contains scripts (XSS)** `CONFIRMED`
  - Steps: Workflow replaces DOM content with user-provided HTML containing `<script>` tags.
  - Risk: `innerHTML` set without sanitization. XSS vulnerability if workflow result contains executable code.
  - Analysis: DOM replacement executor sets `innerHTML` without sanitization. No DOMPurify or equivalent used.

---

## 14. Prompt Commands (Options -> Prompt Commands)

- [ ] **14.1 — Create command with same name as built-in command** `CONFIRMED`
  - Steps: Create custom command `/help` or `/clear`.
  - Risk: No uniqueness check against built-in commands. Custom command may shadow built-in. Behavior undefined.
  - Analysis: CommandProvider merges user + built-in commands without checking for name collisions.

- [ ] **14.2 — Delete all custom commands** `CONFIRMED`
  - Steps: Delete every custom prompt command.
  - Risk: `promptCommands` becomes empty array or undefined in storage. Next `/` command lookup may fail if empty array not handled.
  - Analysis: No empty array guard. `promptCommands.forEach` called without `Array.isArray` check (same as 4.2).

- [x] **14.3 — Command with very long prompt template** `MITIGATED`
  - Steps: Create command with 100K char prompt.
  - Risk: No length validation. When combined with user message, may exceed model's context window.
  - Analysis: No prompt template length validation, but models handle their own context limits. The prompt passes through to the model which will truncate/error naturally.

---

## 15. Miscellaneous Edge Cases

- [x] **15.1 — Browser AI flags disabled in Chrome** `MITIGATED`
  - Steps: Disable `chrome://flags/#prompt-api-for-gemini-nano` -> try Browser AI.
  - Risk: `LanguageModel` global is undefined. `ReferenceError` crashes entire Gemini Nano transport.
  - Analysis: GeminiNano checks `LanguageModel` existence and `availability()` status. Throws descriptive error if unavailable.

- [ ] **15.2 — Chrome auto-updates while extension is active** `NEEDS RUNTIME TEST`
  - Steps: Chrome auto-updates while extension is running.
  - Risk: Service worker restarts. All in-memory state (McpHub, port connections, registered tools) is lost. No migration or recovery logic.

- [ ] **15.3 — AI model response text contains `` ```tool_call `` fence marker** `CONFIRMED`
  - Steps: Model generates text that happens to include the tool call fence marker.
  - Risk: Tool call parser misdetects regular text as a tool call boundary. Broken formatting or incorrect tool execution.
  - Analysis: Uses `fenceScanner` to detect `` ```tool_call `` fences in streaming text. If model generates this exact marker in normal text, it will be misinterpreted.

- [x] **15.4 — Two tool calls in same millisecond (Browser AI)** `MITIGATED`
  - Steps: Gemini Nano makes 2 tool calls very quickly.
  - Risk: Tool call ID uses `Date.now()` (1ms resolution). If collision occurs, second tool overwrites first in event map.
  - Analysis: Tool call ID is `call_${Date.now()}_${Math.random().toString(36).slice(2,9)}`. Random suffix mitigates collision risk.

- [ ] **15.5 — Regex pattern in Data Transformer causes ReDoS** `CONFIRMED`
  - Steps: Workflow data transformer with regex `(a+)+b` on long input.
  - Risk: User-provided regex compiled without validation. Catastrophic backtracking freezes workflow.
  - Analysis: Unit test confirms: user-supplied regex patterns go directly into `new RegExp()` without validation. Catastrophic backtracking patterns cause measurable delay. See `executors/tests/potential-issues.test.ts`.

- [ ] **15.6 — Object with circular reference passed through workflow** `CONFIRMED`
  - Steps: Workflow produces object with circular references.
  - Risk: `String(input)` or `Array.join()` on circular structure causes stack overflow.
  - Analysis: Unit test confirms: `resolveValue` recursively walks objects without cycle detection. Circular reference causes `RangeError` (max call stack). See `engine/tests/potential-issues.test.ts`.

---

## Summary

| Category | Confirmed | Mitigated | Needs Runtime Test | Total |
|---|---|---|---|---|
| 1. Installation & Setup | 4 | 0 | 0 | 4 |
| 2. API Key Configuration | 5 | 0 | 1 | 6 |
| 3. Chat (Side Panel) | 9 | 2 | 1 | 12 |
| 4. Slash Commands | 3 | 0 | 0 | 3 |
| 5. MCP Servers | 6 | 1 | 2 | 9 |
| 6. WebMCP Tools | 7 | 0 | 1 | 8 |
| 7. Chrome API Tools | 1 | 2 | 1 | 4 |
| 8. Domain Filtering | 4 | 0 | 0 | 4 |
| 9. Workflows | 11 | 2 | 2 | 15 |
| 10. DevTools | 3 | 2 | 2 | 7 |
| 11. Settings | 4 | 0 | 2 | 6 |
| 12. Tab & Navigation | 3 | 1 | 2 | 6 |
| 13. Content Script | 5 | 0 | 0 | 5 |
| 14. Prompt Commands | 2 | 1 | 0 | 3 |
| 15. Miscellaneous | 3 | 2 | 1 | 6 |
| **Total** | **70** | **13** | **15** | **98** |

### Verification Methods
- **Static analysis:** `node bin/check-potential-issues.mjs` (73 confirmed, 14 mitigated, 11 inconclusive)
- **Unit tests (engine-core):** `executors/tests/potential-issues.test.ts` (12 tests), `engine/tests/potential-issues.test.ts` (7 tests)
- **Unit tests (extension):** `utils/tests/potential-issues.test.ts` (6 tests), `serviceWorker/utils/tests/potential-issues-domainMatcher.test.ts` (4 tests)
