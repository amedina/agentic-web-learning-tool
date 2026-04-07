# WebMCP with React and TypeScript

This example is based on a flight search application built with React, TypeScript, and Vite. It demonstrates dynamic tool registration/unregistration as the user navigates between views, typed tool definitions, and async UI synchronization via custom events.

## Table of Contents
- [TypeScript type declarations](#typescript-type-declarations)
- [Tool definition pattern](#tool-definition-pattern)
- [Async UI synchronization with dispatchAndWait](#async-ui-synchronization)
- [Dynamic registration per view](#dynamic-registration-per-view)
- [Registration state tracking](#registration-state-tracking)

---

## TypeScript type declarations

Extend the `Navigator` interface so TypeScript knows about `modelContext`:

```ts
declare global {
  interface Navigator {
    modelContext?: {
      registerTool: (tool: object) => void;
      unregisterTool: (name: string) => void;
    };
  }
}
```

## Tool definition pattern

Define tools as standalone objects so they can be registered/unregistered by reference:

```ts
export const listFlightsTool = {
  execute: listFlights,
  name: "listFlights",
  description: "Returns all flights available.",
  inputSchema: {},
  outputSchema: {
    type: "object",
    properties: {
      result: {
        type: "array",
        description: "The list of flights.",
        items: {
          type: "object",
          properties: {
            id: { type: "number", description: "The unique identifier for the flight." },
            airline: { type: "string", description: "The airline of the flight." },
            origin: { type: "string", description: "The origin airport." },
            destination: { type: "string", description: "The destination airport." },
            departureTime: { type: "string", description: "The departure time." },
            arrivalTime: { type: "string", description: "The arrival time." },
            duration: { type: "string", description: "The duration of the flight." },
            stops: { type: "number", description: "The number of stops." },
            price: { type: "number", description: "The price of the flight." },
          },
          required: ["id", "airline", "origin", "destination", "departureTime",
                     "arrivalTime", "duration", "stops", "price"],
        },
      },
    },
    required: ["result"],
  },
  annotations: {
    readOnlyHint: "true",
  },
};
```

Key points:
- **`outputSchema`** describes the return value structure, helping agents parse results.
- **`annotations.readOnlyHint`** tells agents this tool has no side effects.
- The `execute` function is a reference to a standalone function, keeping tool definitions clean.

## Async UI synchronization

When a tool needs to update React state (which triggers async re-renders), use a `dispatchAndWait` pattern that fires a custom event and waits for the UI to signal completion:

```ts
function dispatchAndWait(
  eventName: string,
  detail: Record<string, unknown> = {},
  successMessage: string = "Action completed successfully",
  timeoutMs: number = 5000,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const requestId = Math.random().toString(36).substring(2, 15);
    const completionEventName = `tool-completion-${requestId}`;

    const timeoutId = setTimeout(() => {
      window.removeEventListener(completionEventName, handleCompletion);
      reject(new Error(`Timed out waiting for UI to update`));
    }, timeoutMs);

    const handleCompletion = () => {
      clearTimeout(timeoutId);
      window.removeEventListener(completionEventName, handleCompletion);
      resolve(successMessage);
    };

    window.addEventListener(completionEventName, handleCompletion);

    window.dispatchEvent(new CustomEvent(eventName, {
      detail: { ...detail, requestId }
    }));
  });
}
```

Then tools use it like this:

```ts
export async function setFilters(filters: Filters): Promise<string> {
  return dispatchAndWait("setFilters", filters, "Filters successfully updated.");
}

export const setFiltersTool = {
  execute: setFilters,
  name: "setFilters",
  description: "Sets the filters for flights.",
  inputSchema: {
    type: "object",
    properties: {
      stops: {
        type: "array",
        description: "The list of stop counts to filter by.",
        items: { type: "number" },
      },
      airlines: {
        type: "array",
        description: "The list of airlines IATA codes to filter by.",
        items: { type: "string", pattern: "^[A-Z]{2}$" },
      },
      // ... more filter properties
    },
  },
  annotations: { readOnlyHint: "false" },
};
```

On the React side, a component listens for the event, updates state, and fires the completion event:

```tsx
useEffect(() => {
  const handler = (e: CustomEvent) => {
    const { requestId, ...filters } = e.detail;
    setActiveFilters(filters);
    // Signal completion after state update
    window.dispatchEvent(new Event(`tool-completion-${requestId}`));
  };
  window.addEventListener("setFilters", handler);
  return () => window.removeEventListener("setFilters", handler);
}, []);
```

## Dynamic registration per view

Register tools relevant to the current view and unregister them when leaving:

```ts
// Called when the search form mounts
export function registerFlightSearchTools() {
  const modelContext = navigator.modelContext;
  if (modelContext) {
    modelContext.registerTool(searchFlightsTool);
  }
}

// Called when the search form unmounts
export function unregisterFlightSearchTools() {
  const modelContext = navigator.modelContext;
  if (modelContext) {
    modelContext.unregisterTool(searchFlightsTool.name);
  }
}

// Called when results page mounts
export function registerFlightResultsTools() {
  const modelContext = navigator.modelContext;
  if (modelContext) {
    modelContext.registerTool(listFlightsTool);
    modelContext.registerTool(setFiltersTool);
    modelContext.registerTool(resetFiltersTool);
    modelContext.registerTool(searchFlightsTool);  // Keep search available too
  }
}
```

In React components, call these in `useEffect`:

```tsx
useEffect(() => {
  registerFlightResultsTools();
  return () => unregisterFlightResultsTools();
}, []);
```

## Registration state tracking

Prevent double-registration with a simple tracking object:

```ts
const registeredTools = {
  listFlights: false,
  setFilters: false,
  resetFilters: false,
  searchFlights: false,
};

export function registerFlightResultsTools() {
  const modelContext = navigator.modelContext;
  if (modelContext) {
    if (!registeredTools.listFlights) {
      modelContext.registerTool(listFlightsTool);
      registeredTools.listFlights = true;
    }
    if (!registeredTools.setFilters) {
      modelContext.registerTool(setFiltersTool);
      registeredTools.setFilters = true;
    }
    // ... etc
  }
}

export function unregisterFlightResultsTools() {
  const modelContext = navigator.modelContext;
  if (modelContext) {
    modelContext.unregisterTool(listFlightsTool.name);
    modelContext.unregisterTool(setFiltersTool.name);
    // ... etc

    registeredTools.listFlights = false;
    registeredTools.setFilters = false;
    // ... etc
  }
}
```

### Input validation in tools

Validate inputs and return clear error messages instead of throwing:

```ts
export async function searchFlights(params: SearchFlights): Promise<string> {
  if (!params.destination.match(/^[A-Z]{3}$/)) {
    return "ERROR: `destination` must be a 3 letter city or airport IATA code.";
  }
  if (!params.origin.match(/^[A-Z]{3}$/)) {
    return "ERROR: `origin` must be a 3 letter city or airport IATA code.";
  }
  return dispatchAndWait("searchFlights", params, "A new flight search was started.");
}
```

## Complete Component Example

Here's a complete, self-contained React component that ties together all the patterns above — TypeScript declarations, tool registration in `useEffect`, event-based UI sync with `dispatchAndWait`, and cleanup on unmount:

```tsx
// TaskManager.tsx — Complete WebMCP-enabled React component
import { useEffect, useState, useCallback } from "react";

// --- Type declarations ---
declare global {
  interface Navigator {
    modelContext?: {
      registerTool: (tool: object) => void;
      unregisterTool: (name: string) => void;
    };
  }
}

interface Task {
  id: number;
  text: string;
  done: boolean;
}

// --- dispatchAndWait helper ---
function dispatchAndWait(
  eventName: string,
  detail: Record<string, unknown> = {},
  successMessage: string = "Action completed successfully",
  timeoutMs: number = 5000
): Promise<string> {
  return new Promise((resolve, reject) => {
    const requestId = Math.random().toString(36).substring(2, 15);
    const completionEvent = `tool-completion-${requestId}`;

    const timeoutId = setTimeout(() => {
      window.removeEventListener(completionEvent, handleCompletion);
      reject(new Error("Timed out waiting for UI to update"));
    }, timeoutMs);

    const handleCompletion = () => {
      clearTimeout(timeoutId);
      window.removeEventListener(completionEvent, handleCompletion);
      resolve(successMessage);
    };

    window.addEventListener(completionEvent, handleCompletion);
    window.dispatchEvent(new CustomEvent(eventName, {
      detail: { ...detail, requestId }
    }));
  });
}

// --- Tool execute functions ---
async function addTaskExecute({ text }: { text: string }): Promise<string> {
  if (!text || !text.trim()) return "Error: task text cannot be empty.";
  return dispatchAndWait("webmcp-add-task", { text: text.trim() }, `Added task: "${text.trim()}".`);
}

async function completeTaskExecute({ id }: { id: number }): Promise<string> {
  if (typeof id !== "number") return "Error: id must be a number.";
  return dispatchAndWait("webmcp-complete-task", { id }, `Completed task ${id}.`);
}

function listTasksExecute(): string {
  // Read directly from a shared ref or DOM — here we use a custom event with sync response
  const el = document.getElementById("task-data");
  return el?.textContent || "No tasks found.";
}

// --- Tool definitions ---
const addTaskTool = {
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
  execute: addTaskExecute
};

const completeTaskTool = {
  name: "complete_task",
  description: "Mark a task as done by its numeric ID.",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "number", description: "The task ID to mark as complete" }
    },
    required: ["id"]
  },
  annotations: { readOnlyHint: "false", idempotentHint: "true" },
  execute: completeTaskExecute
};

const listTasksTool = {
  name: "list_tasks",
  description: "Returns all tasks with their ID, text, and completion status.",
  inputSchema: { type: "object", properties: {} },
  annotations: { readOnlyHint: "true" },
  execute: listTasksExecute
};

// --- React component ---
export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [nextId, setNextId] = useState(1);

  // Listen for WebMCP tool events
  useEffect(() => {
    const handleAdd = (e: Event) => {
      const { text, requestId } = (e as CustomEvent).detail;
      setTasks(prev => [...prev, { id: nextId, text, done: false }]);
      setNextId(n => n + 1);
      window.dispatchEvent(new Event(`tool-completion-${requestId}`));
    };

    const handleComplete = (e: Event) => {
      const { id, requestId } = (e as CustomEvent).detail;
      setTasks(prev => prev.map(t => t.id === id ? { ...t, done: true } : t));
      window.dispatchEvent(new Event(`tool-completion-${requestId}`));
    };

    window.addEventListener("webmcp-add-task", handleAdd);
    window.addEventListener("webmcp-complete-task", handleComplete);
    return () => {
      window.removeEventListener("webmcp-add-task", handleAdd);
      window.removeEventListener("webmcp-complete-task", handleComplete);
    };
  }, [nextId]);

  // Register/unregister WebMCP tools
  useEffect(() => {
    const mc = navigator.modelContext;
    if (!mc) return;

    mc.registerTool(addTaskTool);
    mc.registerTool(completeTaskTool);
    mc.registerTool(listTasksTool);

    return () => {
      mc.unregisterTool("add_task");
      mc.unregisterTool("complete_task");
      mc.unregisterTool("list_tasks");
    };
  }, []);

  return (
    <div>
      <h2>Tasks</h2>
      {/* Hidden element for list_tasks to read from */}
      <span id="task-data" style={{ display: "none" }}>
        {tasks.length === 0
          ? "No tasks yet."
          : tasks.map(t => `${t.id}: [${t.done ? "done" : "todo"}] ${t.text}`).join("\n")}
      </span>
      <ul>
        {tasks.map(t => (
          <li key={t.id} style={{ textDecoration: t.done ? "line-through" : "none" }}>
            {t.text}
            {!t.done && <button onClick={() => setTasks(prev => prev.map(x => x.id === t.id ? { ...x, done: true } : x))}>✓</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

This component demonstrates: TypeScript type declarations, `dispatchAndWait` for async UI sync, tool registration/unregistration in `useEffect` with cleanup, input validation in execute functions, and a read-only tool that reads from the DOM.

## Takeaways

1. **Separate WebMCP code into its own module** (`webmcp.ts`) — keeps tool definitions clean and testable.
2. **Use `dispatchAndWait`** to bridge between WebMCP tools and React's async state updates.
3. **Register/unregister tools per view** — agents only see tools relevant to the current UI state.
4. **Track registration state** to avoid double-registering tools in SPAs with complex navigation.
5. **Define `outputSchema`** when tools return structured data — helps agents parse and use the results.
6. **Validate inputs in the execute function** and return error strings rather than throwing exceptions.
