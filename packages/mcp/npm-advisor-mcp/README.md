# NPM Advisor — MCP server

An MCP (Model Context Protocol) server that exposes npm package intelligence to MCP-aware AI clients like **Claude Code**, **Claude Desktop**, **Cursor**, **Continue**, and any future MCP-aware editor or agent.

It's the same analysis pipeline that powers the [NPM Advisor VSCode extension](../../extensions/vscode) and the [NPM Advisor Chrome extension](../../extensions/npm-advisor) — Fitness scoring, GitHub Security Advisories, license compatibility against your project's target license, bundle size, last-commit / stars, and replacement recommendations from [e18e](https://github.com/e18e/community).

## What it gives your AI

Four tools:

| Tool | What it returns | When the model calls it |
| --- | --- | --- |
| `get_package_stats` | Full `PackageStats` for one package: Fitness score, security advisories, license + compatibility verdict, bundle size, GitHub stars + last commit, replacement recommendations. | "Tell me about lodash." "Is express maintained?" "Compare lodash and underscore." |
| `list_known_projects` | Every VSCode workspace the npm-advisor extension has tracked, with open/closed status and last-opened time. | "Which project should I look at?" "What do I have open in VSCode?" |
| `list_workspace_dependencies` | Every `package.json` in the workspace with its `name` and dep counts. No network. | "What does this project look like?" "Where do my dependencies live?" |
| `analyze_package_json` | Per-dep stats for one `package.json` plus a roll-up summary (vulnerable / license-incompatible / replaceable counts). | "Audit this project." "Which dependencies should I worry about?" |

Every tool returns plain JSON in the MCP `text` content slot so any AI client can parse it deterministically. The `analyze_package_json` and `get_package_stats` tools include rendering hints in their descriptions that instruct Claude to present results as a rich visual artifact (metric cards, score bar chart, tabbed sections) when the client supports it.

## Quick install

The server runs as a Node binary. The recommended invocation is via `npx` so you don't have to manage a global install or path:

```sh
npx -y @agentic-web-labs/npm-advisor-mcp
```

It speaks MCP over stdio. Configure your AI client to spawn it as below.

### Claude Code

Add the server via the Claude Code CLI from your project root:

```sh
claude mcp add npm-advisor -- npx -y @agentic-web-labs/npm-advisor-mcp
```

This writes an entry to `~/.claude.json` (or `.mcp.json` if you want it scoped to the project). Restart any open Claude Code session and ask: *"List my dependencies and tell me which ones have security issues."*

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "npm-advisor": {
      "command": "npx",
      "args": ["-y", "@agentic-web-labs/npm-advisor-mcp"]
    }
  }
}
```

Restart Claude Desktop. The four tools appear under the connector icon in the chat composer.

### Cursor

In Cursor's settings, open *MCP* → *Add new global MCP server* and paste:

```json
{
  "mcpServers": {
    "npm-advisor": {
      "command": "npx",
      "args": ["-y", "@agentic-web-labs/npm-advisor-mcp"]
    }
  }
}
```

Cursor's Composer can now call the tools. Toggle them on under MCP Tools when you start a chat.

### VSCode (built-in MCP support, 1.96+)

Add to your workspace's `.vscode/mcp.json` (or user-scope `mcp.json`):

```json
{
  "servers": {
    "npm-advisor": {
      "command": "npx",
      "args": ["-y", "@agentic-web-labs/npm-advisor-mcp"]
    }
  }
}
```

Copilot Chat in agent mode will discover the tools.

### Continue

In `~/.continue/config.json` (or the project-scoped `.continue/config.json`):

```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "transport": {
          "type": "stdio",
          "command": "npx",
          "args": ["-y", "@agentic-web-labs/npm-advisor-mcp"]
        }
      }
    ]
  }
}
```

## GitHub authentication (optional but recommended)

Without a token GitHub rate-limits the server's API calls to **60 requests / hour / IP** — easy to exhaust during a workspace audit. Set a personal-access token in the environment your AI client launches the server in:

```sh
export GITHUB_TOKEN=ghp_…
```

Or `GH_TOKEN`, which is also recognized. With a token the rate limit jumps to **5 000 requests / hour**.

A typical Claude Desktop entry with auth:

```json
{
  "mcpServers": {
    "npm-advisor": {
      "command": "npx",
      "args": ["-y", "@agentic-web-labs/npm-advisor-mcp"],
      "env": {
        "GITHUB_TOKEN": "ghp_…"
      }
    }
  }
}
```

The token only needs **public read** scopes — the server never touches private repositories.

## How it works

```
                ┌──────────────────────────────────────┐
                │  Claude Desktop / Code / Cursor /    │
                │  Continue / VSCode (MCP-aware AI)    │
                └─────────────────┬────────────────────┘
                                  │ JSON-RPC over stdio
                                  ▼
            ┌───────────────────────────────────────────┐
            │  npm-advisor-mcp (this package)           │
            │   ┌─────────────────────────────────────┐ │
            │   │ McpServer (modelcontextprotocol)    │ │
            │   │   tools:                            │ │
            │   │   • get_package_stats               │ │
            │   │   • list_workspace_dependencies     │ │
            │   │   • analyze_package_json            │ │
            │   └─────────────────────────────────────┘ │
            │   ┌─────────────────────────────────────┐ │
            │   │ @agentic-web-labs/                  │ │
            │   │   package-analyzer-core             │ │
            │   │   - npm registry                    │ │
            │   │   - GitHub GraphQL (advisories,     │ │
            │   │     stars, last commit)             │ │
            │   │   - Bundlephobia (size)             │ │
            │   │   - OSADL license matrix            │ │
            │   │   - e18e replacement rules          │ │
            │   │   - calculateScore (Fitness)        │ │
            │   └─────────────────────────────────────┘ │
            └───────────────────────────────────────────┘
```

The AI client spawns this process as a subprocess. Tools register on startup, the client lists them, and the model invokes any tool at any time. Every tool result flows back as JSON the model can quote, summarize, or act on.

## Privacy

All API calls go to public endpoints: `registry.npmjs.org`, `bundlephobia.com`, `api.github.com`, and the OSADL license matrix bundled with `@agentic-web-labs/package-analyzer-core`. This server doesn't phone home anywhere else, and reads only files under the workspace path you ask `list_workspace_dependencies` / `analyze_package_json` to scan.

## Build from source

```sh
pnpm install
pnpm build:npm-advisor-mcp
```

Produces `packages/mcp/npm-advisor-mcp/dist/server.js` with a shebang and the executable bit set, so you can also point your AI client straight at it during development:

```json
{
  "mcpServers": {
    "npm-advisor-dev": {
      "command": "node",
      "args": ["/absolute/path/to/dist/server.js"]
    }
  }
}
```

## Related packages

- [`@agentic-web-labs/package-analyzer-core`](../package-analyzer-core) — the analysis engine
- [NPM Advisor Chrome extension](../../extensions/npm-advisor)
- [NPM Advisor VSCode extension](../../extensions/vscode) — also exposes these tools through `@npm-advisor` in Copilot Chat
