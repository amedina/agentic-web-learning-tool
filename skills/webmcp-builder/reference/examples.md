# WebMCP Vanilla JavaScript Examples

These examples show real-world patterns for adding WebMCP tools to simple web apps using plain HTML/CSS/JS.

## Table of Contents
- [Pizza Maker — Interactive visual app with multiple tools](#pizza-maker)
- [Restaurant Booking — Form-based tool with validation](#restaurant-booking)
- [Complete End-to-End Example](#complete-end-to-end-example)
- [Accessibility-Focused Tool Design](#accessibility-focused-tool-design)
- [Troubleshooting & FAQ](#troubleshooting--faq)

---

## Pizza Maker

A visual pizza builder where agents can set size, style, add/remove toppings, and share the result. Demonstrates: multiple tools, enums, optional parameters with defaults, state inspection, and conditional feature detection.

### Key patterns

**Feature detection and conditional UI**: When WebMCP is supported, the app hides manual buttons and lets the agent drive:

```js
if ("modelContext" in navigator) {
  // Optionally hide manual controls when agent is available
  document.body.classList.add('webmcp-supported');

  // Register all tools...
}
```

**Tool with inference logic**: The size tool accepts either a direct size or a number of people and infers the right size:

```js
navigator.modelContext.registerTool({
  name: 'set_pizza_size',
  description: 'Set the pizza size directly or infer it based on the number of people.',
  inputSchema: {
    type: 'object',
    properties: {
      size: {
        type: 'string',
        enum: ['Small', 'Medium', 'Large', 'Extra Large'],
        description: 'The specific size name.',
      },
      number_of_persons: {
        type: 'number',
        description: 'The number of people eating to help infer the correct size.',
      },
    },
  },
  execute: ({ size, number_of_persons }) => {
    let finalSize = size;

    if (!finalSize && number_of_persons) {
      if (number_of_persons <= 2) finalSize = 'Small';
      else if (number_of_persons <= 4) finalSize = 'Medium';
      else if (number_of_persons <= 6) finalSize = 'Large';
      else finalSize = 'Extra Large';
    }

    if (finalSize && sizes[finalSize]) {
      changeSize(sizes[finalSize], finalSize);
      return `Set pizza size to ${finalSize}${number_of_persons ? ` for ${number_of_persons} people` : ''}.`;
    }

    return `Could not determine a valid size. Please specify a size or number of guests.`;
  },
});
```

Notice: neither parameter is required — the tool is flexible about how the agent specifies the size.

**Enum-constrained topping tool with defaults**:

```js
navigator.modelContext.registerTool({
  name: 'add_topping',
  description: 'Add one or more toppings to the pizza',
  inputSchema: {
    type: 'object',
    properties: {
      topping: {
        type: 'string',
        enum: ['🍕', '🍄', '🌿', '🍍', '🫑', '🥓', '🧅', '🫒', '🌽', '🌶️', '🐑'],
      },
      size: { type: 'string', enum: ['Small', 'Medium', 'Large', 'Extra Large'] },
      count: {
        type: 'integer',
        minimum: 1,
        description: 'Number of toppings to add',
      },
    },
    required: ['topping'],
  },
  execute: ({ topping, size = 'Medium', count = 5 }) => {
    addTopping(topping, size, count);
    return `Added ${count} ${topping} topping(s)`;
  },
});
```

**Management tool with action enum**: Groups related operations under one tool:

```js
navigator.modelContext.registerTool({
  name: 'manage_pizza',
  description: 'Manage pizza state',
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['remove_last', 'reset'] },
    },
    required: ['action'],
  },
  execute: ({ action }) => {
    if (action === 'remove_last') {
      removeLastTopping();
      return 'Removed last topping';
    } else if (action === 'reset') {
      resetPizza();
      return 'Reset pizza';
    }
    return 'Unknown action';
  },
});
```

**Sharing tool with no parameters**:

```js
navigator.modelContext.registerTool({
  name: 'share_pizza',
  description: 'Get a shareable URL for the current pizza creation',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  execute: () => {
    const url = sharePizza(/* agentInvoked */ true);
    return `Share URL: ${url}`;
  },
});
```

### Takeaways from this example

1. **Wrap existing functions** — every tool calls helpers (`changeSize`, `addTopping`, `resetPizza`) that already exist for the manual UI.
2. **Use enums liberally** — toppings, sizes, styles, and actions are all constrained to valid values.
3. **Provide sensible defaults** — `size = 'Medium'` and `count = 5` so the agent doesn't have to specify everything.
4. **Return descriptive strings** — every tool tells the agent exactly what happened.

---

## Restaurant Booking

A reservation form where the agent fills in fields and submits. Demonstrates: form-based tools, validation feedback, and the `toolactivated` event.

### Key pattern: Form validation on tool activation

The app listens for the `toolactivated` event to run validation when an agent triggers the booking tool:

```js
window.addEventListener('toolactivated', ({ toolName }) => {
  if (toolName !== 'book_table_le_petit_bistro') return;
  validateForm();
});
```

### Key pattern: Returning validation errors to the agent

When the form has validation errors, they're collected and returned to the agent so it can correct its input:

```js
form.addEventListener('submit', function (e) {
  e.preventDefault();
  validateForm();

  if (formValidationErrors.length) {
    if (e.agentInvoked) {
      // Return structured error info so the agent knows what to fix
      e.respondWith(formValidationErrors);
    }
    return;
  }

  showModal();

  if (e.agentInvoked) {
    // Return the confirmation text to the agent
    e.respondWith(modalDetails.textContent);
  }
});
```

The validation errors are structured objects with field name, current value, and error message — giving the agent enough context to retry with corrected values:

```js
formValidationErrors.push({
  field: input.name,
  value: input.value,
  message: errorText,  // e.g., "Phone number must be at least 10 digits"
});
```

### Takeaways from this example

1. **Leverage existing form validation** — don't rewrite validation logic for the agent; reuse what the form already does.
2. **Return structured errors** — tell the agent which field failed and why, so it can self-correct.
3. **Use `agentInvoked` to distinguish** — the same submit handler works for both human and agent submissions.
4. **The `toolactivated` event** — lets you run setup/validation code before the tool executes.

---

## Complete End-to-End Example

A single, complete, runnable HTML file showing a WebMCP-enabled task list app from start to finish. Copy this file, open it in a WebMCP-capable browser, and an agent can immediately add, complete, and list tasks.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>WebMCP Task List</title>
  <style>
    body { font-family: sans-serif; max-width: 600px; margin: 2rem auto; }
    .done { text-decoration: line-through; color: #888; }
    ul { list-style: none; padding: 0; }
    li { padding: 0.4rem 0; }
  </style>
</head>
<body>
  <h1>Task List</h1>
  <ul id="tasks"></ul>
  <input id="input" placeholder="New task..." />
  <button id="add-btn">Add</button>

  <script>
    const tasks = [];
    const taskList = document.getElementById("tasks");
    const input = document.getElementById("input");

    function render() {
      taskList.innerHTML = "";
      tasks.forEach((t, i) => {
        const li = document.createElement("li");
        li.textContent = `${t.done ? "✅" : "⬜"} ${t.text}`;
        if (t.done) li.classList.add("done");
        taskList.appendChild(li);
      });
    }

    function addTask(text) {
      tasks.push({ text, done: false });
      render();
    }

    function completeTask(index) {
      if (index < 0 || index >= tasks.length) return false;
      tasks[index].done = true;
      render();
      return true;
    }

    // Manual UI
    document.getElementById("add-btn").addEventListener("click", () => {
      if (input.value.trim()) { addTask(input.value.trim()); input.value = ""; }
    });

    // WebMCP tools — feature detect first
    if ("modelContext" in navigator) {
      navigator.modelContext.provideContext({
        tools: [
          {
            name: "add_task",
            description: "Add a new task to the task list.",
            inputSchema: {
              type: "object",
              properties: {
                text: { type: "string", description: "The task description" }
              },
              required: ["text"]
            },
            annotations: { readOnlyHint: "false", idempotentHint: "false" },
            execute: ({ text }) => {
              addTask(text);
              return `Added task: "${text}". You now have ${tasks.length} task(s).`;
            }
          },
          {
            name: "complete_task",
            description: "Mark a task as done by its position (0-based index).",
            inputSchema: {
              type: "object",
              properties: {
                index: { type: "number", description: "0-based index of the task to complete" }
              },
              required: ["index"]
            },
            annotations: { readOnlyHint: "false", destructiveHint: "false", idempotentHint: "true" },
            execute: ({ index }) => {
              if (completeTask(index)) {
                return `Completed task ${index}: "${tasks[index].text}".`;
              }
              return `Error: No task at index ${index}. Use list_tasks to see available tasks.`;
            }
          },
          {
            name: "list_tasks",
            description: "Returns all tasks with their status (done or not).",
            inputSchema: { type: "object", properties: {} },
            annotations: { readOnlyHint: "true" },
            execute: () => {
              if (tasks.length === 0) return "No tasks yet.";
              return tasks.map((t, i) => `${i}: [${t.done ? "done" : "todo"}] ${t.text}`).join("\n");
            }
          }
        ]
      });
    }
  </script>
</body>
</html>
```

This example demonstrates: feature detection, `provideContext` batch registration, annotations, error handling in `complete_task`, a read-only state inspection tool (`list_tasks`), and reuse of existing app functions (`addTask`, `completeTask`).

---

## Accessibility-Focused Tool Design

WebMCP enables users with accessibility needs to complete tasks via conversational or agentic interfaces. When designing tools with accessibility in mind:

**Expose actions that are hard to reach via the accessibility tree.** Many web apps have complex interactions (drag-and-drop, multi-step wizards, canvas-based UIs) that screen readers struggle with. WebMCP tools can provide direct access:

```js
navigator.modelContext.registerTool({
  name: "move_item",
  description: "Move an item to a new position in the list. Replaces drag-and-drop interaction.",
  inputSchema: {
    type: "object",
    properties: {
      item_id: { type: "string", description: "ID of the item to move" },
      new_position: { type: "number", description: "New 0-based position in the list" }
    },
    required: ["item_id", "new_position"]
  },
  annotations: { readOnlyHint: "false", idempotentHint: "true" },
  execute: ({ item_id, new_position }) => {
    const result = moveItemInList(item_id, new_position);
    if (!result.success) return `Error: ${result.error}`;
    return `Moved "${result.itemName}" to position ${new_position}.`;
  }
});
```

**Provide descriptive state tools.** Users relying on agents need tools that describe the current visual state in text:

```js
navigator.modelContext.registerTool({
  name: "describe_page",
  description: "Returns a text description of the current page state, including all visible items and their status.",
  inputSchema: { type: "object", properties: {} },
  annotations: { readOnlyHint: "true" },
  execute: () => {
    const items = getVisibleItems();
    const summary = `Page: ${document.title}. ${items.length} items visible.`;
    const details = items.map(i => `- ${i.name}: ${i.status}`).join("\n");
    return `${summary}\n${details}`;
  }
});
```

**Design principles for accessible tools:**
1. **Don't assume visual context** — tool descriptions and return values should make sense without seeing the page.
2. **Replace complex interactions** — if an action requires precise mouse control (drag, hover, canvas clicks), provide a tool equivalent.
3. **Include state in responses** — after any action, return enough context for the agent to describe the result to the user.
4. **Use `requestUserInteraction()` for confirmations** — this ensures the browser can present the confirmation in an accessible way (not just a visual modal).

---

## Troubleshooting & FAQ

### Tool registered but agent can't see it

- **Check feature detection**: Ensure you're wrapping registration in `if ("modelContext" in navigator)`. If the check fails silently, tools never register.
- **Check timing**: If tools are registered after the agent has already queried available tools, the agent may not see them. Register tools as early as possible (e.g., in `DOMContentLoaded` or component mount).
- **Check the browser**: WebMCP requires a browser that supports the `navigator.modelContext` API. As of early 2026, this is available in select browsers and behind flags in others.

### UI doesn't update after tool call

- **Missing render call**: The `execute` function must trigger a UI update. If your app uses a framework, dispatch an event or call a state setter — don't just mutate data.
- **Async timing**: If the tool returns before the UI finishes updating, the agent may report success while the user sees stale UI. Use the `dispatchAndWait` pattern (see [React example](react_example.md)) to wait for the UI to settle.
- **Check the DOM**: Open DevTools and verify the DOM actually changed. If it did but the page looks the same, it's a CSS/rendering issue, not a WebMCP issue.

### Tool works in development but not in production

- **HTTPS requirement**: Some browsers may restrict `navigator.modelContext` to secure contexts (HTTPS). Test on HTTPS or localhost.
- **Content Security Policy**: If your CSP blocks inline scripts or eval, and your tool registration is in an inline script, it won't execute. Move tool registration to an external JS file.
- **Minification issues**: Ensure your build tool isn't stripping the `navigator.modelContext` code as dead code. Feature detection with `"modelContext" in navigator` should survive minification, but verify.

### Agent calls tool with wrong parameters

- **Schema mismatch**: Double-check that `inputSchema` exactly matches what `execute` expects. Common issues: using `integer` in schema but destructuring as a string, or having a required field that `execute` doesn't use.
- **Vague descriptions**: If the agent consistently passes wrong values, improve the parameter `description` fields. Be specific: instead of `"The date"`, write `"Departure date in YYYY-MM-DD format"`.
- **Missing enums**: If a parameter has a fixed set of valid values, add `enum` to the schema. Without it, agents guess — and guess wrong.

### Error: "tool already registered"

- **Double registration**: In SPAs, components may mount/unmount multiple times. Track registration state (see [Advanced Patterns](advanced_patterns.md#dynamic-tool-registration-for-spas)) or unregister in cleanup.
- **Hot module replacement**: During development, HMR can re-execute registration code. Guard with a registration state check.
