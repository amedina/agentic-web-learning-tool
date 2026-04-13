# **🦉 Agentic Web Learning Tool (AWL)**

**An open-source Chrome Extension for learning, exploring, and experimenting with the technologies of the Agentic Web.**

The web is undergoing a paradigm shift. AI agents are emerging as a new class of user — autonomous, goal-driven, and capable of acting on behalf of people to plan, coordinate, and execute complex tasks. This transition introduces a wave of new technologies, protocols, and challenges that web developers need to understand.

AWL is a hands-on learning companion built to help you navigate this shift. It provides interactive environments where you can experiment with [MCP](https://modelcontextprotocol.io/) servers, discover a page's [WebMCP](https://developer.chrome.com/blog/webmcp-epp) tools, test Chrome's [Built-in AI APIs](https://developer.chrome.com/docs/ai/built-in), and see how AI agents interact with the browser — all from within Chrome, alongside the web pages you're already working with.

---

## **The Agentic Web**

We're at the transition point between the web as we know it and an **Agentic Web** where websites evolve from single-interface entities serving HTML to humans, into **dual-interface platforms** that also expose structured context and capabilities to AI agents via standardized protocols.

This landscape is complex and fast-moving. It spans new platform capabilities (agentic browsers, built-in AI), new infrastructure (MCP, agent-to-agent protocols, development frameworks), trust and safety challenges (prompt injection, agent identity, privacy), and entirely new economic models.

AWL is designed to make this landscape concrete for developers who are wrapping their heads around web development in the agentic AI era, giving them a structured way to learn key technologies by interacting with them directly.

### **Who is AWL for?**

- **Web developers** looking to understand how to make their sites and apps agent-ready.  
- **Researchers and engineers** exploring how LLMs interact with browser environments through protocols like MCP.  
- **Learners** seeking a guided, hands-on way to grasp the scope and components of the Agentic Web.

---

## **What You Can Do with AWL**

### **💬 Chat with AI Models in the Browser**

AWL provides a side-panel chat interface where you can converse with configurable AI models — both cloud-hosted foundation models and Chrome's on-device Gemini Nano — while giving those models the ability to **act**: reading web pages, calling browser APIs, invoking remote MCP servers, and executing automation scripts, all from within the browser tab you're already looking at.

Through the chat interface AWL orchestrates the interaction of AI agents with web content, making every action fully transparent. Tool invocations render as expandable cards showing input arguments, JSON responses, and execution timing. Reasoning-capable models display their chain-of-thought before answering.

| Provider | Models |
| :---- | :---- |
| Anthropic | Claude family |
| Google | Gemini family |
| OpenAI | GPT family |
| Chrome Built-in | Gemini Nano (on-device) |

### **🔌 Connect to and Inspect MCP Servers**

The [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) is the emerging standard for how AI agents connect to external systems. AWL lets you:

- **Connect to any MCP server** via SSE, Streamable HTTP, or Stateless HTTP — with optional OAuth, custom headers, and domain filtering  
- **Inspect server capabilities** — browse discovered tools, view their schemas, and understand what each server exposes  
- **Test tools manually** — execute any registered tool with custom inputs and see raw JSON results, independent of the chat flow  
- **Debug MCP communication** — a real-time event log shows tool calls, registrations, and transport-level messages as they happen

This gives you direct visibility into the layer of communication that powers agent-server interactions — helping you understand MCP in practice, not just in theory.

### **🌐 Explore WebMCP — How Pages Expose Tools to Agents**

[WebMCP](https://developer.chrome.com/blog/webmcp-epp) enables web pages to register tools on `navigator.modelContext`, making page-level functionality discoverable and callable by AI agents. AWL lets you explore this concept hands-on:

- **Discover page-registered tools** — see what tools a WebMCP-enabled page exposes to agents  
- **Author custom WebMCP scripts** — use the built-in code editor (with syntax highlighting and live validation) to create your own tools that agents can call on specific pages  
- **Understand the tool execution flow** — watch how requests travel from the agent, through the extension's service worker, into the content script, and down to the page context where the tool runs

This is where the "websites as first-class citizens of the Agentic Web" concept becomes tangible — you can see exactly how a page communicates its capabilities to an AI agent.

### **🧪 Experiment with Chrome's Built-in AI APIs**

Chrome is bringing on-device AI capabilities directly into the browser. AWL provides sandboxed **API Playgrounds** where you can experiment with each API in isolation — learning parameters, observing behavior, and understanding what's possible before writing production code:

- **Prompt Lab** — free-form prompting against Gemini Nano (Prompt API)  
- **Writer's Studio** — content generation and refinement (Writer & Rewriter APIs)  
- **Summarization Station** — text summarization with configurable strategies (Summarizer API)  
- **Polyglot Panel** — translation and language detection (Translator & Language Detector APIs)  
- **Proofreader** — spelling and grammar checking (Proofreader API)

### **🔀 Build Workflows with the Built-in AI Workflow Composer**

Go beyond individual APIs. The **Workflow Composer** is a visual, node-based editor where you can chain multiple Built-in APIs together into agentic workflows:

- Drag nodes onto a canvas, connect them with edges, and configure parameters  
- All processing happens **locally on your machine** — no data leaves the browser  
- Completed workflows are automatically exposed as **callable MCP tools**, bridging the visual editor and the chat interface

This lets you prototype multi-step AI pipelines and understand how on-device capabilities compose together — before writing a single line of production code.

### **🛠️ Debug with the AWL DevTools Panel**

A dedicated **AWL** tab in Chrome DevTools that gives you deep visibility into the agentic layer:

- **Tool List** — all MCP tools registered for the current tab, with full JSON schema details  
- **Run Tool** — manually execute any tool with custom input parameters  
- **Events** — real-time log of MCP communication (tool calls, results, registrations, transport messages)

### **📝 Create Prompt Commands**

Define custom slash commands — reusable prompt shortcuts for the chat interface that speed up common interactions with the agent.

---

## **Learning Areas**

AWL unifies tools from multiple sources under a single MCP-based interface, giving you visibility into how agents discover and use capabilities from different layers of the web stack:

| Tool Source | What it teaches you |
| :---- | :---- |
| **Chrome API tools** | How agents interact with browser capabilities (DOM, tabs, history, storage) |
| **WebMCP page tools** | How websites expose functionality to agents via `navigator.modelContext` |
| **External MCP servers** | How agents connect to remote services via standardized protocols |
| **Workflow tools** | How composed AI pipelines become callable capabilities |
| **Custom user scripts** | How to author your own agent-callable tools |

---

## **Getting Started**

### **Prerequisites**

- **Git**  
- **Node.js** via [nvm](https://github.com/nvm-sh/nvm) (the repo provides an `.nvmrc` with the required version)  
- **pnpm** \>= 10

### **1\. Clone and set up Node**

```shell
git clone https://github.com/amedina/agentic-web-learning-tool.git
cd agentic-web-learning-tool

nvm install
nvm use
```

### **2\. Install pnpm**

```shell
npm install -g pnpm
pnpm -v   # verify >= 10
```

### **3\. Install dependencies and build**

```shell
pnpm install
pnpm build
```

### **4\. Load the extension in Chrome**

1. Navigate to `chrome://extensions`  
2. Enable **Developer mode** (toggle in the top-right corner)  
3. Click **Load unpacked**  
4. Select the `dist/extension` directory

### **5\. Development mode (optional)**

```shell
pnpm dev
```

Starts the build in watch mode — changes are reflected in `dist/extension` automatically. Reload the extension in Chrome to pick them up.

**Note:** Some features (like custom WebMCP tools) require the **User Scripts** permission. After loading the extension, go to `chrome://extensions`, find AWL, and enable "User Scripts" in its details page.

---

## **Configuration**

Click the AWL icon in the Chrome toolbar to open the side panel. Use the **Options page** to configure:

| Section | Purpose |
| :---- | :---- |
| **Models** | Configure AI provider API keys, thinking mode, system prompts |
| **MCP → MCP Servers** | Connect to external MCP servers for exploration |
| **MCP → WebMCP Tools** | Author and manage custom browser-side tools |
| **MCP → MCP Inspector** | Debug and inspect MCP server connections |
| **Built-in AI → API Status** | Check which Chrome on-device APIs are available |
| **Built-in AI → API Playgrounds** | Experiment with individual Built-in AI APIs |
| **Built-in AI → Workflow Composer** | Build and run visual AI workflows |
| **Prompt Commands** | Define custom slash commands for the chat |
| **Settings** | Theme (light/dark/auto) and log level |

---

## **Tech Stack**

- **TypeScript** \+ **React 19**  
- **Vercel AI SDK** (`ai`) — multi-provider model abstraction  
- **@assistant-ui/react** — chat interface framework  
- **@modelcontextprotocol/sdk** — MCP server/client implementation  
- **@xyflow/react** (React Flow) — visual workflow editor  
- **Chrome Extension APIs** (Manifest V3) — side panel, tabs, storage, scripting, devtools  
- **pnpm workspaces** — monorepo management

---

## **Contributing**

Contributions are welcome\! To get started:

1. Fork the repository  
2. Create a feature branch (`git checkout -b feature/my-feature`)  
3. Make your changes and verify with `pnpm build`  
4. Open a Pull Request against the `develop` branch

## **License**

[Apache 2.0](LICENSE)

---

Built with 🦉 to help the web ecosystem navigate the shift to the Agentic Web.

