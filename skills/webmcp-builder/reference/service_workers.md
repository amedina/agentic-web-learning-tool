# WebMCP Service Worker Patterns

Service workers allow WebMCP tools to run **in the background** — without requiring the user to have the site open in a tab. This unlocks scenarios where agents use tools from sites the user isn't currently browsing.

## Table of Contents
- [When to Use Service Workers](#when-to-use-service-workers)
- [Registering Tools in a Service Worker](#registering-tools-in-a-service-worker)
- [Background Execution (No UI)](#background-execution-no-ui)
- [Opening a Window for User Interaction](#opening-a-window-for-user-interaction)
- [Session Management](#session-management)
- [Discovery and Installation](#discovery-and-installation)
- [Routing: Page vs. Service Worker](#routing-page-vs-service-worker)

---

## When to Use Service Workers

Use service worker-based WebMCP tools when:

- The tool doesn't need a visible UI (e.g., adding a todo item, syncing data)
- You want tools available even when the user hasn't navigated to your site
- The workflow involves background operations like API calls, data syncing, or notifications
- You're building a PWA and want tools accessible "offline" from the browser

Stick with page-based tools when:

- The tool needs to update visible UI in real time
- The user is actively interacting with the page
- The tool relies on DOM state or framework components

---

## Registering Tools in a Service Worker

Service workers have access to an `agent` object in their global scope. Use it to register tools when the worker activates:

```js
// service-worker.js
self.agent.provideContext({
  tools: [
    {
      name: "add-todo",
      description: "Add a new item to the user's todo list",
      inputSchema: {
        type: "object",
        properties: {
          item: { type: "string", description: "The task to add" },
          priority: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "Priority level (defaults to medium)"
          }
        },
        required: ["item"]
      },
      async execute({ item, priority = "medium" }) {
        await addToLocalStore(item, priority);
        await syncWithBackend(item, priority);
        self.registration.showNotification(`Todo added: "${item}"`);
        return `Added "${item}" with ${priority} priority.`;
      }
    }
  ]
});
```

This works the same as `navigator.modelContext.provideContext()` on a page — the API shape is identical. You can also use `self.agent.registerTool()` and `self.agent.unregisterTool()` for incremental registration.

---

## Background Execution (No UI)

The simplest service worker pattern handles tool calls entirely in the background — no browser window needed:

```js
async execute({ item, priority }) {
  // 1. Update local storage
  const todos = await caches.open("todos");
  await todos.put(item, new Response(JSON.stringify({ item, priority, done: false })));

  // 2. Sync with backend if online
  if (navigator.onLine) {
    await fetch("/api/todos", {
      method: "POST",
      body: JSON.stringify({ item, priority })
    });
  }

  // 3. Notify the user via system notification
  self.registration.showNotification(`Added: "${item}"`);

  return `Todo "${item}" added successfully.`;
}
```

This is ideal for quick operations where the user just needs confirmation that something happened.

---

## Opening a Window for User Interaction

Some tools need user input during execution — for example, payment confirmation. The service worker can open a browser window and communicate with it via `postMessage`:

```js
async execute({ items }, clientInfo) {
  // Build the cart in the background
  const cart = await buildCart(items);

  // Open a checkout window for payment
  const checkoutWindow = await self.clients.openWindow(
    `/checkout?cart=${cart.id}`
  );

  // Wait for the checkout page to signal completion
  return new Promise((resolve) => {
    self.addEventListener("message", function handler(event) {
      if (event.data.type === "checkout-complete" && event.data.cartId === cart.id) {
        self.removeEventListener("message", handler);
        resolve(`Order confirmed. Order ID: ${event.data.orderId}`);
      }
    });
  });
}
```

On the checkout page:

```js
// checkout/script.js
document.getElementById("confirm-btn").addEventListener("click", async () => {
  const orderId = await processPayment();

  // Signal the service worker
  const sw = await navigator.serviceWorker.ready;
  sw.active.postMessage({
    type: "checkout-complete",
    cartId: getCartIdFromURL(),
    orderId
  });
});
```

This pattern keeps sensitive operations (payment, deletion confirmations) in a visible UI while the agent handles the tedious parts (cart building, product search) in the background.

---

## Session Management

When multiple agent conversations use the same service worker simultaneously, you need to keep their state separate. The `execute` function receives `clientInfo` with a `sessionId`:

```js
const carts = new Map();

self.agent.provideContext({
  tools: [
    {
      name: "add-to-cart",
      description: "Add an item to the shopping cart",
      inputSchema: {
        type: "object",
        properties: {
          itemId: { type: "string", description: "Product ID to add" },
          quantity: { type: "number", description: "Number of items" }
        },
        required: ["itemId"]
      },
      async execute({ itemId, quantity = 1 }, clientInfo) {
        // Each conversation gets its own cart
        if (!carts.has(clientInfo.sessionId)) {
          carts.set(clientInfo.sessionId, []);
        }
        const cart = carts.get(clientInfo.sessionId);
        cart.push({ itemId, quantity });
        return `Added ${quantity}x ${itemId}. Cart now has ${cart.length} items.`;
      }
    }
  ]
});
```

Without session management, two conversations shopping on the same site would share a single cart — leading to confused agents and frustrated users.

---

## Discovery and Installation

For agents to use a service worker's tools, the worker must first be installed. There are two paths:

**Path 1: User visits the site (standard)**

The user navigates to your site, which registers the service worker normally:

```js
// On your page
navigator.serviceWorker.register("/service-worker.js");
```

After this visit, the service worker persists and its tools remain available to agents even when the tab is closed.

**Path 2: JIT installation via app manifest (future)**

A web app manifest can declare a service worker for just-in-time installation without requiring page navigation:

```json
{
  "name": "My Todo App",
  "description": "A todo list with AI-accessible tools for task management",
  "start_url": "/",
  "serviceworker": {
    "src": "service-worker.js",
    "scope": "/",
    "use_cache": false
  }
}
```

An agent could discover this manifest (via search, directory, or recommendation) and install the service worker directly. The browser would prompt the user for permission before installation.

> **Note**: JIT installation and discovery mechanisms are still being defined in the spec. Design your service worker tools to work with standard installation today, and they'll be ready for JIT installation when it lands.

---

## Routing: Page vs. Service Worker

When both a page and its service worker register tools, the browser needs to decide where to route tool calls. The key rules:

| Scenario | Routing |
|----------|---------|
| Only page has tools | All calls go to the page |
| Only service worker has tools | All calls go to the service worker |
| Both have tools, different names | Each call goes to whichever registered that tool name |
| Both have the same tool name | Agent/browser decides based on context (e.g., if the page is open and active, prefer the page) |

**Best practice**: Avoid registering the same tool name in both your page and service worker. If you need both, use the page tools for UI-interactive operations and service worker tools for background operations, with distinct names:

```js
// Page: UI-interactive version
navigator.modelContext.registerTool({
  name: "add-todo-interactive",
  description: "Add a todo with visual confirmation in the UI",
  // ...
});

// Service worker: background version
self.agent.registerTool({
  name: "add-todo-background",
  description: "Add a todo silently in the background",
  // ...
});
```

A single tool call is never routed to more than one provider, even if multiple providers have tools with the same name.
