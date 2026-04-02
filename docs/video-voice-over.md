# Prompt: Create a Voiceover Script for the AWL Chrome Extension Video Demo

## Role & Context

You are a technical scriptwriter creating a voiceover narration for a video demonstration of the **Agentic Web Learning Tool (AWL)** — an open-source Chrome Extension built by Alberto Medina at Google Developer Relations. The video is published on YouTube at: https://youtu.be/l7VA167NArc

The source code lives at: https://github.com/amedina/agentic-web-learning-tool

## Your Task

Write a **timed voiceover transcript** that narrates what the viewer sees on screen throughout the video. The script should be ready to record as a voice track that syncs with the video's visual flow.

### How to Provide the Video Timeline

Since you cannot watch the YouTube video directly, I'm providing the scene-by-scene breakdown below. Use this timeline as the backbone for the script. Each entry describes what's visible on screen at that timestamp.

**[IMPORTANT: Replace the placeholder timeline below with your actual video timeline before submitting this prompt. You can create it by watching the video and noting timestamps + what's on screen. Alternatively, use YouTube's auto-generated transcript/captions as a starting point, or take screenshots at key moments.]**

```
VIDEO TIMELINE (fill in before using this prompt):
- [0:00 - 0:XX] — (describe opening scene, e.g. "Browser open to example.com, AWL side panel visible")
- [0:XX - 0:XX] — (describe next scene, e.g. "Options page → Models section, Gemini expanded")
- [0:XX - 0:XX] — (next scene...)
- ... continue for each distinct scene/transition in the video ...
- [X:XX - end] — (closing scene)
```

If you don't have a timeline ready, you can alternatively provide:
- The YouTube auto-generated captions/transcript (paste them in)
- A series of screenshots with approximate timestamps
- Or simply ask me to generate a **template script organized by feature** (not timed), which you can then manually sync to the video later

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

### Demo Site Used in the Video

The video uses a demo site called **AWLeats** (at `awl-eats.holodeck.work`) — a curated Indian food recipe site featuring dishes like Butter Chicken (Murgh Makhani), Chicken Cafreal, etc. This site has WebMCP tools registered (e.g., `list_recipes`, `list_ingredients`, `get_recipe_details`, `get_categories`, `get_cuisines`, `navigate_to_app`), which the AI agent calls through the chat interface to retrieve recipe data.

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
Match the video duration. If the video is ~X minutes, the script should have approximately X minutes of narration content. Don't rush — leave natural breathing room and let visuals speak during transitions.

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