# AWL Chrome Extension — Video Demo Voiceover Script

**Video:** Agentic Web Learning Tool Demo  
**Duration:** 18 minutes 49 seconds  
**Narrator:** Alberto Medina  
**YouTube:** https://youtu.be/l7VA167NArc

---

## SECTION 1: INTRO & GITHUB OVERVIEW [0:00 – 1:15]

**[0:00 – 0:05] Title Card**

> Hey everyone — welcome. This is AWL, the Agentic Web Learning Tool, better known as “owl”. 


**[0:05 – 0:15] GitHub Wiki — "Who is this for?"**

> Owl is an open-source Chrome Extension designed for three audiences: developers building AI agents that interact with the web, researchers exploring the intersection of large language models and browsers, and learners who wants to understand how the agentic web actually works.

**[0:15 – 0:30] GitHub Releases — v1.0.0**

> This is the v1.0 release of the extension, and it is packed with features for learning about and playing with agentic web concepts and tools,


**[0:45 – 1:15] Installing the Extension**
> Scrolling down to the end of the release page, you can find the extensions assets which can be downloaded and installed as a unpacked extension. 

> Once downloaded, go to `chrome://extensions`, enable Developer Mode, and then load the extension. After this, the extension is installed and you'll see the owl icon appear in the toolbar. 

---

## SECTION 2: SIDE PANEL CHAT + MODELS CONFIG [1:15 – 3:00]

**[1:15 – 1:30] Side Panel on example.com**

> Here's example.com — a nice blank site to start with. Clicking on the extension's icon opens up a persistent conversational interface housed in a Chrome side panel, giving users a seamless way to interact with AI agents directly alongside any webpage they're browsing. You can see the owl mascot, the greeting message, and down at the bottom — the model selector. 

**[1:30 – 2:00] Options Page — Models Configuration**

> We can configure different foundation models by going to the Options page, Models section. There you can see three provider options: Anthropic, OpenAI, and Gemini. Each one lets you plug in your own API key and configure the model however you want.

**[2:00 – 2:30] Configuring Gemini**

> Let me paste in my Gemini API key... set the system prompt to "You are AWL, a useful agent helping everyone to learn about the agentic web." And I'll turn on Thinking Mode — this enables the model's extended reasoning capability, which is really useful for complex tasks. Save that.

**[2:30 – 3:00] Testing the Model**

> Now we can open the side panel, and switch the model selector to a Gemini model such as gemini-2.5-flash-preview.
>
> And there it is — we greet the model and it responds with our custom system prompt identity: "I am AWL, a useful agent dedicated to helping everyone learn about the agentic web." We're connected and ready to go.

---

## SECTION 3: MCP SERVER MANAGEMENT [3:00 – 5:00]

**[3:00 – 3:30] Adding an MCP Server**

> The Model Context Protocol is an open de-facto standard that lets AI models discover and use external tools through a structured interface. Think of it as a universal adapter between an AI agent and the services it needs to interact with.
>
> The Owl extension enables users to manage MCP servers right from the Options page. 

> Clicking on "MCP Servers" we can see the MCP servers section. For example we can configure the DevTools MCP Server by clicking "New MCP Server" and providing the server name, transport type, URL, connection settings, and authentication options. 

> Once we entered the required input, we click on connect. If everything is correct, we get the success toast — "MCP Server successfully added to extension."

**[3:30 – 4:00] Connection Success**

>  Now in the MCP Servers section we can see the Chrome DevTools MCP Server, connected, with 29 tools available. Twenty-nine tools that the Owl agent can use for things like inspecting DOM elements, running Lighthouse audits, evaluating scripts, and more. You can disconnect the server, inspect it, or edit the server configuration at any time.

**[4:30 – 5:00] MCP Inspector — DevTools Server**

> To inspect a given MCP Server, we can click on the "Inspect" button, which takes us to Owl's integrated MCP inspector.  Here we can see the full list of tools it exposes — hover, lighthouse_audit, list pages, and many more. 

> We can run specific tools directly from the inspector. For example, we can trigger a run of the "list_pages" tool and see how it works. 

**[6:00 – 7:00] Tool Execution & Chat Interaction**

> Once an MCP Server is configured and connected, the corresponding tools are available to the Owl chat interface in the side panel. 
> Here we see two MCP servers available: the DevTools and the Modern Web Guidance MCP servers. 

===> Note for Joel: You can show this using the idea you recorded showing the use of the guidance MCP server `best_practices` tool. 

===> Script has been reviewed until here. Joel to pick it up here and complete it. 

## SECTION 5: WEBMCP TOOLS + TOOL PROVIDERS [8:30 – 10:00]

**[8:30 – 9:00] Tool Providers Dropdown**

> Now let's look at something really powerful. I'm back on example.com with the side panel open, and I'm expanding the Tool Providers dropdown. Look at this — the agent has tools coming from multiple sources: example.com itself, the Guidance MCP Server, Chrome DevTools MCP Server, and MCP-B.
>
> And the tools list shows a mix — change_bg_color, smart_translator, quick_summarizer, let_it_snow, transform_example_site. Some of these are built-in tools, some come from MCP servers, and some — this is key — are WebMCP tools, exposed by the web page itself.
>
> WebMCP is the idea that a website can declare its own tools — its own capabilities — that an AI agent can discover and use. The page becomes a tool provider. This is a fundamentally different model from scraping or screen-reading. The website is an active participant.

**[9:00 – 9:30] Navigating WebMCP Options**

> Let me show you where these are configured...

**[9:30 – 10:00] Built-in AI — API Status**

> And here's the Built-in AI section. This dashboard shows the status of all Chrome Built-in AI APIs on your device. You can see them all green — Available: Prompt API, Proofreader, Translator, Language Detector, Summarizer, Writer, and Rewriter. These are Gemini Nano models that run entirely on-device, right in Chrome. No network calls, no API keys, complete privacy.
>
> Below that is the Local AI Environment information — details about your device's AI capabilities.

---

## SECTION 6: BUILT-IN AI PLAYGROUNDS [10:00 – 13:00]

**[10:00 – 10:30] Playgrounds Hub**

> AWL includes dedicated playgrounds for each of these built-in AI APIs. Think of them as sandboxes where you can experiment with each API in isolation before integrating them into your agent workflows.
>
> Here's the hub — five playgrounds: Prompt Lab for the core language model, Writer's Studio for the Writer and Rewriter APIs, Summarization Station, Polyglot Panel for translation and language detection, and Proofreader.

**[10:30 – 11:00] Writer's Studio — Configuration**

> Let me open Writer's Studio. On the left you've got the configuration panel — you can toggle between Writer mode and Rewriter mode, set the tone, the output length, the format, the output language, and even provide shared context that frames the generation.
>
> On the right — the prompt area, generate button, and where results appear.

**[11:00 – 12:00] Writer's Studio — Live Demo**

> Let's try it. I'll type "Write a short essay about an elephant." Set the tone to Formal, and add "For children" as the shared context — so the model knows the audience.
>
> Hit Generate... and there we go. "The Majestic Elephant" — a nicely formatted markdown essay, written in a formal but accessible tone, appropriate for a younger audience. And remember — this entire generation happened on-device. The Nano model running right here in Chrome produced this. No round trip to the cloud.
>
> This is what makes the Built-in AI APIs so compelling for developers. You get real generative AI capabilities with zero latency, zero cost per call, and complete user privacy.

**[12:00 – 12:30] Further Playground Exploration**

> You can explore the other playgrounds in the same way — the Prompt Lab gives you direct access to the language model with temperature and Top K controls, session statistics, context window monitoring. Each playground is purpose-built for its API.

**[12:30 – 13:00] Transition Card — API Playgrounds**

> *(pause for title card)*
>
> API Playgrounds — your interactive sandbox for Chrome Built-in AI APIs. Now let's move on to something I'm really excited about.

---

## SECTION 7: WORKFLOW COMPOSER [13:00 – 15:30]

**[13:00 – 14:00] Workflow Composer — Overview**

> This is the Workflow Composer. It's a visual, node-based editor that lets you chain Built-in AI APIs into multi-step workflows — no code required.
>
> The layout has three columns. On the left, your tool palette — all the Gemini Nano APIs are here as draggable nodes: Prompt, Writer, Rewriter, Proofreader, Translator, Language Detector, Summarizer. Plus input nodes — DOM Input for pulling content from the page, Static Input for hardcoded text, and a Selection Tool.
>
> In the center — the flow canvas. You can see I'm building a workflow: START connects to a DOM Input node, which feeds into a Summarizer node, and ends at the END node.
>
> On the right — the configuration panel for whichever node I have selected. Here I'm configuring the Summarizer: Summary Type set to Key Points, Output Format to Markdown, Summary Length to Short, Input Languages supporting English, Spanish, and Japanese.
>
> And in the text box tab, I've got a Wikipedia article loaded as test input.

**[14:00 – 15:00] Building & Executing Workflows**

> The power here is composability. You're not limited to a single API call — you can build pipelines. Imagine: pull text from a webpage, detect its language, translate it, summarize the translation, and proofread the summary — all as a single workflow, all on-device.
>
> You can save these workflows, load them, import and export them as JSON. And when you're happy with a workflow, you can even expose it as a WebMCP tool — meaning the agent in the side panel can execute your entire pipeline as a single tool call.
>
> That's the bridge between the visual editor and the agentic chat interface. You build the workflow here, and the agent uses it there.

**[15:00 – 15:30] Navigating Away**

> Alright — let's put all of this together with a real-world demo.

---

## SECTION 8: AWLSHOP DEMO (WebMCP E-COMMERCE) [15:30 – 18:00]

**[15:30 – 16:00] AWLshop — The Demo Site**

> Welcome to AWLshop — a demo e-commerce grocery store I've built to showcase WebMCP in action. You can see products here: Italian Spaghetti at $2.99, Free Range Eggs at $3.20, and more.
>
> Now look at the Tool Providers in the side panel — awl-shop.holodeck.work is listed as a provider. The website itself has registered WebMCP tools: search_products, add_to_cart, update_cart_quantity, get_cart_contents, approve_order, confirm_order, clear_cart, navigate_to_app.
>
> This site isn't just a page the agent looks at — it's a service the agent can interact with programmatically, through a standard protocol. The website declared its capabilities, and the agent discovered them automatically.

**[16:00 – 16:30] Natural Language Shopping**

> Let me show you what this means in practice. I'll type: "Add 1 packet of Italian Spaghetti of 500 grams to my cart."
>
> Watch the agent work. It understands the intent, identifies the right product, and calls the add_to_cart WebMCP tool — a tool that the AWLshop website itself exposed. The agent doesn't need to know how the cart works internally. It just uses the tool the site provided.

**[16:30 – 17:00] Checkout & DevTools View**

> And here's the checkout page — Italian Spaghetti, quantity 1, $2.99 total. The agent successfully added the item to the cart through a natural language request, mediated by WebMCP.
>
> I've got DevTools open here too — you can see the page structure, the elements. But let me switch to the AWL tab.

**[17:00 – 17:30] DevTools — AWL Panel**

> Here's the AWL DevTools panel showing the Tool List — 58 tools total. And look at the Type and Category columns: some are MCP type from the connected servers, others are WebMCP type from the website itself, categorized as "website."
>
> I'm selecting the search_products tool — you can see its description: "Search the catalog for items. Returns matching products with their pack size and type." And below that, the full input schema as JSON.
>
> This is the developer experience I wanted to build. Complete visibility into what tools exist, where they come from, what they expect, and what they return. Whether you're building the agent, building the website, or debugging the interaction — everything is inspectable.

**[17:30 – 18:00] Continued Inspection**

> You can drill into any tool here — see the schema, manually run it, inspect the results. This DevTools panel is your window into the entire agentic ecosystem running in the browser. MCP servers, WebMCP tools, built-in capabilities — all unified in one view.

---

## SECTION 9: SETTINGS & CLOSING [18:00 – 18:49]

**[18:00 – 18:30] Settings Page**

> Before we wrap up, a quick look at Settings. You've got theme preferences — light, dark, or auto. Developer logs with configurable verbosity levels — debug, warn, error, or silent. Backup and restore to export or import your entire configuration. And a factory reset option if you need a clean slate.

**[18:30 – 18:49] Closing**

> So that's AWL — the Agentic Web Learning Tool. We covered a lot: configuring foundation models and on-device AI, connecting and inspecting MCP servers, understanding WebMCP and how websites become tool providers, experimenting with Built-in AI playgrounds, composing visual workflows, and building real agentic experiences on e-commerce demo sites — all within a single Chrome Extension.
>
> AWL is open-source. The code is on GitHub — I'll drop the link in the description. Try it out, break things, build your own MCP servers, create WebMCP-enabled sites, compose workflows, and if you're feeling generous — contribute back.
>
> The agentic web is happening. AWL is here to help you learn it, build it, and shape it. Thanks for watching.

---

## Narration Notes

### Pacing Tips by Section

| Section | Duration | Pacing Notes |
|---------|----------|--------------|
| 1: Intro & GitHub | 1:15 | **Brisk but clear.** Establish credibility and scope quickly. Don't linger on the GitHub UI — the audience wants to see the extension. |
| 2: Side Panel + Models | 1:45 | **Measured.** This is the first hands-on moment. Let the viewer absorb the UI. Pause briefly after the model responds to let the moment land. |
| 3: MCP Server Mgmt | 2:00 | **Explanatory.** First time MCP is introduced — take an extra beat to explain the concept before diving into the UI. |
| 4: Inspector + Guidance | 3:30 | **Build excitement.** This is the first "wow" section — the agent using tools autonomously. Slow down when the Tool Call Card expands. Let the viewer read the arguments and results. |
| 5: WebMCP + Providers | 1:30 | **Conceptual pivot.** WebMCP is a new concept for most viewers. Emphasize the paradigm shift: the website as an active participant, not a passive target. |
| 6: Built-in AI | 3:00 | **Enthusiastic but grounded.** The on-device angle is exciting. Emphasize privacy and zero-latency. Give the Writer's Studio demo room to breathe. |
| 7: Workflow Composer | 2:30 | **Deliberate.** The visual editor is complex. Name each column, describe the flow clearly. The key insight is composability — hammer that home. |
| 8: AWLshop | 2:30 | **Peak energy.** This is the culmination — everything comes together. The natural language shopping moment should feel like a payoff. |
| 9: Settings & Closing | 0:49 | **Warm, confident.** Quick settings tour, then a strong close. End on the vision, not the features. |

### Music & Audio Notes

- **[0:00 – 0:05]** Light intro music under title card — fade down as narration begins.
- **[0:45 – 1:15]** Slight music bed during installation (low energy, procedural moment).
- **[2:30 – 3:00]** Music ducks completely when the model first responds — let the "it works" moment be clean.
- **[6:00 – 7:00]** Subtle tension build as tool calls execute in the inspector.
- **[7:00 – 8:00]** Gentle swell when the Tool Call Card expands and shows results — this is the "magic" moment.
- **[12:30 – 13:00]** Transition music during the "API Playgrounds" title card. Let it breathe. 2-3 seconds of just music.
- **[16:00 – 16:30]** Music drops to near-silence during the natural language shopping demo — let the interaction speak for itself.
- **[18:30 – 18:49]** Closing music fades in under the final call to action. Confident, forward-looking.

### Tone Shifts

- **[0:00 – 0:15]** — **Warm, inviting.** You're welcoming someone into the room.
- **[3:00 – 3:30]** — **Slightly pedagogical.** You're explaining MCP for the first time. Slow down, be clear.
- **[7:00 – 8:00]** — **Awe and excitement.** "Look at what just happened." Let genuine enthusiasm come through.
- **[8:30 – 9:00]** — **Visionary.** The WebMCP explanation is a paradigm pitch. Speak with conviction.
- **[11:00 – 12:00]** — **Delighted.** The on-device generation is genuinely cool. Let it show.
- **[15:30 – 16:30]** — **Showmanship.** This is the big demo. Narrate it like you're live on stage.
- **[18:30 – 18:49]** — **Grateful and forward-looking.** Thank the audience, point to the future.

### Total Word Count Estimate

~2,800 words at ~150 words/minute = ~18.5 minutes of narration. This leaves natural room for pauses, breath, and letting visuals land.