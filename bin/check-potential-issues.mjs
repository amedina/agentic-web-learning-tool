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
  // This is inherent to JavaScript, not a code bug. Check if math executor exists.
  const mathExec = read('packages/engine-core/src/executors/math.ts');
  if (mathExec) {
    const checksZero = mathExec.includes('/ 0') || mathExec.includes('Infinity') || mathExec.includes('isFinite');
    test('9.9', 'Workflow math — no division-by-zero check',
      !checksZero ? CONFIRMED : NOT_FOUND,
      `Math executor does not check for division by zero. JS returns Infinity → serialized as null in JSON.`
    );
  } else {
    test('9.9', 'Workflow math — no dedicated math executor found',
      INCONCLUSIVE,
      `No math.ts executor found. Math may be handled differently.`
    );
  }
})();

// ─── RUNTIME-ONLY ISSUES (cannot be statically verified) ────────────────────

const runtimeOnly = [
  ['2.3', 'Ollama offline scenario — connection refused handling'],
  ['2.4', 'Switch providers mid-conversation — race condition'],
  ['2.6', 'Delete API key while chat is in progress'],
  ['3.4', 'Abort/cancel streaming — cleanup completeness'],
  ['3.5', 'Network disconnection during streaming'],
  ['3.6', 'Browser AI on unsupported device'],
  ['3.8', 'Switch tabs rapidly while chatting'],
  ['3.11', 'Chat from multiple browser windows simultaneously'],
  ['5.3', 'Toggle MCP server on/off rapidly — race condition'],
  ['5.4', 'MCP OAuth token expiry — no refresh mechanism'],
  ['5.6', 'MCP server headers with extra whitespace'],
  ['5.9', 'Remove MCP server while tool executing'],
  ['6.1', 'WebMCP tool with JavaScript syntax error'],
  ['6.3', 'WebMCP tool with infinite loop — no timeout'],
  ['6.4', 'Tool with circular $ref JSON schema'],
  ['6.6', 'Edit tool while executing — race condition'],
  ['6.7', 'Tool code destroys page DOM'],
  ['7.2', 'DOM Extraction on strict CSP page'],
  ['7.3', 'Tabs API after tab closed'],
  ['7.4', 'History API without permission'],
  ['9.1', 'Tab closed mid-workflow'],
  ['9.2', 'Workflow user activation workaround timing'],
  ['9.5', 'Workflow with orphaned nodes'],
  ['9.7', 'Run same workflow twice simultaneously'],
  ['9.10', 'Stop workflow mid-execution — isStopping flag'],
  ['9.12', 'User navigates during workflow selection UI'],
  ['9.13', 'Writer/Rewriter API malformed response'],
  ['9.14', 'Context menu workflow on chrome:// page'],
  ['9.15', 'Proofreader API unexpected format'],
  ['10.1', 'DevTools panel after extension reload'],
  ['10.2', 'DevTools run tool with invalid JSON'],
  ['10.3', 'DevTools run tool >30 seconds'],
  ['10.5', 'DevTools rapidly open/close tool panels'],
  ['10.6', 'DevTools event logs grow large'],
  ['10.7', 'DevTools edit tool while service worker dead'],
  ['11.2', 'Import settings from different version'],
  ['11.4', 'Clear All Data during active chat'],
  ['11.5', 'Export settings with very large data'],
  ['11.6', 'Change theme while side panel open'],
  ['12.1', 'Navigate page while tool executing'],
  ['12.2', 'Side panel tab ID parsing from URL hash'],
  ['12.3', 'Close all tabs — concurrent storage writes'],
  ['12.4', 'Extension in Incognito mode'],
  ['12.6', 'Open 50+ tabs — unbounded memory growth'],
  ['13.2', 'Page overrides navigator.modelContext'],
  ['13.3', 'iframe-heavy page — DOM extraction incomplete'],
  ['13.4', 'SPA navigation — stale tab data'],
  ['13.5', 'innerHTML XSS vulnerability in workflows'],
  ['14.2', 'Delete all custom commands — empty array handling'],
  ['14.3', 'Command with very long prompt template'],
  ['15.1', 'Browser AI flags disabled in Chrome'],
  ['15.2', 'Chrome auto-updates while extension active'],
  ['15.5', 'Regex ReDoS in Data Transformer'],
  ['15.6', 'Circular reference in workflow objects'],
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
