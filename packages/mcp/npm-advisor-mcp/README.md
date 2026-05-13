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

It speaks MCP over stdio by default. Configure your AI client to spawn it as below — or jump to [HTTP transport](#http-transport-host-it-on-localhost-or-a-remote-server) to run it as a long-lived local or remote server instead.

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

## HTTP transport (host it on localhost or a remote server)

By default the binary speaks MCP over stdio so AI clients can spawn it as a subprocess. Pass `--http` to instead start a Streamable HTTP server — useful when you want one running instance shared between several clients on your machine, or when you want to host npm-advisor on a remote server and connect to it over the network.

### Run locally

```sh
npx -y @agentic-web-labs/npm-advisor-mcp --http
```

This binds to `127.0.0.1:3845` (loopback only — not reachable from other machines) and serves MCP at `http://127.0.0.1:3845/mcp`.

Override the port and host with flags:

```sh
npx -y @agentic-web-labs/npm-advisor-mcp --http --port 4000 --host 127.0.0.1
```

Point any MCP-aware client at the URL. For example, Claude Desktop:

```json
{
  "mcpServers": {
    "npm-advisor": {
      "transport": "http",
      "url": "http://127.0.0.1:3845/mcp"
    }
  }
}
```

### Host it remotely

To accept connections from other machines, bind to a non-loopback address (`0.0.0.0` for all interfaces, or a specific interface IP):

```sh
MCP_HTTP_TOKEN=your-long-random-token \
  npx -y @agentic-web-labs/npm-advisor-mcp --http --host 0.0.0.0 --port 3845
```

When `MCP_HTTP_TOKEN` is set, every request must include:

```
Authorization: Bearer your-long-random-token
```

The server prints a warning to stderr if you bind to a non-loopback address without a token. Public deployments should also sit behind a reverse proxy that terminates TLS (`https://`) — the server itself only speaks plain HTTP.

A typical Claude Desktop entry pointing at a hosted instance:

```json
{
  "mcpServers": {
    "npm-advisor": {
      "transport": "http",
      "url": "https://npm-advisor.example.com/mcp",
      "headers": {
        "Authorization": "Bearer your-long-random-token"
      }
    }
  }
}
```

### End-to-end deployment recipe (Linux + systemd + Caddy)

A complete walkthrough for putting npm-advisor-mcp on a fresh Linux VM and exposing it over HTTPS. Substitute your own distro / process manager / reverse proxy as needed — the moving parts are the same.

#### 1. Install Node and the package

```sh
# Debian / Ubuntu
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs
sudo npm install -g @agentic-web-labs/npm-advisor-mcp
```

A global install keeps the systemd unit simple. `npx` works too but pays a cold-cache cost on the first invocation after each restart.

#### 2. Generate a bearer token and store it in an env file

```sh
sudo install -m 600 /dev/null /etc/npm-advisor-mcp.env
printf 'MCP_HTTP_TOKEN=%s\n' "$(openssl rand -hex 32)" | sudo tee -a /etc/npm-advisor-mcp.env
# Optional — lifts the GitHub API rate limit from 60/h to 5000/h.
echo 'GITHUB_TOKEN=ghp_…' | sudo tee -a /etc/npm-advisor-mcp.env
```

Mode `600` ensures only `root` and the eventual service user can read the token.

#### 3. Run under systemd

Create a dedicated unprivileged user, then `/etc/systemd/system/npm-advisor-mcp.service`:

```sh
sudo useradd --system --no-create-home --shell /usr/sbin/nologin npm-advisor
sudo chown npm-advisor:npm-advisor /etc/npm-advisor-mcp.env
```

```ini
[Unit]
Description=npm-advisor MCP server (Streamable HTTP)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=npm-advisor
EnvironmentFile=/etc/npm-advisor-mcp.env
ExecStart=/usr/bin/npm-advisor-mcp --http --host 127.0.0.1 --port 3845
Restart=on-failure
RestartSec=2
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true

[Install]
WantedBy=multi-user.target
```

Bind to `127.0.0.1`: Caddy faces the Internet and proxies to npm-advisor over loopback, so the bearer token never crosses the public wire in plain HTTP.

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now npm-advisor-mcp
sudo systemctl status npm-advisor-mcp
```

#### 4. Terminate TLS with Caddy

Install Caddy, then write `/etc/caddy/Caddyfile`:

```caddy
npm-advisor.example.com {
    reverse_proxy 127.0.0.1:3845
}
```

```sh
sudo systemctl reload caddy
```

Caddy obtains an HTTPS certificate from Let's Encrypt on the first request to `npm-advisor.example.com`. The bearer-token check stays inside npm-advisor-mcp.

If you prefer nginx, the equivalent location block is:

```nginx
location /mcp {
    proxy_pass http://127.0.0.1:3845/mcp;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;          # streaming responses are SSE
    proxy_read_timeout 600s;
}
```

#### 5. Open only ports 80 and 443

```sh
sudo ufw allow 80/tcp     # required for Let's Encrypt HTTP-01
sudo ufw allow 443/tcp
```

**Do not expose port `3845`.** The MCP server stays on loopback; only the reverse proxy talks to it.

#### 6. Smoke-test from your laptop

```sh
# Should be rejected with HTTP 401 (auth is enforced)
curl -sS -o /dev/null -w '%{http_code}\n' -X POST \
  https://npm-advisor.example.com/mcp \
  -H 'Content-Type: application/json' \
  -d '{}'

# With the right token, the MCP handshake should at least reach the server
curl -sS -X POST https://npm-advisor.example.com/mcp \
  -H "Authorization: Bearer $(sudo awk -F= '/^MCP_HTTP_TOKEN/{print $2}' /etc/npm-advisor-mcp.env)" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"smoke-test","version":"0"}}}'
```

The second call should return a JSON-RPC `result` with a server `protocolVersion`. From there, point your AI client at `https://npm-advisor.example.com/mcp` with the bearer token (see the snippet above), or use the [built-in CLI](#built-in-cli-for-the-http-transport) with `--url` and `--token` for richer probing.

#### Operational notes

- **Updates**: `sudo npm install -g @agentic-web-labs/npm-advisor-mcp@latest && sudo systemctl restart npm-advisor-mcp`.
- **Token rotation**: edit `/etc/npm-advisor-mcp.env`, `sudo systemctl restart npm-advisor-mcp`, update every client config. The server uses the value present at startup.
- **Logs**: `journalctl -u npm-advisor-mcp -f` (the binding-without-token warning lands here if you ever flip `--host` to `0.0.0.0`).
- **Resource footprint**: idle process is a couple of MB of RSS; bursts during `analyze_package_json` come from concurrent HTTPS connections to npm + GitHub, not local CPU.

### CLI flags

| Flag | Default | Description |
| --- | --- | --- |
| `--http` | (off — stdio mode) | Switch to the Streamable HTTP transport. |
| `--port <n>` | `3845` | TCP port to listen on. |
| `--host <addr>` | `127.0.0.1` | Bind address. Use `0.0.0.0` to expose on all interfaces. |
| `--transport stdio\|http` | `stdio` | Long form of `--http` / `--stdio`. |

`--port`, `--host`, and `--transport` also accept the `--name=value` form.

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
                                  │   or Streamable HTTP (--http)
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

The AI client either spawns this process as a subprocess (stdio mode, default) or connects to a long-running HTTP instance (Streamable HTTP mode, `--http`). Either way, tools register on startup, the client lists them, and the model invokes any tool at any time. Every tool result flows back as JSON the model can quote, summarize, or act on.

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

To run the built server directly from the repo root for local testing (e.g. against the [MCP Inspector](https://github.com/modelcontextprotocol/inspector)):

```sh
# stdio mode
pnpm start:npm-advisor-mcp

# Streamable HTTP mode on http://127.0.0.1:3845/mcp
pnpm start:npm-advisor-mcp:http
```

### Built-in CLI for the HTTP transport

The package ships a tiny client CLI at `dist/cli.js` that talks to a running HTTP server using the same MCP SDK clients like Claude Desktop use — handy for invoking tools and inspecting responses without setting up the MCP Inspector or hand-rolling `curl` JSON-RPC calls.

Start the server in one terminal, then from the repo root:

```sh
# List every tool the server advertises
pnpm cli:npm-advisor-mcp list

# Call a tool — pass arguments as a single JSON object
pnpm cli:npm-advisor-mcp call get_package_stats '{"name":"lodash"}'
pnpm cli:npm-advisor-mcp call list_known_projects
```

By default the CLI connects to `http://127.0.0.1:3845/mcp`. Override the URL or pass a bearer token (for servers started with `MCP_HTTP_TOKEN`) with global flags before the command:

```sh
pnpm cli:npm-advisor-mcp --url http://127.0.0.1:4000/mcp list
pnpm cli:npm-advisor-mcp --token your-token call list_known_projects
```

`MCP_HTTP_TOKEN` is also read from the environment if `--token` is omitted. Run `pnpm cli:npm-advisor-mcp help` for the full usage block.

## Related packages

- [`@agentic-web-labs/package-analyzer-core`](../package-analyzer-core) — the analysis engine
- [NPM Advisor Chrome extension](../../extensions/npm-advisor)
- [NPM Advisor VSCode extension](../../extensions/vscode) — also exposes these tools through `@npm-advisor` in Copilot Chat
