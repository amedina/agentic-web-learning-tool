# Prompt: Create a Voiceover Script for the AWL Chrome Extension Video Demo

## Role & Context

You are a technical scriptwriter creating a voiceover narration for a video demonstration of the **Agentic Web Learning Tool (AWL)** — an open-source Chrome Extension built by Alberto Medina at Google Developer Relations. The video is published on YouTube at: https://youtu.be/l7VA167NArc

The source code lives at: https://github.com/amedina/agentic-web-learning-tool

## Your Task

Write a **timed voiceover transcript** that narrates what the viewer sees on screen throughout the video. The script should be ready to record as a voice track that syncs with the video's visual flow.

### Video Timeline (18 min 49 sec total)

The video is organized into distinct sections, each separated by title card transitions. Here is the scene-by-scene breakdown:

```
SECTION 1: INTRO & GITHUB OVERVIEW [0:00 – 1:15]
- [0:00 – 0:05]  Title card: "Agentic Web Learning Tool" / subtitle: "Models, MCP, WebMCP, Built-in AI, Skills" / "March 2025, albertomedina@"
- [0:05 – 0:15]  GitHub Wiki page — "Who is this for?" (Developers, Researchers, Learners), Key Features list (Side Panel Chat, MCP Server Management, WebMCP, Workflow Engine, Built-in AI Playgrounds, MCP Inspector), Documentation Structure links
- [0:15 – 0:30]  GitHub Releases page — v1.0.0 "Release 1.0.0" with Key Pillars: Workflow Composer, MCP Ecosystem, Native AI, Developer Tooling
- [0:30 – 0:45]  Scrolling down releases page — "Others" section showing changelog items, Contributors avatars (amedina, gagan0123, and 5 others), Assets section (extension-v1.0.0.zip, 1.66 MB)
- [0:45 – 1:15]  Navigating to chrome://extensions to install the extension, then opening a new tab and searching

SECTION 2: SIDE PANEL CHAT + MODELS CONFIG [1:15 – 3:00]
- [1:15 – 1:30]  example.com loaded with AWL side panel open. Panel shows owl mascot, "How can I help you today?", "I have access to 19 tools", model selector showing "prompt-api" (Chrome's on-device model)
- [1:30 – 2:00]  Options page → Models section. Three provider accordions: anthropic, open-ai, gemini. Gemini expanded showing API Key field (empty), System Prompt, Thinking Mode toggle (off), Disable Provider toggle (on). Cursor clicking into API Key field
- [2:00 – 2:30]  Gemini API key pasted, System Prompt filled with "You are AWL, a useful agent helping everyone to learn about the agentic web." Thinking Mode toggled ON. Configuration saved
- [2:30 – 3:00]  Side panel now shows model selector switched to "gemini-3-flash-preview". User types "Hello, who are you?" — Assistant responds: "Hello! I am AWL, a useful agent dedicated to helping everyone learn about the agentic web. How can I assist you today?"

SECTION 3: MCP SERVER MANAGEMENT [3:00 – 5:00]
- [3:00 – 3:30]  Options page → MCP → MCP Servers. "New MCP Server" dialog opens with fields: Server Name ("Chrome DevTo..."), Transport Type (Streamable HTTP), URL, Connection Type, Authentication accordion, Configuration accordion, Copy Server Entry / Copy Servers File buttons, Inspect / Cancel / Connect buttons
- [3:30 – 4:00]  MCP Server connection completes — success toast "MCP Server successfully added to extension". Shows "Chrome DevTools MCP Server" card with Disconnect button, Total Tools: 29, Inspect / Edit buttons
- [4:00 – 4:30]  Adding a second MCP server ("Guidance MCP Server"). Navigating to MCP Inspector page
- [4:30 – 5:00]  MCP Inspector inspecting Chrome DevTools MCP Server — Tools list shows hover, lighthouse_audit tools. History shows tools/list, logging/setLevel, initialize events

SECTION 4: MCP INSPECTOR + GUIDANCE SERVER DEMO [5:00 – 8:30]
- [5:00 – 5:30]  MCP Servers page showing both connected servers. Hovering over "+ New Server" button
- [5:30 – 6:00]  MCP Inspector now inspecting "Guidance MCP Server" — Tools panel shows search_use_cases and get_best_practices tools. Right panel shows search_use_cases tool detail with query field filled with "Search hidden". History shows tools/list, initialize events
- [6:00 – 7:00]  Executing tool calls in the inspector. Side panel chat opens alongside — user asks "Hello, who are you?" — assistant responds "Hello! I am AWL, a useful agent dedicated to helping everyone learn about the agentic web." Inspector History grows to show tools/call entries. Tool tabs visible: Tools, Ping, Sampling, Elicitations, Roots
- [7:00 – 8:00]  Side panel shows agent using tools — get_best_practices tool call card expanded showing arguments: {"use_case_id": "search-hidden-content"}, Result showing "# Search hidden content". Model switched to "gemini-2.5-flash". Built-in AI section expanded in sidebar showing API Status, API Playgrounds, Workflow Composer
- [8:00 – 8:30]  Scrolling through chat response showing detailed content about performance, prefetching, prerendering. Tool call card with get_best_practices visible

SECTION 5: WEBMCP TOOLS + TOOL PROVIDERS [8:30 – 10:00]
- [8:30 – 9:00]  example.com with side panel open — Tool Providers dropdown expanded showing: example.com, Guidance MCP Server, Chrome DevTools MCP Server, MCP-B. Tools column shows: change_bg_color, built_in__smart_translator, built_in__quick_summarizer, built_in__let_it_snow, transform_example_site. Model: gemini-2.5-f...
- [9:00 – 9:30]  Navigating through options — WebMCP Tools page implied
- [9:30 – 10:00] Options page → Built-in AI → API Status page. Dashboard showing "Built-in AI APIs" with all APIs listed as "Available" (green): Prompt API, Proofreader API, Translator API, Language Detector API, Summarizer API, Writer API, Rewriter API. "Local AI Environment" section below

SECTION 6: BUILT-IN AI PLAYGROUNDS [10:00 – 13:00]
- [10:00 – 10:30] API Playgrounds hub page — card grid showing: Prompt Lab, Writer's Studio, Summarization Station, Polyglot Panel, Proofreader
- [10:30 – 11:00] Writer's Studio playground — Configuration panel: Mode (Writer/Rewriter toggle), Tone (Neutral), Length (Short), Format (Markdown), Output Language (English), Shared Context field. Right panel: Writer Prompt area, Generate Content button, Result section
- [11:00 – 12:00] Writer's Studio in action — Prompt: "Write a short essay about an elephant." Tone changed to "Formal", Shared Context: "For children". Result shows generated essay "## The Majestic Elephant" with paragraphs about elephants
- [12:00 – 12:30] (Continued exploration of playgrounds / Prompt Lab)

TRANSITION CARD: "API Playgrounds" [~12:30 – 13:00]
- [12:30 – 13:00] Dark transition title card: "API Playgrounds — Interactive sandbox for Chrome Built-in AI APIs" / "April 2026, @albertomedina"

SECTION 7: WORKFLOW COMPOSER [13:00 – 15:30]
- [13:00 – 14:00] Workflow Composer — three-column layout. Left sidebar: Gemini Nano APIs (Prompt API, Writer API, Rewriter API, Proofreader API, Translator API, Language Detector, Summarizer API), Input section (Dom Input, Static Input, Selection Tool). Center canvas: "New Workflow" tab with START node → DOM Input → Summarizer → END flow being built. Right panel: Node config showing Summarizer API Configuration (Summary Type: Key Points, Output Format: Markdown, Summary Length: Short, Input Languages: English/Spanish/Japanese). Text box tab open showing Wikipedia article
- [14:00 – 15:00] Workflow execution and editing. Building the summarization workflow, connecting nodes
- [15:00 – 15:30] Navigating away from Workflow Composer — new tab search bar visible showing AWL-related bookmarks (AWL Demos, AWLshop, AWL Options Page)

SECTION 8: AWLSHOP DEMO (WebMCP E-COMMERCE) [15:30 – 18:00]
- [15:30 – 16:00] AWLshop demo site (awl-shop.holodeck.work) loaded — "Our Products" showing Italian Spaghetti ($2.99, 500g), Free Range Eggs ($3.20, 6 count), and more. Side panel open with Tool Providers dropdown showing: awl-shop.holodeck.work, Guidance MCP Server, DevTools, MCP-B. Tools list includes: change_bg_color, built_in__quick_summarizer, built_in__let_it_snow, built_in__smart_translator, summarizer_1, search_products, add_to_cart, update_cart_quantity, get_cart_contents, approve_order, confirm_order, clear_cart, navigate_to_app
- [16:00 – 16:30] User types in chat: "Add 1 packet of Italian Spaghetti of 500 grams to my cart." Agent processes the request
- [16:30 – 17:00] AWLshop checkout page — showing cart with "Italian Spaghetti, Qty: 1 × $2.99, Total: $2.99". Buttons: Empty Cart, Complete Purchase. DevTools open showing Elements panel with page HTML/CSS
- [17:00 – 17:30] DevTools → AWL tab open — Tool List showing 58 tools. Types include MCP and WebMCP, Categories include mcp-b, website. WebMCP tools: search_products, add_to_cart, update_cart_quantity, get_cart_contents, approve_order. DESCRIPTION panel showing search_products tool: "Search the catalog for items. Returns matching products with their pack size (unit_quantity) and type." INPUT SCHEMA shown as JSON
- [17:30 – 18:00] Continued DevTools inspection of AWLshop WebMCP tools

SECTION 9: SETTINGS & CLOSING [18:00 – 18:49]
- [18:00 – 18:49] Options page → Settings section. Interface: Theme Preference (Light/Dark/Auto). Developer Logs: Debug/Warn(selected)/Error/Silent. Backup & Restore: Export Configuration / Import Configuration buttons. Factory Reset with "Reset Data" button (destructive, red). Video ends on this screen
```

## About the Tool

AWL is a Chrome Extension designed to serve two primary purposes:

1. **Educational Platform** — Helping developers and researchers understand the Agentic Web, including the Model Context Protocol (MCP) and WebMCP.
2. **Functional Development Environment** — Providing tools for building, debugging, and testing agentic browsing solutions.

### Target Audience
- Developers building AI agents that interact with the web
- Researchers exploring the intersection of LLMs and browser automation
- Learners who want to understand how standard interfaces (MCP) bridge the gap between AI models and browser contexts

### AWL's Key Features (use these to identify what's being shown in each scene)

1. **Distribution** — Open-source on GitHub, available via Chrome Web Store.

2. **Foundation Models Interface** — Options page where users configure different AI models (cloud-based foundation models like Gemini, as well as Chrome's built-in on-device models like Gemini Nano).

3. **Side Panel Chat Interface** — A persistent conversational AI chat in Chrome's side panel (using the Sidepanel API). Key elements to narrate:
   - Activation by clicking the extension icon in the toolbar
   - Real-time streaming responses with Markdown rendering
   - **Model Selector** dropdown at the bottom to switch models on-the-fly
   - **Tool Call Cards** — inline expandable cards showing tool name, input arguments, JSON response, and execution duration
   - **Reasoning Display** — collapsible "Thought Process" block showing the model's internal reasoning steps

4. **MCP Server Management** — Options page section where users add, edit, connect/disconnect external MCP servers (with transport type, URL, OAuth, custom headers). Shows connected servers with tool counts (e.g., "DevTools — Total Tools: 26"). Four packages collaborate: `packages/common`, `packages/design-system`, `packages/extension`, and `packages/mcp-inspector`.

5. **MCP Inspector** — Full inspector UI for testing MCP server connections, calling tools, viewing resources/prompts, and debugging auth flows.

6. **WebMCP Tools** — Browser-side implementation that exposes DOM elements and browser APIs as MCP tools to the agent. The options page shows:
   - **Built-in tools** (e.g., `change_bg_color`, `get_page_title`) with toggle switches
   - **Built-in Workflows** (e.g., `built_in__smart_translator`, `built_in__quick_summarizer`, `built_in__let_it_snow`)
   - **Custom WebMCP scripts** — user-created tools the agent can execute on specific pages

7. **AWL DevTools Panel** — A custom tab labeled "AWL" in Chrome DevTools with three sub-panels:
   - **Tool List** — Table of all registered MCP tools (Name, Description, Type [MCP vs WebMCP], Category [mcp-server, built-in, website], Action). Selecting a tool shows its full JSON schema, description, and input schema.
   - **Run Tool** — Interface for manually executing any registered tool with input parameters, showing raw JSON results.
   - **Inspector** — Real-time log of MCP communication events with timestamps (tool calls, results, registrations, transport-level messages).

8. **Built-in AI Playgrounds** — Sandboxed playgrounds on the extension's Options page for experimenting with Chrome's on-device Nano APIs in isolation:
   - **Prompt Lab** — LanguageModel / `window.ai.languageModel` (Prompt API) with system prompt, language selection, temperature, Top K, session stats
   - **Writer's Studio** — Writer / Rewriter APIs
   - **Summarization Station** — Summarizer API
   - **Polyglot Panel** — Translator / LanguageDetector APIs
   - **Proofreader** — Proofreader API

9. **Built-in AI Workflow Composer** — Visual node-based editor (using `@xyflow/react`) for chaining Built-in APIs into workflows. Three-column layout:
   - Left sidebar: draggable tool palette (Built-in AI Tools, Flow Tools, JS Tools)
   - Center: drag-and-drop flow canvas with workflow tabs
   - Right sidebar: configuration panel for selected node
   - Supports save/load/import/export of workflows as WorkflowJSON
   - Execution via `WorkflowEngine` using topological sort

### Demo Sites Used in the Video

The video uses two demo sites on the `holodeck.work` domain:

1. **AWLshop** (at `awl-shop.holodeck.work`) — An e-commerce grocery store with products like Italian Spaghetti ($2.99), Free Range Eggs ($3.20), etc. It has WebMCP tools registered for shopping: `search_products`, `add_to_cart`, `update_cart_quantity`, `get_cart_contents`, `approve_order`, `confirm_order`, `clear_cart`, `navigate_to_app`. The demo shows adding items to cart via natural language chat.

2. **AWLeats** (at `awl-eats.holodeck.work`) — A curated Indian food recipe site featuring dishes like Butter Chicken (Murgh Makhani), Chicken Cafreal, etc. It has WebMCP tools: `list_recipes`, `list_ingredients`, `get_recipe_details`, `get_categories`, `get_cuisines`, `navigate_to_app`.

The video also uses **example.com** as a basic test page for demonstrating the side panel, tool providers, and WebMCP built-in tools.

Additionally, a **Guidance MCP Server** is connected that provides `search_use_cases` and `get_best_practices` tools — used to demonstrate how MCP servers can provide web development best practices to the agent.

## Script Requirements

### Format
Structure the script as timed segments synchronized to the video:

```
[MM:SS - MM:SS] SCENE DESCRIPTION
Voiceover text here...
```

### Tone & Style
- **Professional but approachable** — like a Google I/O developer session or a Chrome DevRel walkthrough
- First person from the perspective of the presenter/narrator (Alberto)
- Assume the audience is technical but may be new to MCP and the Agentic Web
- Briefly explain key concepts (MCP, WebMCP, tool calling, Nano APIs) the first time they appear, but don't over-explain to developers
- Keep energy up — this is a demo, not a lecture

### Structure Guidelines
- **Opening hook** (~15-20 seconds): What is AWL and why should the viewer care? Frame the Agentic Web opportunity.
- **Feature walkthrough**: Narrate each feature as it appears on screen, describing both *what* the viewer is seeing and *why* it matters.
- **When tool calls appear**: Call out what's happening — the agent choosing a tool, the arguments it passes, the result — this is the core "magic" moment.
- **When the DevTools panel is shown**: Emphasize the transparency/debuggability angle — developers can see everything the agent is doing.
- **When Built-in AI features appear**: Highlight the on-device / privacy-preserving angle of Nano APIs and the power of chaining them in workflows.
- **Closing** (~10-15 seconds): Recap, call to action (try it, contribute, link to repo).

### Things to Watch For in the Video
- Transitions between the Options page, the side panel chat, DevTools, and the AWLeats demo site
- Moments where the agent makes tool calls (Tool Call Cards expanding in the chat)
- The model selector switching between models (e.g., `gemini-2.5-flash`)
- The DevTools AWL tab showing registered tools, their types (MCP vs WebMCP), and categories (mcp-server, built-in, website)
- Workflow Composer node connections and execution
- Any pauses or transitions where filler narration can bridge visual gaps

### Length
The video is **18 minutes 49 seconds** long. The script should provide approximately 18-19 minutes of narration content. Don't rush — leave natural breathing room during transitions (especially the dark title card at ~13:00) and let visuals speak during key demo moments like tool call executions.

## Output Format

Deliver:

1. **The full timed voiceover script** (primary deliverable)
2. **A brief "narration notes" section** at the end with:
   - Suggested pacing tips per section
   - Any moments where background music should duck or swell
   - Suggested tone shifts (e.g., "slow down here for emphasis", "pick up energy for the demo")

---

## Appendix: Visual Reference (Screenshots from the Deliverables)

These screenshots are from the AWL deliverables document and show the actual UI screens. Use them to understand what the viewer sees during each feature section:

| # | What It Shows |
|---|---|
| Screenshot 1 | **MCP Servers page + Side Panel with Tools list** — Options page showing MCP Servers section with a connected "DevTools" server (Total Tools: 26, Inspect/Edit buttons). Side panel overlays showing tools list (click, close_page, drag, emulate, evaluate_script, fill, fill_form, etc.) and Tool Providers dropdown (DevTools, MCP-B). |
| Screenshot 2 | **New WebMCP Script dialog** — Code editor on left with metadata template (`export const metadata = { name, namespace, description, allowedDomains, inputSchema }`). Right side shows parsed metadata form (Name, Namespace, Description, Allowed Domains, Input Schema). Side panel chat visible with model selector showing `gemini-2.5-flash`. |
| Screenshot 3 | **Models configuration page** — Options page "Models" section showing three provider accordions: anthropic, open-ai, gemini (expanded). Gemini section shows API Key field (masked), System Prompt text area, Thinking Mode toggle (off), Disable Provider toggle (on), and Update button. |
| Screenshot 4 | **Built-in AI Playgrounds hub** — Five playground cards: Prompt Lab, Writer's Studio, Summarization Station, Polyglot Panel, Proofreader. Each shows a brief description of the corresponding Chrome Built-in AI API. |
| Screenshot 5 | **DevTools AWL Panel — Inspector tab** — Showing MCP communication log on AWLeats demo site. Two WebMCP tool calls logged: `list_ingredients` (8ms) and `list_recipes` (6ms). Bottom section shows ARGUMENTS (`{ "recipeId": "butter-chicken" }`) and OUTPUT JSON for the selected `list_ingredients` call. |
| Screenshot 6 | **DevTools AWL Panel — Tool List + Run Tool** — Full tool table showing 48 registered tools with Name, Description, Type (MCP/WebMCP), and Category (mcp-server/built-in/website). "Run Tool" pane open on right for `list_ingredients` with `recipeId` input field set to "butter-chicken". Bottom shows DESCRIPTION and INPUT SCHEMA JSON. |
| Screenshot 7 | **MCP Servers page + Side Panel (clean state)** — Same as Screenshot 1 but without the tools overlay. Shows the side panel in its default "How can I help you today?" state with Chat/Workflows tabs. |
| Screenshot 8 | **Prompt Lab playground** — Configuration panel with System Prompt ("You are a helpful and friendly assistant"), Expected Input/Output Language (English), Temperature (1.0), Top K (3), New Session button, and Session Stats (Context Window: 0, Tokens Used: 0, Capacity: 0 left). |
| Screenshot 9 | **DevTools AWL Panel — Tool List (full view)** — Same as Screenshot 6 but without Run Tool pane. Shows full tool table with Action column containing play buttons for each tool. Category column visible showing mcp-server, built-in, and website categories. |
| Screenshot 10 | **Side Panel on example.com** — Clean browser showing example.com with AWL side panel open. Chat tab active, default greeting "How can I help you today? I can help you write code, analyze data, or even check the weather. I have access to 45 tools." Model selector: `gemini-2.5-flash`. |
| Screenshot 11 | **Chat interaction on AWLeats** — AWLeats butter-chicken recipe page. Side panel showing a conversation: user asked "What are the ingredients of the butter chicken?" Agent responded with Tool Call Cards: `list_recipes` (0.011s) and `list_ingredients` (0.01s, expanded showing `{ "recipeId": "butter-chicken" }` arguments). |
| Screenshot 12 | **WebMCP Tools page** — Options page showing built-in tools (`change_bg_color`, `get_page_title` with toggle switches) and Built-in Workflows section (`built_in__smart_translator`, `built_in__quick_summarizer`, `built_in__let_it_snow`). |
| Screenshot 13 | **Workflow Composer** — Three-column layout. Left: tool palette (Workflow Lifecycle, Gemini Nano APIs: Prompt API/Writer/Rewriter/Proofreader/Translator/Language Detector/Summarizer, Input: DOM Input/Static Input). Center: flow canvas showing "Built-in: Smart Translator" workflow with nodes (START → Get Text → Translate [EN→ES] → Set Text → END, with Loop → Translation Result branch). Right: Configuration panel showing WebMCP Name, Description, Allowed Domains, "Enable as WebMCP Tool" checkbox. |
| Screenshot 14 | **GitHub repository** — `amedina/agentic-web-learning-tool` repo page on the `develop` branch, showing README.md with "Instructions to run build and run this locally" and Prerequisites section. |