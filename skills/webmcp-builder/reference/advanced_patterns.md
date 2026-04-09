# Advanced WebMCP Patterns & Tips

This document covers advanced integration patterns, UI synchronization techniques, SPA routing considerations, and general best practices for building robust WebMCP tools.

## Table of Contents
- [Handle UI Synchronization](#handle-ui-synchronization)
- [Choosing a UI Sync Pattern](#choosing-a-ui-sync-pattern)
- [Dynamic Tool Registration for SPAs](#dynamic-tool-registration-for-spas)
- [Error Handling Patterns](#error-handling-patterns)
- [Common Patterns and Tips](#common-patterns-and-tips)

---

## Handle UI Synchronization

This is the part most developers overlook. When an agent calls a tool, the UI must update to reflect the change. The user is watching the page — if the agent adds an item but the list doesn't update, the experience breaks.

**Pattern 1: Direct DOM manipulation (simple apps)**

If your app already has helper functions that update the UI, just call them from your tool:

\`\`\`js
execute: ({ text }) => {
  addTodoItem(text);    // This function already updates the DOM
  renderTodoList();     // Re-render the list
  return \`Added: \${text}\`;
}
\`\`\`

**Pattern 2: Custom events (decoupled apps)**

For apps where the WebMCP code is separate from the UI code, use custom events:

\`\`\`js
// In webmcp.ts
execute: async (filters) => {
  return new Promise((resolve) => {
    const requestId = crypto.randomUUID();
    
    window.addEventListener(\`tool-done-\${requestId}\`, () => {
      resolve("Filters updated successfully.");
    }, { once: true });

    window.dispatchEvent(new CustomEvent("setFilters", {
      detail: { ...filters, requestId }
    }));
  });
}

// In your UI component
window.addEventListener("setFilters", (e) => {
  applyFilters(e.detail);
  updateUI();
  window.dispatchEvent(new Event(\`tool-done-\${e.detail.requestId}\`));
});
\`\`\`

**Pattern 3: Framework state (React, Vue, etc.)**

For framework-based apps, dispatch events that your components listen to, or use a shared state store:

\`\`\`js
// Register tools where you have access to state setters
export function registerTools(setFilters, setSearchParams) {
  navigator.modelContext.registerTool({
    name: "set_filters",
    description: "Apply filters to the flight results",
    inputSchema: { /* ... */ },
    execute: (filters) => {
      setFilters(filters);  // React state update triggers re-render
      return "Filters applied.";
    }
  });
}
\`\`\`

## Choosing a UI Sync Pattern

Use this decision guide to pick the right UI synchronization approach:

| If your app is... | Use | Why |
|---|---|---|
| **Vanilla JS with direct DOM helpers** (e.g., `renderList()`, `updateTotal()`) | **Pattern 1: Direct DOM manipulation** | Simplest — just call your existing render functions from `execute`. No events or framework overhead. |
| **Multi-module vanilla JS** where WebMCP code is in a separate file from UI code | **Pattern 2: Custom events** (`dispatchAndWait`) | Decouples tool logic from UI logic. The tool fires an event, the UI module handles it and signals completion. |
| **React, Vue, Svelte, or other framework** with reactive state | **Pattern 3: Framework state** (state setters or events → state) | Framework re-renders are async. Use `dispatchAndWait` or pass state setters directly to ensure the UI settles before the tool returns. |

**Quick rule of thumb:** If you can call a function that updates the DOM synchronously, use Pattern 1. If the UI update is async (framework re-render, animation, network fetch), use Pattern 2 or 3 with `dispatchAndWait` to wait for completion.

---

## Dynamic Tool Registration for SPAs

Single-page apps should register and unregister tools as the user navigates. Only expose tools that are relevant to the current view — this helps agents understand what's possible right now.

\`\`\`js
// When user navigates to search page
function onSearchPageMount() {
  registerSearchTools();
  unregisterResultsTools();
}

// When user navigates to results page
function onResultsPageMount() {
  unregisterSearchTools();
  registerResultsTools();
}
\`\`\`

Track registration state to avoid double-registering:

\`\`\`js
const registered = { search: false, filters: false };

function registerSearchTools() {
  if (!registered.search) {
    navigator.modelContext.registerTool(searchTool);
    registered.search = true;
  }
}

function unregisterSearchTools() {
  if (registered.search) {
    navigator.modelContext.unregisterTool("search_flights");
    registered.search = false;
  }
}
\`\`\`

## Error Handling Patterns

Robust error handling is critical for WebMCP tools. Agents can't debug exceptions — they need clear error strings to decide what to do next.

### DOM element not found

```js
execute: ({ element_id }) => {
  const el = document.getElementById(element_id);
  if (!el) {
    return `Error: Element "${element_id}" not found on the page. The page may have changed — try list_elements to see current elements.`;
  }
  el.click();
  return `Clicked element "${element_id}".`;
}
```

### Network failure

```js
execute: async ({ query }) => {
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      return `Error: Search API returned ${response.status}. Try again later.`;
    }
    const data = await response.json();
    return `Found ${data.results.length} results for "${query}".`;
  } catch (error) {
    return `Error: Network request failed (${error.message}). Check your connection and try again.`;
  }
}
```

### Invalid state

```js
execute: ({ item_id }) => {
  const item = getItem(item_id);
  if (!item) {
    return `Error: No item with ID ${item_id}. Use list_items to see available items.`;
  }
  if (item.status === "shipped") {
    return `Error: Cannot cancel item "${item.name}" — it has already shipped.`;
  }
  cancelItem(item_id);
  return `Cancelled item "${item.name}".`;
}
```

### Timeout

```js
execute: async (params) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Operation timed out after 10 seconds")), 10000)
  );
  try {
    const result = await Promise.race([processData(params), timeout]);
    return `Processed successfully: ${result}`;
  } catch (error) {
    return `Error: ${error.message}. The operation may be too large — try with fewer items.`;
  }
}
```

### Key principles

1. **Never throw from `execute`** — always return an error string. Unhandled exceptions crash the tool and give the agent no useful information.
2. **Include the tool's name or context** in error messages so agents can identify which tool failed.
3. **Suggest a recovery action** — tell the agent what to try next (e.g., "Use list_items to see available items").
4. **Distinguish user errors from system errors** — "Invalid ID" vs. "Network request failed" helps agents decide whether to retry or ask the user.

---

## Common Patterns and Tips

### Reuse existing app logic
The biggest win of WebMCP is code reuse. If your app already has a \`addItem()\` function called by a button click handler, your tool's \`execute\` just calls the same function. Don't rewrite logic — wrap it.

### Return actionable information
Bad: \`return "Done"\` — the agent doesn't know what happened.
Good: \`return "Added 'Buy milk' to your todo list. You now have 7 items."\` — the agent can confirm success to the user and knows the current state.

### Handle errors gracefully
\`\`\`js
execute: ({ id }) => {
  const item = findItem(id);
  if (!item) {
    return \`Error: No item found with ID \${id}. Use list_items to see available items.\`;
  }
  deleteItem(id);
  return \`Deleted item "\${item.name}".\`;
}
\`\`\`

### Use enums for constrained choices
When a parameter has a fixed set of valid values, use \`enum\` in the schema. This prevents agents from guessing wrong values:

\`\`\`js
style: {
  type: "string",
  enum: ["Classic", "Bianca", "BBQ", "Pesto"],
  description: "The pizza style to apply"
}
\`\`\`

### Use \`outputSchema\` for structured return values
When a tool returns structured data (not just a confirmation message), define an \`outputSchema\` so agents can parse the response reliably:

\`\`\`js
navigator.modelContext.registerTool({
  name: "get_cart",
  description: "Returns the current shopping cart contents and total price",
  inputSchema: { type: "object", properties: {} },
  outputSchema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            quantity: { type: "number" },
            price: { type: "number" }
          }
        }
      },
      total: { type: "number" }
    }
  },
  annotations: { readOnlyHint: "true" },
  execute: () => JSON.stringify(getCart())
});
\`\`\`
This is optional — simple tools that return text confirmations don't need it. But for tools that return data the agent will process (lists, search results, app state), \`outputSchema\` helps the agent understand the shape of the response without guessing.

### Provide state inspection tools
Give agents a way to read the current state of the app. This helps them make informed decisions:

\`\`\`js
navigator.modelContext.registerTool({
  name: "get_app_state",
  description: "Returns the current state of the application",
  inputSchema: { type: "object", properties: {} },
  annotations: { readOnlyHint: "true" },
  execute: () => JSON.stringify(getCurrentState())
});
\`\`\`

### The \`toolactivated\` event
The browser fires a \`toolactivated\` event on \`window\` just before a tool's \`execute\` function runs. This is useful for pre-validation, UI preparation, or logging — especially for form-based tools where you want to validate fields before the tool processes them:

\`\`\`js
window.addEventListener('toolactivated', ({ toolName }) => {
  if (toolName !== 'submit_form') return;
  validateForm();  // Run the same validation as human submission
});
\`\`\`

### Detect agent vs. human interaction
Form submit events include an \`agentInvoked\` property when triggered by an agent tool call. Use this to return structured results to the agent while keeping the normal UI flow for human users:

\`\`\`js
form.addEventListener('submit', (e) => {
  e.preventDefault();
  validateForm();

  if (validationErrors.length && e.agentInvoked) {
    e.respondWith(validationErrors);  // Structured errors for the agent
    return;
  }

  showConfirmation();
  if (e.agentInvoked) {
    e.respondWith("Booking confirmed.");
  }
});
\`\`\`

### Adaptive UI when an agent is connected
When WebMCP is supported and an agent is driving the interaction, you may want to adjust the UI — for example, hiding manual form inputs and using more space to display results:

\`\`\`js
if ("modelContext" in navigator) {
  document.body.classList.add('webmcp-supported');
  // Hide manual controls, expand content area, etc.
}
\`\`\`
This is optional and depends on the use case — some apps work best with both manual and agent controls visible.

### Delegate heavy work to Web Workers
If a tool needs to perform computationally expensive operations (e.g., processing hundreds of items from a bulk import), consider delegating to a Web Worker to keep the UI responsive:

\`\`\`js
execute: async ({ items }) => {
  return new Promise((resolve) => {
    const worker = new Worker('processor.js');
    worker.postMessage(items);
    worker.onmessage = (e) => {
      updateUI(e.data.results);
      resolve(\`Processed \${e.data.results.length} items.\`);
    };
  });
}
\`\`\`
Tool calls run on the main thread by default, which ensures sequential execution and easy UI updates. Only move to workers when the operation would noticeably block the page.

### Tool discoverability
Currently, WebMCP tools are only discoverable after an agent navigates to the page — there's no built-in mechanism for agents to find which sites have tools without visiting them. Keep this in mind:
- Use clear, descriptive tool names and descriptions since agents may surface tools from multiple providers
- If you're building a PWA, installed apps may eventually declare tools available "offline" via the app manifest
- Future spec iterations may introduce manifest-based tool declarations for static discovery without page navigation
- Design your tools to work well today with page-based discovery, and they'll be ready for manifest-based discovery when it lands
