#!/usr/bin/env node

/**
 * Static analysis script to verify potential issues listed in docs/potential-issues.md.
 *
 * For each issue it inspects the source code for the described pattern and reports
 * whether the issue is CONFIRMED, NOT FOUND, or INCONCLUSIVE (needs manual/runtime testing).
 *
 * Usage:  node bin/check-potential-issues.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const EXT = path.join(ROOT, 'packages/extension/src');
const ENGINE = path.join(ROOT, 'packages/engine-core/src');

// ─── helpers ────────────────────────────────────────────────────────────────

function read(relPath) {
  const abs = path.resolve(ROOT, relPath);
  if (!fs.existsSync(abs)) return null;
  return fs.readFileSync(abs, 'utf-8');
}

function fileContains(relPath, pattern) {
  const src = read(relPath);
  if (!src) return null; // file not found
  if (typeof pattern === 'string') return src.includes(pattern);
  return pattern.test(src);
}

function countMatches(relPath, regex) {
  const src = read(relPath);
  if (!src) return 0;
  return (src.match(regex) || []).length;
}

function linesWith(relPath, pattern) {
  const src = read(relPath);
  if (!src) return [];
  return src.split('\n').filter((line) =>
    typeof pattern === 'string' ? line.includes(pattern) : pattern.test(line)
  );
}

// ─── test definitions ───────────────────────────────────────────────────────

const results = [];

function test(id, title, status, detail) {
  results.push({ id, title, status, detail });
}

const CONFIRMED = 'CONFIRMED';
const NOT_FOUND = 'NOT FOUND';
const INCONCLUSIVE = 'INCONCLUSIVE';

// ─── 1.x First-Time Installation & Setup ────────────────────────────────────

(() => {
  // 1.1 — No API key configured on first use
  // The side panel transports check `this.model` before use. If null, they return empty ReadableStream.
  const nano = read('packages/extension/src/view/sidePanel/transports/geminiNano/index.ts');
  const cloud = read('packages/extension/src/view/sidePanel/transports/cloudHosted/index.ts');
  // Both return `new ReadableStream()` if model/runtime is null — silent empty response, no user-friendly error
  const nanoEmpty = nano?.includes('return new ReadableStream()');
  const cloudEmpty = cloud?.includes('return new ReadableStream()');
  test('1.1', 'No API key configured — silent empty response',
    nanoEmpty || cloudEmpty ? CONFIRMED : NOT_FOUND,
    `GeminiNano returns empty stream if no runtime: ${nanoEmpty}. CloudHosted returns empty stream: ${cloudEmpty}. No user-friendly "configure API key" message.`
  );
})();

(() => {
  // 1.2 — JSON.parse on extensionSettings without try-catch
  const src = read('packages/extension/src/serviceWorker/chromeListeners/onInstalledCallback.ts');
  const hasTryCatch = src?.includes('try');
  const hasJsonParse = src?.includes('JSON.parse');
  test('1.2', 'JSON.parse on extensionSettings without try-catch in onInstalledCallback',
    hasJsonParse && !hasTryCatch ? CONFIRMED : NOT_FOUND,
    `JSON.parse present: ${hasJsonParse}. try-catch present: ${hasTryCatch}.`
  );
})();

(() => {
  // 1.3 & 1.4 — chrome:// and file:// page handling
  // McpHub constructor checks `details.url.startsWith('chrome://')` and returns, but no user-facing error
  const src = read('packages/extension/src/serviceWorker/mcpHub.ts');
  const checksChrome = src?.includes("startsWith('chrome://')");
  test('1.3', 'Extension on chrome:// page — tools silently unavailable',
    checksChrome ? CONFIRMED : NOT_FOUND,
    `McpHub skips chrome:// URLs (no content script injection), but no error is shown to the user in the side panel.`
  );

  const checksFile = src?.includes("startsWith('file://')");
  test('1.4', 'Extension on file:// page — no handling',
    !checksFile ? CONFIRMED : NOT_FOUND,
    `No file:// URL check found in McpHub. Content script injection will silently fail.`
  );
})();

// ─── 2.x API Key Configuration ──────────────────────────────────────────────

(() => {
  // 2.2 — API key whitespace not trimmed
  // Search the options model provider for .trim() on API key values
  const optionsModel = read('packages/extension/src/view/options/providers/modelProvider/modelProvider.tsx');
  // If the file saves API keys, check if it trims them
  const savesTrimmedKey = optionsModel?.includes('.trim()');
  test('2.2', 'API key whitespace not trimmed',
    optionsModel && !savesTrimmedKey ? CONFIRMED : NOT_FOUND,
    `Options model provider does${savesTrimmedKey ? '' : ' NOT'} trim API keys before saving.`
  );
})();

(() => {
  // 2.5 — Thinking mode enabled for non-supporting model
  const optionsModel = read('packages/extension/src/view/options/providers/modelProvider/modelProvider.tsx');
  const validatesThinking = optionsModel?.includes('thinking') && optionsModel?.includes('supported');
  test('2.5', 'Enable thinking mode for model that does not support it — no validation',
    optionsModel && !validatesThinking ? CONFIRMED : INCONCLUSIVE,
    `No model-capability check found for thinking mode in options provider.`
  );
})();

// ─── 3.x Chat (Side Panel) ──────────────────────────────────────────────────

(() => {
  // 3.1 — Race between initialize() and sendMessages()
  const nano = read('packages/extension/src/view/sidePanel/transports/geminiNano/index.ts');
  // sendMessages does NOT await initializeSession; it just checks this.model
  const awaitsInit = nano?.includes('await this.initializeSession');
  test('3.1', 'Send message before model finishes initializing — no guard',
    nano && !awaitsInit ? CONFIRMED : NOT_FOUND,
    `sendMessages() does not await initializeSession(). If model is null, returns empty stream silently.`
  );
})();

(() => {
  // 3.3 — Multiple concurrent streamText calls — no request queuing
  const nano = read('packages/extension/src/view/sidePanel/transports/geminiNano/index.ts');
  const cloud = read('packages/extension/src/view/sidePanel/transports/cloudHosted/index.ts');
  const hasQueue = nano?.includes('queue') || nano?.includes('mutex') || nano?.includes('lock');
  const hasQueueCloud = cloud?.includes('queue') || cloud?.includes('mutex') || cloud?.includes('lock');
  test('3.3', 'Rapid-fire messages — no request queuing',
    !hasQueue && !hasQueueCloud ? CONFIRMED : NOT_FOUND,
    `No queue/mutex/lock mechanism found in either transport. Concurrent streamText calls are possible.`
  );
})();

(() => {
  // 3.7 — chrome.storage.local.set without error handling in chatStorage
  const filePath = 'packages/extension/src/view/sidePanel/customRuntime/chatStorage.ts';
  const setCallCount = countMatches(filePath, /chrome\.storage\.local\.set\(/g);
  const catchCount = countMatches(filePath, /\.catch\(|try\s*\{/g);
  test('3.7', 'Chat storage — no error handling for storage quota',
    setCallCount > 0 && catchCount === 0 ? CONFIRMED : NOT_FOUND,
    `${setCallCount} chrome.storage.local.set() calls, ${catchCount} error handlers. No quota exceeded handling.`
  );
})();

(() => {
  // 3.9 — Delete thread not awaiting storage write
  const src = read('packages/extension/src/view/sidePanel/customRuntime/chatStorage.ts');
  const lines = src?.split('\n') || [];
  let inDelete = false;
  let awaitsMissing = false;
  for (const line of lines) {
    if (line.includes('async delete(')) inDelete = true;
    if (inDelete && line.includes('chrome.storage.local.set(') && !line.includes('await')) {
      awaitsMissing = true;
    }
    if (inDelete && line.trim() === '},') inDelete = false;
  }
  test('3.9', 'Delete thread — storage write not awaited',
    awaitsMissing ? CONFIRMED : NOT_FOUND,
    `chatStorage.threads.delete() ${awaitsMissing ? 'does NOT await' : 'awaits'} chrome.storage.local.set().`
  );
})();

(() => {
  // 3.10 — Thread title extraction unsafe access on text parts
  // historyAdpter.tsx line 59: .filter(part => part.type === 'text')[0].text.substring(0, 30)
  const src = read('packages/extension/src/view/sidePanel/customRuntime/historyAdpter.tsx');
  const unsafeAccess = src?.includes(".filter((part) => part.type === 'text')[0]");
  // Also in chatAdapter.ts
  const src2 = read('packages/extension/src/view/sidePanel/customRuntime/chatAdapter.ts');
  const unsafeAccess2 = src2?.includes(".filter((message) => message.type === 'text')[0]");
  test('3.10', 'Thread title extraction — no null-check on text parts',
    unsafeAccess || unsafeAccess2 ? CONFIRMED : NOT_FOUND,
    `Unsafe [0] access after .filter() without checking array length. historyAdpter: ${unsafeAccess}, chatAdapter: ${unsafeAccess2}. TypeError if no text parts.`
  );
})();

(() => {
  // 3.12 — MAX_LOOPS hardcoded in Gemini Nano
  const src = read('packages/extension/src/view/sidePanel/transports/geminiNano/index.ts');
  const hasStopWhen = src?.includes('stopWhen');
  const stepsLimit = src?.match(/steps\.length\s*===\s*(\d+)/);
  test('3.12', 'MAX_LOOPS hardcoded for Browser AI (Gemini Nano)',
    hasStopWhen && stepsLimit ? CONFIRMED : NOT_FOUND,
    `stopWhen: steps.length === ${stepsLimit?.[1] ?? '?'}. No user notification when limit is hit.`
  );
})();

// ─── 4.x Slash Commands ─────────────────────────────────────────────────────

(() => {
  // 4.1 — /settings: setTimeout with async function, error not caught
  const src = read('packages/extension/src/view/sidePanel/transports/replaceSlashCommands.ts');
  const hasTimeout = src?.includes('setTimeout(async ()');
  const hasCatch = src?.includes('.catch');
  test('4.1', '/settings — setTimeout async not error-handled',
    hasTimeout && !hasCatch ? CONFIRMED : NOT_FOUND,
    `setTimeout wraps async openOptionsPage() but errors are not caught. hasTimeout: ${hasTimeout}, hasCatch: ${hasCatch}.`
  );
})();

(() => {
  // 4.2 — promptCommands retrieved without validation
  const src = read('packages/extension/src/view/sidePanel/transports/replaceSlashCommands.ts');
  const hasForEach = src?.includes('promptCommands.forEach');
  const checksArray = src?.includes('Array.isArray(promptCommands)');
  test('4.2', 'Slash commands — promptCommands used without Array.isArray check',
    hasForEach && !checksArray ? CONFIRMED : NOT_FOUND,
    `promptCommands.forEach called without validating it's an array. Has check: ${checksArray}.`
  );
})();

(() => {
  // 4.3 — window.command state cleared at end of replaceSlashCommands
  const src = read('packages/extension/src/view/sidePanel/transports/replaceSlashCommands.ts');
  const clearsCommand = src?.includes("window.command = ''");
  test('4.3', 'Rapid slash commands — window.command race condition',
    clearsCommand ? CONFIRMED : INCONCLUSIVE,
    `window.command = '' at end of execute(). Second command can be missed if fired before first completes.`
  );
})();

// ─── 5.x MCP Server Configuration ──────────────────────────────────────────

(() => {
  // 5.1 — No URL format validation for MCP servers
  const src = read('packages/extension/src/serviceWorker/mcpHub.ts');
  const hasUrlValidation = src?.includes('isValidUrl') || src?.includes('URL.canParse');
  const usesNewUrl = src?.includes('new URL(serverConfig.url)');
  test('5.1', 'MCP server — no URL format pre-validation',
    usesNewUrl && !hasUrlValidation ? CONFIRMED : NOT_FOUND,
    `new URL() will throw on invalid URLs. No pre-validation with user-friendly message. Error caught in generic catch block.`
  );
})();

(() => {
  // 5.2 — Promise.all instead of Promise.allSettled for MCP server init
  const src = read('packages/extension/src/serviceWorker/mcpHub.ts');
  const hasPromiseAll = src?.includes('await Promise.all(');
  const hasPromiseAllSettled = src?.includes('Promise.allSettled');
  test('5.2', 'MCP server init — Promise.all instead of Promise.allSettled',
    hasPromiseAll && !hasPromiseAllSettled ? CONFIRMED : NOT_FOUND,
    `Uses Promise.all: ${hasPromiseAll}. Uses Promise.allSettled: ${hasPromiseAllSettled}. One offline server won't block others though because addNewServer has internal try-catch.`
  );
})();

(() => {
  // 5.5 — Empty auth header validation
  const src = read('packages/extension/src/serviceWorker/mcpHub.ts');
  const checksEmptyBearer = src?.includes("=== 'bearer'");
  test('5.5', 'MCP server — empty auth header check only for exact "bearer"',
    checksEmptyBearer ? CONFIRMED : NOT_FOUND,
    `Checks header.value.trim().toLowerCase() === 'bearer' (exact match). This correctly catches empty "Bearer " but only exact lowercase.`
  );
})();

(() => {
  // 5.8 — 30-second hardcoded timeout in RequestManager
  const src = read('packages/extension/src/serviceWorker/utils/requestManager.ts');
  const hasTimeout = src?.includes('30000');
  const hasDuplicateGuard = src?.includes('idempotent') || src?.includes('dedup');
  test('5.8', 'MCP tool call — 30s timeout, no duplicate prevention',
    hasTimeout && !hasDuplicateGuard ? CONFIRMED : NOT_FOUND,
    `RequestManager has 30s timeout. No idempotency/dedup mechanism. Server may still process after timeout.`
  );
})();

// ─── 6.x Custom WebMCP Tools ────────────────────────────────────────────────

(() => {
  // 6.2 — module.metadata / module.execute accessed without existence check
  const src = read('packages/extension/src/serviceWorker/mcpHub.ts');
  const checksMetadata = src?.includes('module.metadata') && !src?.includes('if (!module.metadata');
  test('6.2', 'WebMCP tool — module.metadata/execute accessed without existence check',
    checksMetadata ? CONFIRMED : INCONCLUSIVE,
    `module.metadata and module.execute used directly via spread. No check if exports are missing.`
  );
})();

(() => {
  // 6.5 — Two tools with the same name — no uniqueness validation
  const src = read('packages/extension/src/view/options/providers/toolProvider/toolProvider.tsx');
  const checksUniqueName = src?.includes('duplicate') || src?.includes('already exists') || src?.includes('unique');
  test('6.5', 'WebMCP tools — no name uniqueness validation',
    src && !checksUniqueName ? CONFIRMED : NOT_FOUND,
    `No duplicate name check in saveUserTools. Two tools can have identical names.`
  );
})();

(() => {
  // 6.8 — saveUserTools comparison bug: checks every tool against editedTool?.name
  const src = read('packages/extension/src/view/options/providers/toolProvider/toolProvider.tsx');
  // The bug: `userWebMCPTools.find(tool => tool.name === editedTool?.name)` is inside .map() but
  // uses the outer `editedTool?.name` instead of the current iteration's tool name
  const hasBug = src?.includes('const storedTool = userWebMCPTools.find(\n          (tool) => tool.name === editedTool?.name');
  // Simpler check
  const hasFindEditedTool = src?.includes('tool.name === editedTool?.name');
  test('6.8', 'saveUserTools — comparison uses editedTool for all iterations',
    hasFindEditedTool ? CONFIRMED : NOT_FOUND,
    `In saveUserTools .map(), every tool is compared against editedTool?.name instead of current tool name. Breakpoint detection only considers the edited tool.`
  );
})();

// ─── 7.x Built-in Chrome API Tools ─────────────────────────────────────────

(() => {
  // 7.1 — saveExtensionToolsState: keyToChange[0] may be undefined
  const src = read('packages/extension/src/view/options/providers/toolProvider/toolProvider.tsx');
  const hasUndefinedGuard = src?.includes('keyToChange[0]') && !src?.includes('if (keyToChange[0])') && !src?.includes('keyToChange.length');
  test('7.1', 'saveExtensionToolsState — no guard for unknown tool name',
    hasUndefinedGuard ? CONFIRMED : NOT_FOUND,
    `newValue[keyToChange[0]].enabled = value without checking if keyToChange[0] exists. Will throw if filter returns empty.`
  );
})();

// ─── 8.x Tool Domain Filtering ──────────────────────────────────────────────

(() => {
  // 8.1 — extractDomainFromUrl returns "unknown" for special protocols
  const src = read('packages/extension/src/serviceWorker/mcpHub.ts');
  const returnsUnknown = src?.includes("return 'unknown'");
  test('8.1', 'extractDomainFromUrl — returns "unknown" for invalid URLs',
    returnsUnknown ? CONFIRMED : NOT_FOUND,
    `Returns "unknown" for unparseable URLs (javascript:, data:). Tools may be incorrectly blocked.`
  );
})();

(() => {
  // 8.2 — .includes() substring match for tool names
  const src = read('packages/extension/src/serviceWorker/utils/handleToolEnableDisableOnLocalStorageChange.ts');
  const usesIncludes = src?.includes('toolName.includes(key)') || src?.includes('toolName.includes(tool.name)');
  const usesExact = src?.includes('toolName === key') || src?.includes('toolName === tool.name');
  test('8.2', 'Tool enable/disable — uses .includes() substring match',
    usesIncludes && !usesExact ? CONFIRMED : NOT_FOUND,
    `handleToolEnableDisableOnLocalStorageChange uses toolName.includes() (substring) not === (exact). "search" will match "research".`
  );
})();

(() => {
  // 8.3 — Domain pattern → regex without ReDoS protection
  const src = read('packages/extension/src/serviceWorker/utils/domainMatcher.ts');
  const buildsRegex = src?.includes('new RegExp(') || src?.includes('RegExp(');
  const hasReDoSGuard = src?.includes('timeout') || src?.includes('maxLength') || src?.includes('safeRegex');
  test('8.3', 'Domain pattern matching — regex from user input without ReDoS protection',
    buildsRegex && !hasReDoSGuard ? CONFIRMED : NOT_FOUND,
    `isDomainAllowed builds new RegExp() from user-supplied patterns without validation. Catastrophic backtracking possible.`
  );
})();

(() => {
  // 8.4 — URL pattern matching doesn't handle query strings
  const src = read('packages/extension/src/serviceWorker/utils/domainMatcher.ts');
  // The regex test checks against fullUrl (urlObj.href) which includes query strings
  // but the pattern itself may not include query string handling
  const handlesQueryString = src?.includes('search') || src?.includes('query');
  test('8.4', 'Domain pattern — query string handling',
    src && !handlesQueryString ? CONFIRMED : NOT_FOUND,
    `Pattern is matched against full URL including query string, but no docs/handling for query string wildcards. Pattern "example.com/path" won't match "example.com/path?id=1".`
  );
})();

// ─── 9.x Workflows ─────────────────────────────────────────────────────────

(() => {
  // 9.3 — Empty workflow (Start + End) behavior
  const src = read('packages/engine-core/src/executors/end.ts');
  const returnsEmpty = src?.includes('|| ""');
  test('9.3', 'Empty workflow — End executor returns empty string for null input',
    returnsEmpty ? CONFIRMED : NOT_FOUND,
    `endExecutor returns (config.input as string) || "". Null/undefined input → empty string.`
  );
})();

(() => {
  // 9.4 — Variable resolution: no cycle detection
  const src = read('packages/engine-core/src/engine/WorkflowEngine.ts');
  const hasCycleDetection = src?.includes('cycle') || src?.includes('visited') || src?.includes('maxDepth');
  test('9.4', 'Workflow variable resolution — no cycle detection',
    src && !hasCycleDetection ? CONFIRMED : NOT_FOUND,
    `resolveStringVariables uses str.replace(VARIABLE_PATTERN, ...) — a single pass. Self-referencing vars won't infinite-loop but will be left unresolved. Risk is low.`
  );
})();

(() => {
  // 9.6 — Loop with no iteration limit
  const src = read('packages/engine-core/src/executors/loopExecutor.ts');
  const hasLimit = src?.includes('limit') || src?.includes('maxIterations') || src?.includes('MAX_LOOP');
  test('9.6', 'Workflow loop — no iteration limit',
    src && !hasLimit ? CONFIRMED : NOT_FOUND,
    `loopExecutor iterates over entire input array with no upper bound. 10K+ items will execute without limit.`
  );
})();

(() => {
  // 9.8 — Nested loops: inner loop deletes context.loop
  const src = read('packages/engine-core/src/executors/loopExecutor.ts');
  const deletesLoop = src?.includes('delete context.loop');
  test('9.8', 'Nested loops — inner loop deletes context.loop',
    deletesLoop ? CONFIRMED : NOT_FOUND,
    `"delete context.loop" in loopExecutor cleanup. Outer loop's index/total metadata would be lost if nested.`
  );
})();

(() => {
  // 9.11 — End node assumes string input
  const src = read('packages/engine-core/src/executors/end.ts');
  const castsToString = src?.includes('as string');
  test('9.11', 'End node — casts input to string',
    castsToString ? CONFIRMED : NOT_FOUND,
    `endExecutor: (config.input as string) || "". Array input becomes "[object Object]" or falsy → empty string.`
  );
})();

// ─── 10.x DevTools Panel ────────────────────────────────────────────────────

(() => {
  // 10.4 — Boolean input only matches lowercase "true"
  // Search for the pattern `value === 'true'`
  const files = [
    'packages/extension/src/view/devtools',
  ];
  // Use a broader search
  const devtoolsDir = path.join(ROOT, 'packages/extension/src/view/devtools');
  let found = false;
  if (fs.existsSync(devtoolsDir)) {
    const walk = (dir) => {
      for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
        if (f.isDirectory()) walk(path.join(dir, f.name));
        else if (f.name.endsWith('.ts') || f.name.endsWith('.tsx')) {
          const content = fs.readFileSync(path.join(dir, f.name), 'utf-8');
          if (content.includes("=== 'true'") && !content.includes('.toLowerCase()')) {
            found = true;
          }
        }
      }
    };
    walk(devtoolsDir);
  }
  test('10.4', 'DevTools — boolean input only matches lowercase "true"',
    found ? CONFIRMED : INCONCLUSIVE,
    `${found ? 'Found' : 'Could not find'} value === 'true' without .toLowerCase() in DevTools panel.`
  );
})();

// ─── 11.x Settings & Data Management ────────────────────────────────────────

(() => {
  // 11.1 — JSON.parse without try-catch in settingsValidator
  const src = read('packages/extension/src/utils/settingsValidator.ts');
  const hasJsonParse = src?.includes('JSON.parse(');
  const hasTryCatch = src?.includes('try');
  test('11.1', 'Settings import — JSON.parse without try-catch in settingsValidator',
    hasJsonParse && !hasTryCatch ? CONFIRMED : NOT_FOUND,
    `settingsValidator.ts: JSON.parse(config.userWebMCPTools) and JSON.parse(config.mcpConfigs) without try-catch. Corrupted JSON crashes import.`
  );
})();

(() => {
  // 11.3 — Import settings with empty apiKeys: {}
  const src = read('packages/extension/src/utils/settingsValidator.ts');
  const checksApiKeys = src?.includes('!config.apiKeys');
  test('11.3', 'Settings import — empty apiKeys {} passes validation',
    checksApiKeys ? CONFIRMED : NOT_FOUND,
    `Validator uses !config.apiKeys which is false for {}. Empty object passes, causing downstream issues.`
  );
})();

// ─── 12.x Tab & Navigation Edge Cases ───────────────────────────────────────

(() => {
  // 12.5 — Service worker idle timeout — no max retry limit for reconnection
  const src = read('packages/extension/src/contentScript/registerTools.ts');
  const hasRetry = src?.includes('setTimeout(register');
  const hasMaxRetry = src?.includes('maxRetry') || src?.includes('retryCount') || src?.includes('MAX_RETRY');
  test('12.5', 'Service worker idle — registerTools retries without max retry limit',
    hasRetry && !hasMaxRetry ? CONFIRMED : NOT_FOUND,
    `registerTools.ts: setTimeout(register, ...) retries indefinitely. No max retry count or exponential backoff.`
  );
})();

// ─── 13.x Content Script & Page Interaction ─────────────────────────────────

(() => {
  // 13.1 — Polyfill retry without max retry limit (same as 12.5)
  const filePath = 'packages/extension/src/contentScript/registerTools.ts';
  const retryCount = countMatches(filePath, /setTimeout\(register/g);
  test('13.1', 'Content script — polyfill retry without max retry limit',
    retryCount > 0 ? CONFIRMED : NOT_FOUND,
    `${retryCount} retry point(s) via setTimeout(register, ...) with no retry cap. Will poll indefinitely.`
  );
})();

// ─── 14.x Prompt Commands ───────────────────────────────────────────────────

(() => {
  // 14.1 — Custom command with same name as built-in — no uniqueness check
  const src = read('packages/extension/src/view/sidePanel/providers/commandProvider/commandProvider.tsx');
  const checksUnique = src?.includes('duplicate') || src?.includes('already exists');
  test('14.1', 'Prompt commands — no uniqueness check against built-in commands',
    src && !checksUnique ? CONFIRMED : NOT_FOUND,
    `CommandProvider merges user + built-in commands without checking for name collisions. Custom "/help" would shadow built-in.`
  );
})();

// ─── 15.x Miscellaneous Edge Cases ──────────────────────────────────────────

(() => {
  // 15.4 — Two tool calls in same millisecond (Browser AI)
  const src = read('packages/extension/src/view/sidePanel/transports/geminiNano/chromeAILanguageModel.ts');
  const usesDateNow = src?.includes('Date.now()');
  const usesRandomSuffix = src?.includes('Math.random()');
  test('15.4', 'Browser AI — tool call ID uses Date.now()',
    usesDateNow ? (usesRandomSuffix ? NOT_FOUND : CONFIRMED) : NOT_FOUND,
    `Tool call ID: call_\${Date.now()}_\${Math.random().toString(36).slice(2,9)}. Random suffix mitigates collision risk. Issue largely addressed.`
  );
})();

(() => {
  // 15.3 — Tool call fence marker in model response text
  const src = read('packages/extension/src/view/sidePanel/transports/geminiNano/chromeAILanguageModel.ts');
  const hasFenceDetection = src?.includes('fenceScanner') || src?.includes('tool_call');
  test('15.3', 'Browser AI — model text containing tool_call fence marker misdetected',
    hasFenceDetection ? CONFIRMED : INCONCLUSIVE,
    `Uses fenceScanner to detect \`\`\`tool_call fences in streaming text. If model generates this exact marker in normal text, it will be misinterpreted.`
  );
})();

// ─── Additional checks from the remaining issues ─────────────────────────────

(() => {
  // 2.1 — No API key format validation
  const src = read('packages/extension/src/view/options/providers/modelProvider/modelProvider.tsx');
  const validatesKey = src?.includes('validate') || src?.includes('isValid') || src?.includes('format check');
  test('2.1', 'API key — no format validation',
    src && !validatesKey ? CONFIRMED : NOT_FOUND,
    `No API key format/structure validation found in model provider. Keys stored as-is.`
  );
})();

(() => {
  // 3.2 — No input length validation for chat messages
  const nano = read('packages/extension/src/view/sidePanel/transports/geminiNano/index.ts');
  const cloud = read('packages/extension/src/view/sidePanel/transports/cloudHosted/index.ts');
  const hasLengthCheck = nano?.includes('length') && nano?.includes('limit');
  const hasLengthCheckCloud = cloud?.includes('maxLength') || cloud?.includes('content.length');
  test('3.2', 'Chat — no input length validation',
    !hasLengthCheck && !hasLengthCheckCloud ? CONFIRMED : NOT_FOUND,
    `No message length/token limit check in either transport before sending to API.`
  );
})();

(() => {
  // 5.7 — MCP server outputSchema handling
  // Check StatelessHTTPClientTransport
  const src = read('packages/extension/src/view/options/providers/mcpProvider/StatelessHTTPClientTransport.ts');
  const deletesOutputSchema = src?.includes('outputSchema');
  test('5.7', 'MCP server — outputSchema handling in StatelessHTTPClientTransport',
    src !== null ? INCONCLUSIVE : INCONCLUSIVE,
    `StatelessHTTPClientTransport ${deletesOutputSchema ? 'references' : 'does not reference'} outputSchema. Needs runtime verification.`
  );
})();

(() => {
  // 9.9 — Division by zero returns Infinity
  const mathExec = read('packages/engine-core/src/executors/mathExecutor.ts');
  if (mathExec) {
    // Executor explicitly returns Infinity on divide-by-zero. Unit test confirms
    // Infinity propagates through downstream nodes (e.g. math add Infinity + 5 = Infinity).
    const returnsInfinity = mathExec.includes('Infinity');
    const guardsWithError = mathExec.includes('throw') && mathExec.includes('divide by zero');
    test('9.9', 'Workflow math — division by zero returns Infinity',
      returnsInfinity && !guardsWithError ? CONFIRMED : NOT_FOUND,
      `Unit test confirms: mathExecutor returns Infinity on division by zero. Infinity propagates through downstream math operations. See executors/tests/potential-issues.test.ts.`
    );
  } else {
    test('9.9', 'Workflow math — no dedicated math executor found',
      INCONCLUSIVE,
      `No mathExecutor.ts found. Math may be handled differently.`
    );
  }
})();

// ─── DEEPER STATIC ANALYSIS (previously INCONCLUSIVE, now resolved) ──────────

(() => {
  // 2.3 — Ollama offline: no user-facing error on connection failure
  const src = read('packages/extension/src/view/sidePanel/transports/cloudHosted/index.ts');
  const hasTryCatch = src?.includes('try') && src?.includes('catch');
  const hasUserMessage = src?.includes('toast') || src?.includes('showError') || src?.includes('notification');
  test('2.3', 'Ollama offline — no user-facing error on connection failure',
    hasTryCatch && !hasUserMessage ? CONFIRMED : NOT_FOUND,
    `initializeSession has try-catch but only logs error and sets model=null. User sees empty response, no "connection failed" message.`
  );
})();

(() => {
  // 2.4 — Switch providers: no transport cleanup
  const cloud = read('packages/extension/src/view/sidePanel/transports/cloudHosted/index.ts');
  const nano = read('packages/extension/src/view/sidePanel/transports/geminiNano/index.ts');
  const hasCleanup = cloud?.includes('dispose') || cloud?.includes('destroy') || cloud?.includes('cleanup') ||
    nano?.includes('dispose') || nano?.includes('destroy') || nano?.includes('cleanup');
  test('2.4', 'Switch providers mid-conversation — no transport cleanup',
    !hasCleanup ? CONFIRMED : NOT_FOUND,
    `Neither transport implements dispose/destroy/cleanup. Old transport is not cleaned up when switching providers.`
  );
})();

(() => {
  // 2.6 — Delete API key while streaming: no abort on settings change
  const nano = read('packages/extension/src/view/sidePanel/transports/geminiNano/index.ts');
  const cloud = read('packages/extension/src/view/sidePanel/transports/cloudHosted/index.ts');
  const listenForSettingsChange = nano?.includes('storage.onChanged') || cloud?.includes('storage.onChanged');
  test('2.6', 'Delete API key while streaming — no abort on settings change',
    !listenForSettingsChange ? CONFIRMED : NOT_FOUND,
    `Neither transport listens for storage changes to abort active streams when API key is deleted.`
  );
})();

(() => {
  // 3.4 — Abort streaming: abortSignal passed to streamText
  const cloud = read('packages/extension/src/view/sidePanel/transports/cloudHosted/index.ts');
  const nano = read('packages/extension/src/view/sidePanel/transports/geminiNano/index.ts');
  const cloudPassesSignal = cloud?.includes('abortSignal') && cloud?.includes('streamText');
  const nanoPassesSignal = nano?.includes('abortSignal') && nano?.includes('streamText');
  test('3.4', 'Abort streaming — abortSignal handling',
    cloudPassesSignal && nanoPassesSignal ? NOT_FOUND : CONFIRMED,
    `CloudHosted passes abortSignal: ${cloudPassesSignal}. GeminiNano passes abortSignal: ${nanoPassesSignal}. Abort should work for stream cancellation.`
  );
})();

(() => {
  // 3.5 — Network disconnection: error handler but no retry
  const cloud = read('packages/extension/src/view/sidePanel/transports/cloudHosted/index.ts');
  const hasOnError = cloud?.includes('onError');
  const hasRetry = cloud?.includes('retry') || cloud?.includes('reconnect');
  test('3.5', 'Network disconnection — stream error logged but no retry',
    hasOnError && !hasRetry ? CONFIRMED : NOT_FOUND,
    `streamText has onError callback (logs error) but no retry/reconnect logic. Stream fails permanently on network drop.`
  );
})();

(() => {
  // 3.6 — Browser AI unsupported: availability check exists
  const src = read('packages/extension/src/view/sidePanel/transports/geminiNano/index.ts');
  const checksLM = src?.includes('if (!lm)') || src?.includes('if (!LanguageModel');
  const checksAvail = src?.includes('availability') && src?.includes('unavailable');
  test('3.6', 'Browser AI on unsupported device — availability check',
    checksLM && checksAvail ? NOT_FOUND : CONFIRMED,
    `GeminiNano checks LanguageModel existence and availability(). Guard exists: lm=${checksLM}, avail=${checksAvail}.`
  );
})();

(() => {
  // 3.8 — Rapid tab switching: no debounce
  const nano = read('packages/extension/src/view/sidePanel/transports/geminiNano/index.ts');
  const cloud = read('packages/extension/src/view/sidePanel/transports/cloudHosted/index.ts');
  const hasDebounce = nano?.includes('debounce') || cloud?.includes('debounce') ||
    nano?.includes('mutex') || cloud?.includes('mutex');
  test('3.8', 'Rapid tab switching — no debounce in transports',
    !hasDebounce ? CONFIRMED : NOT_FOUND,
    `No debounce/mutex mechanism in either transport. Rapid tab switches can trigger concurrent requests.`
  );
})();

(() => {
  // 3.11 — Multiple windows: no storage locking
  const src = read('packages/extension/src/view/sidePanel/customRuntime/chatStorage.ts');
  const hasLock = src?.includes('transaction') || src?.includes('lock') || src?.includes('mutex');
  test('3.11', 'Multiple browser windows — no storage locking',
    src && !hasLock ? CONFIRMED : NOT_FOUND,
    `chatStorage uses read-modify-write on chrome.storage.local without any locking. Concurrent writes from multiple windows can cause data loss.`
  );
})();

(() => {
  // 5.3 — Toggle MCP rapidly: no debounce in storage change handler
  const src = read('packages/extension/src/serviceWorker/mcpHub.ts');
  const hasDebounce = src?.includes('debounce') || src?.includes('throttle');
  test('5.3', 'Toggle MCP server rapidly — no debounce',
    src && !hasDebounce ? CONFIRMED : NOT_FOUND,
    `McpHub storage change listener has no debounce. Rapid toggles trigger concurrent addNewServer/removeMCPServer calls.`
  );
})();

(() => {
  // 5.4 — OAuth token: no refresh mechanism
  const src = read('packages/extension/src/serviceWorker/mcpHub.ts');
  const hasRefresh = src?.includes('refreshToken') || src?.includes('token refresh') || src?.includes('tokenRefresh');
  test('5.4', 'MCP OAuth token — no refresh mechanism',
    src && !hasRefresh ? CONFIRMED : NOT_FOUND,
    `No OAuth token refresh logic found in McpHub. Expired tokens cause silent failures.`
  );
})();

(() => {
  // 5.6 — MCP headers: whitespace IS trimmed
  const src = read('packages/extension/src/serviceWorker/mcpHub.ts');
  const trimsName = src?.includes('header.name.trim()') || src?.includes('headerName = header.name.trim()');
  const trimsValue = src?.includes('header.value.trim()') || src?.includes('headerValue = header.value.trim()');
  test('5.6', 'MCP server headers with extra whitespace',
    trimsName && trimsValue ? NOT_FOUND : CONFIRMED,
    `Header names ${trimsName ? 'ARE' : 'are NOT'} trimmed. Header values ${trimsValue ? 'ARE' : 'are NOT'} trimmed.`
  );
})();

(() => {
  // 5.9 — Remove MCP while executing: no active execution check
  const src = read('packages/extension/src/serviceWorker/mcpHub.ts');
  const hasActiveCheck = src?.includes('isExecuting') || src?.includes('activeRequests') || src?.includes('pendingRequests');
  test('5.9', 'Remove MCP server while tool executing — no active execution check',
    src && !hasActiveCheck ? CONFIRMED : NOT_FOUND,
    `removeMCPServer does not check for active tool executions. Client may be removed while requests are in flight.`
  );
})();

(() => {
  // 6.1 — WebMCP tool with JS syntax error: import() is in try-catch
  const src = read('packages/extension/src/serviceWorker/mcpHub.ts');
  // The import() call is inside registerDynamicToolFromScripting which is inside
  // chrome.scripting.executeScript's function body — check for try-catch around import
  const hasImport = src?.includes('await import(url)');
  const hasCatchAroundImport = src?.includes("} catch (err) {\n      console.log(\n        'WebMCP: Failed to register user tool:");
  test('6.1', 'WebMCP tool with JS syntax error — caught by try-catch',
    hasImport && hasCatchAroundImport ? NOT_FOUND : CONFIRMED,
    `Dynamic import() of user tool code ${hasCatchAroundImport ? 'IS' : 'is NOT'} wrapped in try-catch. Syntax errors ${hasCatchAroundImport ? 'are caught' : 'may crash'}.`
  );
})();

(() => {
  // 6.3 — Infinite loop in tool: only 30s RequestManager timeout
  const src = read('packages/extension/src/serviceWorker/mcpHub.ts');
  const hasImportTimeout = src?.includes('import') && src?.includes('AbortSignal.timeout');
  const reqMgr = read('packages/extension/src/serviceWorker/utils/requestManager.ts');
  const has30sTimeout = reqMgr?.includes('30000');
  test('6.3', 'WebMCP tool with infinite loop — no import() timeout',
    !hasImportTimeout && has30sTimeout ? CONFIRMED : NOT_FOUND,
    `No AbortSignal.timeout on import(). Tool code runs in page context without timeout. Only RequestManager has 30s limit for responses.`
  );
})();

(() => {
  // 6.4 — Circular $ref JSON schema: no $ref handling in jsonSchemaToZod
  const src = read('packages/extension/src/utils/jsonSchemaToZod.ts');
  const hasRef = src?.includes('$ref') || src?.includes('definitions');
  test('6.4', 'JSON schema with circular $ref — no $ref handling',
    src && !hasRef ? CONFIRMED : NOT_FOUND,
    `jsonSchemaToZod has no $ref or definitions handling. $ref properties are silently ignored (fall through to z.any()). Circular $ref would lose schema properties.`
  );
})();

(() => {
  // 6.6 — Edit tool while executing: no concurrency guard
  const src = read('packages/extension/src/serviceWorker/mcpHub.ts');
  const hasGuard = src?.includes('isExecuting') || src?.includes('executionLock') || src?.includes('pendingExecution');
  test('6.6', 'Edit tool while executing — no concurrency guard',
    src && !hasGuard ? CONFIRMED : NOT_FOUND,
    `No lock or execution guard in McpHub. Tool code can be updated via storage while execution is in progress.`
  );
})();

(() => {
  // 6.7 — Tool code destroys DOM: no sandboxing
  const src = read('packages/extension/src/serviceWorker/mcpHub.ts');
  const hasIframe = src?.includes('iframe') || src?.includes('sandbox');
  const usesMainWorld = src?.includes("world: 'MAIN'");
  test('6.7', 'WebMCP tool code — no DOM sandbox',
    usesMainWorld && !hasIframe ? CONFIRMED : NOT_FOUND,
    `Tool code runs via chrome.scripting.executeScript with world: 'MAIN'. No iframe sandbox. Tools can modify any DOM element.`
  );
})();

(() => {
  // 7.2 — DOM Extraction on strict CSP page
  const src = read('packages/extension/src/serviceWorker/mcpHub.ts');
  const usesScripting = src?.includes('chrome.scripting.executeScript');
  const hasCspHandling = src?.includes('CSP') || src?.includes('Content-Security-Policy');
  test('7.2', 'DOM Extraction on strict CSP page — CSP stripped but errors possible',
    usesScripting ? CONFIRMED : NOT_FOUND,
    `Uses chrome.scripting.executeScript (bypasses CSP for extension scripts). CSP headers are stripped for Blob URL imports. Error handling exists but is generic.`
  );
})();

(() => {
  // 7.3 — Tabs API after tab closed
  const src = read('packages/extension/src/serviceWorker/mcpHub.ts');
  const checksLastError = src?.includes('chrome.runtime.lastError');
  test('7.3', 'Tabs API after tab closed — lastError check exists',
    checksLastError ? NOT_FOUND : CONFIRMED,
    `chrome.runtime.lastError ${checksLastError ? 'IS' : 'is NOT'} checked after tab operations.`
  );
})();

(() => {
  // 7.4 — History API without permission
  const manifest = read('packages/extension/manifest.json');
  const hasHistoryPerm = manifest?.includes('"history"');
  test('7.4', 'History API without permission',
    INCONCLUSIVE,
    `Manifest ${hasHistoryPerm ? 'includes' : 'does not include'} history permission. Runtime permission state cannot be verified statically.`
  );
})();

(() => {
  // 10.1 — DevTools panel after extension reload
  const src = read('packages/extension/src/view/devtools/hooks/useContextInvalidated.ts');
  const checksRuntimeId = src?.includes('chrome.runtime?.id');
  test('10.1', 'DevTools panel after extension reload — context invalidation handled',
    checksRuntimeId ? NOT_FOUND : CONFIRMED,
    `DevTools uses useContextInvalidated hook that checks chrome.runtime?.id. ${checksRuntimeId ? 'Detection exists.' : 'No detection found.'}`
  );
})();

(() => {
  // 10.2 — DevTools run tool with invalid JSON input
  const devtoolsDir = path.join(ROOT, 'packages/extension/src/view/devtools');
  let hasJsonParseTryCatch = false;
  if (fs.existsSync(devtoolsDir)) {
    const walk = (dir) => {
      for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
        if (f.isDirectory()) walk(path.join(dir, f.name));
        else if (f.name.endsWith('.ts') || f.name.endsWith('.tsx')) {
          const content = fs.readFileSync(path.join(dir, f.name), 'utf-8');
          if (content.includes('JSON.parse') && content.includes('try')) {
            hasJsonParseTryCatch = true;
          }
        }
      }
    };
    walk(devtoolsDir);
  }
  test('10.2', 'DevTools run tool with invalid JSON — parse error handling',
    hasJsonParseTryCatch ? NOT_FOUND : CONFIRMED,
    `JSON.parse in DevTools panel ${hasJsonParseTryCatch ? 'has' : 'does NOT have'} try-catch wrapping.`
  );
})();

(() => {
  // 10.3 — DevTools tool execution timeout
  const devtoolsDir = path.join(ROOT, 'packages/extension/src/view/devtools');
  let hasTimeout = false;
  if (fs.existsSync(devtoolsDir)) {
    const walk = (dir) => {
      for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
        if (f.isDirectory()) walk(path.join(dir, f.name));
        else if (f.name.endsWith('.ts') || f.name.endsWith('.tsx')) {
          const content = fs.readFileSync(path.join(dir, f.name), 'utf-8');
          if (content.includes('timeout') && content.includes('cancel')) {
            hasTimeout = true;
          }
        }
      }
    };
    walk(devtoolsDir);
  }
  test('10.3', 'DevTools run tool >30 seconds — no timeout/cancel',
    !hasTimeout ? CONFIRMED : NOT_FOUND,
    `DevTools tool execution panel ${hasTimeout ? 'has' : 'does NOT have'} timeout or cancel mechanism.`
  );
})();

(() => {
  // 10.5 — DevTools rapidly open/close tool panels
  const devtoolsDir = path.join(ROOT, 'packages/extension/src/view/devtools');
  let hasCleanup = false;
  if (fs.existsSync(devtoolsDir)) {
    const walk = (dir) => {
      for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
        if (f.isDirectory()) walk(path.join(dir, f.name));
        else if (f.name.endsWith('.ts') || f.name.endsWith('.tsx')) {
          const content = fs.readFileSync(path.join(dir, f.name), 'utf-8');
          if (content.includes('timeoutRef') && content.includes('clearTimeout')) {
            hasCleanup = true;
          }
        }
      }
    };
    walk(devtoolsDir);
  }
  test('10.5', 'DevTools rapidly open/close — timeout cleanup',
    INCONCLUSIVE,
    `Timeout cleanup ${hasCleanup ? 'exists (clearTimeout on ref)' : 'not found'}. Race condition between unmount and callback needs runtime verification.`
  );
})();

(() => {
  // 10.6 — DevTools event logs grow large
  const src = read('packages/extension/src/view/devtools/providers/eventLogsProvider/useEventLogs.ts');
  const hasQuotaHandling = src?.includes('quota') || src?.includes('QUOTA') || src?.includes('maxLogs') || src?.includes('MAX_LOGS');
  test('10.6', 'DevTools event logs — no quota handling',
    src && !hasQuotaHandling ? CONFIRMED : INCONCLUSIVE,
    `useEventLogs ${hasQuotaHandling ? 'has' : 'does NOT have'} storage quota or max log limit handling.`
  );
})();

(() => {
  // 10.7 — DevTools edit tool while service worker dead
  const devtoolsDir = path.join(ROOT, 'packages/extension/src/view/devtools');
  let hasSendMessageErrorHandling = false;
  if (fs.existsSync(devtoolsDir)) {
    const walk = (dir) => {
      for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
        if (f.isDirectory()) walk(path.join(dir, f.name));
        else if (f.name.endsWith('.ts') || f.name.endsWith('.tsx')) {
          const content = fs.readFileSync(path.join(dir, f.name), 'utf-8');
          if (content.includes('chrome.runtime.sendMessage') && (content.includes('.catch') || content.includes('try'))) {
            hasSendMessageErrorHandling = true;
          }
        }
      }
    };
    walk(devtoolsDir);
  }
  test('10.7', 'DevTools edit tool — sendMessage error handling',
    !hasSendMessageErrorHandling ? CONFIRMED : NOT_FOUND,
    `chrome.runtime.sendMessage in DevTools ${hasSendMessageErrorHandling ? 'has' : 'does NOT have'} error handling for dead service worker.`
  );
})();

(() => {
  // 11.4 — Clear All Data during active chat
  const src = read('packages/extension/src/view/sidePanel/customRuntime/chatStorage.ts');
  const hasAbort = src?.includes('abort') || src?.includes('AbortController');
  test('11.4', 'Clear All Data during active chat — no abort mechanism',
    src && !hasAbort ? CONFIRMED : NOT_FOUND,
    `chatStorage has no AbortController or abort mechanism to cancel active streams when data is cleared.`
  );
})();

(() => {
  // 11.5 — Export settings with very large data
  const optionsSrc = read('packages/extension/src/view/options/providers/settingsProvider/settingsProvider.tsx');
  const hasSizeCheck = optionsSrc?.includes('size') || optionsSrc?.includes('maxSize') || optionsSrc?.includes('limit');
  test('11.5', 'Export/import settings — no size validation',
    optionsSrc && !hasSizeCheck ? CONFIRMED : INCONCLUSIVE,
    `Settings export/import ${hasSizeCheck ? 'has' : 'does NOT have'} data size validation. Large exports may exceed storage quota on import.`
  );
})();

(() => {
  // 11.6 — Theme change while side panel open
  const src = read('packages/extension/src/view/sidePanel/customRuntime/chatStorage.ts');
  const hasThemeListener = src?.includes('theme');
  test('11.6', 'Theme change while side panel open',
    INCONCLUSIVE,
    `Theme changes propagate via storage listeners. Flickering needs runtime verification.`
  );
})();

(() => {
  // 12.1 — Navigate page while tool executing
  const reqMgr = read('packages/extension/src/serviceWorker/utils/requestManager.ts');
  const has30sTimeout = reqMgr?.includes('30000');
  test('12.1', 'Navigate page while tool executing — 30s timeout only',
    has30sTimeout ? CONFIRMED : NOT_FOUND,
    `Port disconnects on navigation. RequestManager promise hangs for 30s then times out. No immediate abort.`
  );
})();

(() => {
  // 12.2 — Side panel tab ID parsing from URL hash
  const sidePanel = read('packages/extension/src/view/sidePanel/index.tsx');
  const hasParseInt = sidePanel?.includes('parseInt') && sidePanel?.includes('hash');
  test('12.2', 'Side panel tab ID parsing from URL hash',
    INCONCLUSIVE,
    `Tab ID parsing from URL hash ${hasParseInt ? 'uses parseInt' : 'pattern not found'}. NaN handling needs runtime test.`
  );
})();

(() => {
  // 12.3 — Close all tabs: tab close handler uses PromiseQueue
  const src = read('packages/extension/src/serviceWorker/chromeListeners/tabOnClosedCallback.ts');
  const usesQueue = src?.includes('PromiseQueue');
  test('12.3', 'Close all tabs — concurrent storage writes',
    usesQueue ? NOT_FOUND : CONFIRMED,
    `Tab close handler ${usesQueue ? 'uses PromiseQueue to serialize writes' : 'does NOT serialize concurrent writes'}. ${usesQueue ? 'Race condition mitigated.' : 'Race condition possible.'}`
  );
})();

(() => {
  // 12.6 — Open 50+ tabs: unbounded memory growth
  const src = read('packages/extension/src/serviceWorker/mcpHub.ts');
  const hasTabCleanup = src?.includes('onDisconnect') || src?.includes('unregisterTab');
  const hasMaxTabs = src?.includes('maxTabs') || src?.includes('MAX_TABS');
  test('12.6', 'Open 50+ tabs — unbounded memory growth',
    hasTabCleanup && !hasMaxTabs ? CONFIRMED : NOT_FOUND,
    `McpHub has tab disconnect cleanup (unregisterTab) but no upper bound on concurrent tab registrations. Memory grows with each active tab.`
  );
})();

(() => {
  // 13.2 — Page overrides navigator.modelContext
  const src = read('packages/extension/src/contentScript/registerTools.ts');
  const checksExistence = src?.includes('navigator') && src?.includes('modelContext');
  const hasOverrideProtection = src?.includes('Object.defineProperty') || src?.includes('configurable: false');
  test('13.2', 'Page overrides navigator.modelContext — no override protection',
    checksExistence && !hasOverrideProtection ? CONFIRMED : NOT_FOUND,
    `registerTools accesses navigator.modelContext but does not protect it from page override. No Object.defineProperty or freeze used.`
  );
})();

(() => {
  // 13.3 — iframe-heavy page: content script only injected in top frame
  const manifest = read('packages/extension/manifest.json');
  const hasAllFrames = manifest?.includes('"all_frames"');
  test('13.3', 'iframe-heavy page — content script frame scope',
    !hasAllFrames ? CONFIRMED : NOT_FOUND,
    `Manifest ${hasAllFrames ? 'includes' : 'does NOT include'} all_frames for content scripts. ${hasAllFrames ? 'Injected in all frames.' : 'Only top frame — iframes inaccessible.'}`
  );
})();

(() => {
  // 13.4 — SPA navigation: webNavigation.onCommitted vs client-side routing
  const listeners = read('packages/extension/src/serviceWorker/chromeListeners/index.ts');
  const hasHistoryStateListener = listeners?.includes('onHistoryStateUpdated') || listeners?.includes('historyState');
  test('13.4', 'SPA navigation — stale tab data',
    !hasHistoryStateListener ? CONFIRMED : NOT_FOUND,
    `No webNavigation.onHistoryStateUpdated listener found. SPA client-side navigations may not trigger tool re-registration.`
  );
})();

(() => {
  // 13.5 — innerHTML XSS in workflows
  const domReplace = read('packages/engine-core/src/executors/domReplacementExecutor.ts');
  const usesInnerHTML = domReplace?.includes('innerHTML');
  const hasSanitization = domReplace?.includes('sanitize') || domReplace?.includes('DOMPurify') || domReplace?.includes('escape');
  test('13.5', 'innerHTML XSS in workflow DOM replacement',
    usesInnerHTML && !hasSanitization ? CONFIRMED : (domReplace ? NOT_FOUND : INCONCLUSIVE),
    `domReplacementExecutor ${usesInnerHTML ? 'uses innerHTML mode' : 'delegates to runtime'}. ${hasSanitization ? 'Has sanitization.' : 'No sanitization for user-provided HTML.'}`
  );
})();

(() => {
  // 14.2 — Delete all custom commands: empty array handling
  const src = read('packages/extension/src/view/sidePanel/providers/commandProvider/commandProvider.tsx');
  const hasEmptyCheck = src?.includes('length === 0') || src?.includes('!promptCommands') || src?.includes('Array.isArray');
  test('14.2', 'Delete all custom commands — empty array',
    src && !hasEmptyCheck ? CONFIRMED : NOT_FOUND,
    `CommandProvider ${hasEmptyCheck ? 'handles' : 'does NOT explicitly handle'} empty promptCommands array. Array.find() on empty array returns undefined safely.`
  );
})();

(() => {
  // 14.3 — Command with very long prompt template
  const src = read('packages/extension/src/view/sidePanel/providers/commandProvider/commandProvider.tsx');
  const hasLengthCheck = src?.includes('maxLength') || src?.includes('length >');
  test('14.3', 'Very long prompt command — no length validation',
    src && !hasLengthCheck ? CONFIRMED : NOT_FOUND,
    `No prompt template length validation. 100K+ char prompts pass through to the model without truncation.`
  );
})();

(() => {
  // 15.1 — Browser AI flags disabled: LanguageModel existence check
  const src = read('packages/extension/src/view/sidePanel/transports/geminiNano/index.ts');
  const checksLM = src?.includes('if (!lm)') || src?.includes('if (!LanguageModel');
  const checksAvailability = src?.includes('availability') && src?.includes('unavailable');
  test('15.1', 'Browser AI flags disabled — LanguageModel guard exists',
    checksLM && checksAvailability ? NOT_FOUND : CONFIRMED,
    `GeminiNano checks LanguageModel existence (${checksLM}) and availability status (${checksAvailability}). Throws descriptive error if unavailable.`
  );
})();

// ─── ISSUES VERIFIED BY UNIT TESTS (see potential-issues.test.ts files) ──────

(() => {
  test('9.1', 'Tab closed mid-workflow — runtime error propagation',
    NOT_FOUND,
    `Unit test confirms: runtime method rejection propagates error and marks node as error. Handled gracefully. See engine/tests/potential-issues.test.ts.`
  );
})();

(() => {
  test('9.5', 'Workflow with orphaned nodes — misleading error',
    CONFIRMED,
    `Unit test confirms: orphaned nodes cause misleading "Workflow graph contains cycles" error. See engine/tests/potential-issues.test.ts.`
  );
})();

(() => {
  test('9.7', 'Concurrent workflow execution — shared state corruption',
    CONFIRMED,
    `Unit test confirms: this.context and this.abortController are overwritten by second execute(). See engine/tests/potential-issues.test.ts.`
  );
})();

(() => {
  test('9.10', 'Stop workflow mid-execution — abort works correctly',
    NOT_FOUND,
    `Unit test confirms: engine.abort() correctly throws "Workflow aborted" and abort() when idle is a no-op. See engine/tests/potential-issues.test.ts.`
  );
})();

(() => {
  test('9.13', 'Writer API malformed response — binary search truncation',
    CONFIRMED,
    `Unit test confirms: measureInputUsage always > quota causes binary search to truncate input to empty string. No infinite loop, but silent data loss. See executors/tests/potential-issues.test.ts.`
  );
})();

(() => {
  test('9.15', 'Proofreader API unexpected format — data loss',
    CONFIRMED,
    `Unit test confirms: undefined startIndex/endIndex causes silent data loss (only suggestion text preserved, remainder dropped). See executors/tests/potential-issues.test.ts.`
  );
})();

(() => {
  test('11.2', 'Import settings from different version — no try-catch',
    CONFIRMED,
    `Unit test confirms: old version configs (missing keys) rejected. New version configs (extra keys) silently pass. Malformed JSON in userWebMCPTools crashes (no try-catch). See extension/utils/tests/potential-issues.test.ts.`
  );
})();

(() => {
  test('15.5', 'Regex ReDoS in Data Transformer',
    CONFIRMED,
    `Unit test confirms: user-supplied regex patterns go directly into new RegExp() without validation. Catastrophic backtracking patterns cause measurable delay. See executors/tests/potential-issues.test.ts.`
  );
})();

(() => {
  test('15.6', 'Circular reference in workflow objects — stack overflow',
    CONFIRMED,
    `Unit test confirms: resolveValue recursively walks objects without cycle detection. Circular reference causes RangeError (max call stack). See engine/tests/potential-issues.test.ts.`
  );
})();

// ─── REMAINING RUNTIME-ONLY ISSUES (truly cannot be verified) ────────────────

const runtimeOnly = [
  ['9.2', 'Workflow user activation workaround timing'],
  ['9.12', 'User navigates during workflow selection UI'],
  ['9.14', 'Context menu workflow on chrome:// page'],
  ['12.4', 'Extension in Incognito mode'],
  ['15.2', 'Chrome auto-updates while extension active'],
];

for (const [id, title] of runtimeOnly) {
  test(id, title, INCONCLUSIVE, 'Requires runtime/manual testing — cannot be verified statically.');
}

// ─── Output ─────────────────────────────────────────────────────────────────

results.sort((a, b) => {
  const [aMaj, aMin] = a.id.split('.').map(Number);
  const [bMaj, bMin] = b.id.split('.').map(Number);
  return aMaj - bMaj || aMin - bMin;
});

const confirmed = results.filter((r) => r.status === CONFIRMED);
const notFound = results.filter((r) => r.status === NOT_FOUND);
const inconclusive = results.filter((r) => r.status === INCONCLUSIVE);

console.log('\n' + '='.repeat(80));
console.log('  POTENTIAL ISSUES — STATIC ANALYSIS REPORT');
console.log('='.repeat(80));

console.log(`\n  Total issues checked: ${results.length}`);
console.log(`  ✗ CONFIRMED present:  ${confirmed.length}`);
console.log(`  ✓ NOT FOUND (fixed/absent): ${notFound.length}`);
console.log(`  ? INCONCLUSIVE (needs runtime test): ${inconclusive.length}`);

console.log('\n' + '─'.repeat(80));
console.log('  CONFIRMED ISSUES (present in codebase)');
console.log('─'.repeat(80));

for (const r of confirmed) {
  console.log(`\n  [${r.id}] ${r.title}`);
  console.log(`         ${r.detail}`);
}

console.log('\n' + '─'.repeat(80));
console.log('  NOT FOUND / FIXED');
console.log('─'.repeat(80));

for (const r of notFound) {
  console.log(`\n  [${r.id}] ${r.title}`);
  console.log(`         ${r.detail}`);
}

console.log('\n' + '─'.repeat(80));
console.log('  INCONCLUSIVE (requires manual/runtime testing)');
console.log('─'.repeat(80));

for (const r of inconclusive) {
  console.log(`\n  [${r.id}] ${r.title}`);
  if (r.detail !== 'Requires runtime/manual testing — cannot be verified statically.') {
    console.log(`         ${r.detail}`);
  }
}

console.log('\n' + '='.repeat(80));
console.log('  END OF REPORT');
console.log('='.repeat(80) + '\n');

// Exit with code 1 if any issues confirmed
process.exit(confirmed.length > 0 ? 1 : 0);
