---
name: webmcp-builder
description: Guide for building WebMCP tools — client-side JavaScript tools that expose web application functionality to AI agents via the browser's navigator.modelContext API.
triggers:
  - User wants to add WebMCP tools to a web page
  - User wants to create an interactive web app with agent-accessible tools
  - User wants to build a demo or prototype using WebMCP
  - User wants to integrate a website with browser-based AI agents
  - User mentions "WebMCP", "modelContext", or "browser tools for agents"
  - User wants to make a web page controllable by an AI assistant
  - User wants to expose web app features as callable tools
  - User wants to bridge between a web UI and an AI agent
  - User wants to add structured tool contracts to a frontend
tags:
  - webmcp
  - browser-tools
  - ai-agents
  - modelContext
  - client-side
---

# WebMCP Tool Development Guide

## Overview

WebMCP is a browser API that lets web developers expose their application's functionality as "tools" — JavaScript functions with natural language descriptions and structured schemas — that AI agents, browser assistants, and assistive technologies can invoke. Think of it as turning a web page into an MCP server, but the tools run in client-side JavaScript instead of on a backend.

The key insight: WebMCP enables **collaborative, human-in-the-loop workflows** where users and agents work together within the same web interface. The user stays in control, the UI updates in real time, and the agent gets structured access to app functionality instead of having to scrape or automate the UI.

WebMCP also benefits **accessibility** — users with accessibility needs can complete tasks via conversational or agentic interfaces instead of relying solely on the accessibility tree, which many websites haven't fully implemented. See [Accessibility-Focused Tool Design](reference/examples.md#accessibility-focused-tool-design) for concrete patterns.

WebMCP aligns closely with MCP tool schemas (`name`, `description`, `inputSchema`, `execute`), so developers familiar with MCP can reuse their knowledge. The key difference: WebMCP tools run client-side in the browser, not on a backend server. The browser intermediates between the page and the agent, which allows it to enforce security policies and maintain backwards compatibility as MCP evolves. For always-on server-to-server tool access without a browser, use a traditional MCP server instead.

---

## Quick Start

Here's a minimal, complete WebMCP tool — feature detect, register, execute, and return a result:

```js
// Check if the browser supports WebMCP
if ("modelContext" in navigator) {
	navigator.modelContext.registerTool({
		name: "greet_user",
		description: "Returns a personalized greeting for the given name.",
		inputSchema: {
			type: "object",
			properties: {
				name: { type: "string", description: "The person's name" }
			},
			required: ["name"]
		},
		execute: ({ name }) => {
			document.getElementById("greeting").textContent = `Hello, ${name}!`;
			return `Greeted ${name} successfully.`;
		}
	});
}
```

This covers the four essentials: feature detection (`"modelContext" in navigator`), tool registration (`registerTool`), execution logic (update the DOM), and an informative return value. Everything below expands on this pattern.

---

## Process

### Phase 1: Understand the Requirements

Before writing any code, clarify what the web app needs to expose to agents:

1. **What actions should agents be able to perform?** List the core operations (e.g., "add item", "search", "filter results", "submit form").
2. **What data should agents be able to read?** Identify read-only queries (e.g., "get current state", "list items").
3. **Does the tool set change based on UI state?** Single-page apps may need to register/unregister tools as the user navigates between views.
4. **What user interactions need confirmation?** Destructive or irreversible actions (purchases, deletions) should use `agent.requestUserInteraction()`.

**Guiding questions to ask before coding:**
- What existing JavaScript functions already do what you need? (Wrap them — don't rewrite.)
- What's the app's framework? (Vanilla JS, React, Vue, etc. — this determines the UI sync pattern.)
- Are there form validations or business rules that tools must respect?
- What data is sensitive and should NOT be exposed as tool parameters?
- Will the app be served over HTTPS in production? (Some browsers restrict `modelContext` to secure contexts.)

### Phase 2: Design the Tools

Good WebMCP tools share these qualities:

- **Action-oriented names**: Use verb-noun format like `add_item`, `search_flights`, `set_filters`. Kebab-case (`add-item`) or snake_case (`add_item`) are both acceptable — pick one and be consistent.
- **Clear descriptions**: The description is what the agent reads to decide whether to use the tool. Be specific about what the tool does, what it returns, and any constraints.
- **Minimal required parameters**: Only mark parameters as required if the tool truly cannot function without them. Use sensible defaults for optional parameters.
- **Structured input schemas**: Use JSON Schema (`type`, `properties`, `required`, `enum`, `description`) so agents know exactly what to pass.
- **Informative return values**: Return text or structured content that tells the agent what happened. Include enough context for the agent to decide what to do next.

#### Bad vs. Good Examples

**Tool naming:**
- ❌ `data` — vague, agent can't tell what it does
- ✅ `get_cart_contents` — specific, action-oriented

**Descriptions:**
- ❌ `"Does stuff with the form"` — agent has no idea what to expect
- ✅ `"Submits the contact form with the given name, email, and message. Returns a confirmation ID or validation errors."` — agent knows inputs, outputs, and failure modes

**Parameters:**
- ❌ Requiring `user_email` and `user_location` on a search tool that doesn't need them
- ✅ Only requiring `query`, with optional `max_results` defaulting to 10

#### Tool Granularity

Balance between too many fine-grained tools and too few coarse ones:

- **Too fine**: `set_font_size`, `set_font_color`, `set_font_family` → agent needs many calls for simple tasks
- **Too coarse**: `do_everything(instructions)` → agent can't predict behavior, errors are vague
- **Right level**: `edit_design(instructions)` for creative apps, or individual CRUD tools for data apps

When in doubt, start with one tool per user-facing action (each button, form submission, or filter corresponds to a tool).

### Phase 3: Implement

#### Project Structure

WebMCP tools live in your web app's frontend code. A typical organization:

```
my-app/
├── index.html
├── style.css
├── script.js          # App logic + WebMCP tool registration
```

For larger apps, separate WebMCP code into its own module:

```
my-app/
├── index.html
├── style.css
├── script.js          # App logic
├── webmcp.ts          # WebMCP tool definitions and registration
```

#### Complete Minimal Tool

Here's a complete tool you can copy-paste as a starting point — it includes feature detection, registration, execution with error handling, and an informative return value:

```js
window.addEventListener('load', () => {
	if ("modelContext" in navigator) {
		navigator.modelContext.registerTool({
			name: "add_todo",
			description: "Add a new todo item to the list. Returns confirmation with the current item count.",
			inputSchema: {
				type: "object",
				properties: {
					text: { type: "string", description: "The text of the todo item" }
				},
				required: ["text"]
			},
			annotations: {
				readOnlyHint: false,
				idempotentHint: false
			},
			execute: ({ text }) => {
				if (!text.trim()) {
					return "Error: Todo text cannot be empty.";
				}
				addTodo(text);  // Call your existing app function
				renderTodoList();  // Update the UI
				return `Added todo: "${text}". You now have ${getTodoCount()} items.`;
			}
		});
	}
});
```

#### The WebMCP API

The API lives on `navigator.modelContext`. Always feature-detect before using it, and always do so inside a `window.addEventListener('load', ...)` callback — **never at the top level of a script**. Browser extensions and runtimes that inject `navigator.modelContext` do so during or after page load; checking too early will always find it missing.

> **⚠️ HTTP required**: `navigator.modelContext` is only available when the page is served over HTTP or HTTPS (e.g. `http://localhost:8080`). It will **not** be injected on `file://` URLs. Always run a local dev server during development.

```js
window.addEventListener('load', () => {
	if ("modelContext" in navigator) {
		// WebMCP is supported — register tools here
	}
});
```

There are two registration approaches:

**Approach 1: `provideContext` (batch registration)**

Registers all tools at once. Calling it again replaces all previously registered tools. Good for simple apps or when the full tool set is known upfront.

```js
navigator.modelContext.provideContext({
	tools: [
		{
			name: "add-todo",
			description: "Add a new todo item to the list",
			inputSchema: {
				type: "object",
				properties: {
					text: { type: "string", description: "The text of the todo item" }
				},
				required: ["text"]
			},
			execute: ({ text }, agent) => {
				addTodo(text);
				return {
					content: [
						{ type: "text", text: `Added todo: "${text}"` }
					]
				};
			}
		}
	]
});
```

**Approach 2: `registerTool` / `unregisterTool` (incremental)**

Add or remove individual tools. Better for SPAs where available tools change based on UI state.

```js
navigator.modelContext.registerTool({
	name: "search_flights",
	description: "Search for flights with the given parameters.",
	inputSchema: {
		type: "object",
		properties: {
			origin: {
				type: "string",
				description: "3-letter IATA airport code for origin",
				pattern: "^[A-Z]{3}$"
			},
			destination: {
				type: "string",
				description: "3-letter IATA airport code for destination",
				pattern: "^[A-Z]{3}$"
			}
		},
		required: ["origin", "destination"]
	},
	execute: async ({ origin, destination }) => {
		const results = await searchFlights(origin, destination);
		return `Found ${results.length} flights from ${origin} to ${destination}.`;
	}
});

// Later, when navigating away from search:
navigator.modelContext.unregisterTool("search_flights");
```

#### Tool Definition Shape

Each tool object has these fields:

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique identifier for the tool |
| `description` | Yes | Natural language description of what the tool does |
| `inputSchema` | Yes | JSON Schema object describing the parameters |
| `execute` | Yes | Function `(params, agent) => result` that implements the tool |
| `outputSchema` | No | JSON Schema describing the return value structure |
| `annotations` | No | Hints like `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint` |

#### The `execute` Function

The execute function receives two arguments:

1. **`params`**: An object with the parameters the agent passed, matching your `inputSchema`.
2. **`agent`**: An interface for interacting with the agent during execution.

It can be synchronous or async (return a Promise). The return value is sent back to the agent.

**Return formats:**

```js
// Simple text response
execute: ({ query }) => {
	return `Found 5 results for "${query}"`;
}

// Structured content response (MCP-aligned)
execute: ({ name }) => {
	return {
		content: [
			{ type: "text", text: `Item "${name}" created successfully.` }
		]
	};
}

// Return data for the agent to process
execute: () => {
	return JSON.stringify(getAppState());
}
```

#### Recommended Return Format

**✅ Recommended: always include a `success` field and the new device state.**

Returning a plain string (e.g. `"Light turned on."`) is valid, but some agents treat an
ambiguous response as a potential error. To give the agent unambiguous confirmation,
return a JSON-stringified object with:

- **`success: true/false`** — explicit boolean indicating whether the action succeeded.
- **`message`** — human-readable description of what happened.
- **`new_state`** — the updated state of the device(s) affected by the call, so the agent can verify the outcome without a follow-up `get_*` call.
- On failure, include **`error`** instead of `new_state`.

```js
// ✅ Success — clear confirmation + updated state
execute: ({ light_id, action }) => {
	state.lights[light_id].on = (action === 'on');
	renderLight(light_id);
	return JSON.stringify({
		success: true,
		message: `${light_id} light turned ${action}.`,
		new_state: { light_id, on: state.lights[light_id].on },
	});
}

// ✅ Failure — explicit flag so the agent knows to retry or report
execute: ({ light_id, action }) => {
	if (!VALID_IDS.includes(light_id)) {
		return JSON.stringify({
			success: false,
			error: `Unknown light_id "${light_id}". Valid options: ${VALID_IDS.join(', ')}.`,
		});
	}
	// ...
}
```

For tools that affect multiple devices at once (e.g. a scene), include the full
post-action snapshot in `new_state` so the agent doesn't need a separate status read.

#### User Interaction During Tool Execution

For actions that need user confirmation, use `agent.requestUserInteraction()`:

```js
execute: async ({ product_id }, agent) => {
	const confirmed = await agent.requestUserInteraction(async () => {
		return new Promise((resolve) => {
			const ok = confirm(`Purchase product ${product_id}?`);
			resolve(ok);
		});
	});

	if (!confirmed) {
		throw new Error("Purchase cancelled by user.");
	}

	executePurchase(product_id);
	return `Product ${product_id} purchased.`;
}
```

#### Annotations

Annotations help agents understand tool behavior without reading the implementation:

```js
annotations: {
	readOnlyHint: true,    // Tool only reads data, no side effects
	destructiveHint: false, // Tool doesn't delete or irreversibly modify data
	idempotentHint: true,  // Calling multiple times with same args has same effect
	openWorldHint: false   // Tool doesn't interact with external systems
}
```

> **⚠️ Annotation values must be booleans** (`true`/`false`), not strings (`"true"`/`"false"`). Passing strings will cause a runtime validation error (`expected: "boolean"`, `code: "invalid_type"`).


### Advanced Patterns

For advanced implementation details, please see [Advanced Patterns](reference/advanced_patterns.md). Topics include:
- Choosing a UI Synchronization pattern (Direct DOM, Custom Events, Framework State) — with a decision guide
- Dynamic Tool Registration for SPAs
- Error Handling Patterns (DOM not found, network failure, invalid state, timeout)
- Useful tips (Web Workers, `toolactivated` event, returning `outputSchema`)

### Phase 4: Testing and Validation

#### Manual Testing Checklist

Verify these before moving to automated evals:

- [ ] **Feature detection**: App works normally when `navigator.modelContext` is undefined (browsers without WebMCP support)
- [ ] **HTTP server**: App is served over `http://` or `https://`, not `file://`
- [ ] **Load event**: Tool registration is deferred to `window.addEventListener('load', ...)`
- [ ] **Annotation types**: All annotation values are booleans (`true`/`false`), not strings
- [ ] **Tool schema validation**: `inputSchema` accurately describes what `execute` expects — mismatches cause agent errors
- [ ] **UI sync**: After each tool call, the UI visually reflects the change
- [ ] **Return values**: Every `execute` returns a JSON object with `success: true/false`, a `message`, and `new_state` (or `error`) so the agent gets unambiguous confirmation — avoid returning plain strings that agents may misinterpret as errors
- [ ] **Error handling**: Tools return `{ success: false, error: "..." }` for invalid inputs, not unhandled exceptions or bare error strings
- [ ] **Edge cases**: Test with missing optional parameters, empty strings, boundary values
- [ ] **Optional parameter defaults**: Call tools with only required parameters — defaults should apply correctly
- [ ] **Destructive actions**: Confirm `requestUserInteraction()` is used for purchases, deletions, etc.
- [ ] **Multiple calls**: Calling the same tool twice in a row doesn't break state

#### Automated Evaluation

Use the WebMCP Evals CLI to test tool selection against AI agents. Write eval cases with natural language prompts and expected tool calls, then run them against your tool schema. For detailed setup and usage, see [Testing WebMCP Tools](reference/testing.md).

---

## Reference

### Building
- [Advanced WebMCP Patterns](reference/advanced_patterns.md) — UI synchronization, SPA routing, error handling, patterns & tips
- [Simple vanilla JS examples](reference/examples.md) — Pizza maker, restaurant booking, complete end-to-end example, accessibility patterns
- [React/TypeScript example](reference/react_example.md) — Flight search app with dynamic tool registration, complete component example

### Quality
- [Testing guide](reference/testing.md) — Manual checklist and automated evaluation with the Evals CLI
- [Security & privacy guide](reference/security.md) — Prompt injection, output injection walkthrough, over-parameterization, and a pre-ship checklist

### Advanced
- [Service worker patterns](reference/service_workers.md) — Background tool execution, session management, discovery, and routing
