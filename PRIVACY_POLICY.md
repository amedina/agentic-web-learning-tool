# Privacy Policy — Agentic Web Learning Tool

**Last updated:** April 6, 2026

## Overview

Agentic Web Learning Tool ("the Extension") is a Chrome extension that enables AI agents to interact with web pages through MCP (Model Context Protocol) servers. This privacy policy explains how the Extension handles user data.

## Data Collection and Storage

### Data Stored Locally on Your Device

The Extension stores the following data locally using Chrome's storage APIs (`chrome.storage.local` and `chrome.storage.sync`):

- **API keys** you provide for third-party AI model providers (Anthropic, OpenAI, Google Gemini).
- **Chat history** including messages exchanged between you and AI models.
- **Workflow definitions** you create for task automation.
- **Custom tool code** (WebMCP tools) you write for page interaction.
- **MCP server configurations** including server URLs, OAuth tokens, and custom HTTP headers you provide.
- **Extension preferences** such as theme settings and log levels.

All of this data is stored locally on your device (or synced via your Google account through `chrome.storage.sync` for settings and API keys). The Extension does not operate its own servers and does not collect or store any of your data on external infrastructure controlled by the Extension developers.

### Data Not Collected

The Extension does **not** collect:

- Personal identifying information (name, email, address, etc.)
- Browsing history beyond what you explicitly use through the Extension's tools
- Analytics, telemetry, or usage statistics
- Cookies or tracking identifiers

## Data Usage

All stored data is used exclusively to provide the Extension's core functionality:

- **API keys** are used solely to authenticate requests to the AI model providers you configure.
- **Chat history** is stored to allow you to continue previous conversations.
- **Workflows and custom tools** are stored to enable your automation tasks.
- **MCP server configurations** are used to connect to the servers you specify.

## Data Shared with Third Parties

The Extension sends data to third-party services **only when you explicitly initiate an action** that requires it:

- **AI model providers** (Anthropic, OpenAI, Google Gemini): Your API key and message content are sent to the provider you select when you use the chat feature. These requests are governed by the respective provider's privacy policy.
- **MCP servers**: Data is sent to MCP server endpoints that you manually configure. The Extension connects only to servers you explicitly add.

The Extension **never** shares, sells, or transfers user data for:

- Advertising, including personalized or interest-based advertising
- Creditworthiness or lending assessments
- Any purpose unrelated to the Extension's core functionality

## Permissions Explained

The Extension requests the following Chrome permissions, each necessary for its core features:

| Permission | Purpose |
|---|---|
| `storage`, `unlimitedStorage` | Store your settings, chat history, workflows, and configurations locally |
| `tabs`, `activeTab`, `tabGroups` | Interact with browser tabs as part of AI-assisted web tasks |
| `scripting`, `userScripts` | Execute tools and automation scripts on web pages you designate |
| `webNavigation` | Track page navigation to maintain context during automated tasks |
| `sidePanel` | Display the Extension's chat interface in the browser side panel |
| `history` | Provide browser history access through the Extension's history tool |
| `contextMenus` | Add Extension actions to the right-click context menu |
| `host_permissions (*://*/*)` | Allow content scripts and tools to operate on any webpage you visit |

## Data Security

- All network requests to AI model providers and MCP servers are transmitted over HTTPS.
- API keys and OAuth tokens are stored using Chrome's built-in storage APIs.
- No data is transmitted to any server without explicit user action.

## Data Retention and Deletion

- All data is retained locally until you delete it.
- You can delete individual chat threads, workflows, and tool configurations through the Extension's UI.
- You can perform a full factory reset from the Extension's options page, which clears all stored data.
- Uninstalling the Extension removes all locally stored data.

## Data Export

The Extension provides a settings export feature that generates a JSON backup file saved to your local downloads folder. This file may contain API keys and tokens in plaintext. Handle exported files with care.

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be reflected in the "Last updated" date at the top of this document.

## Contact

If you have questions about this privacy policy, please open an issue on the project's [GitHub repository](https://github.com/amedina/agentic-web-learning-tool).
