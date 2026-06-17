/**
 * Usage and hint text for the npm-advisor-mcp binary. Kept as pure
 * string builders with no I/O so the entry point stays thin and the
 * copy is unit-testable.
 */

/**
 * Builds the `--help` usage text. Explains that this is an MCP server
 * (not an interactive CLI), lists the transport flags and env vars, and
 * shows a ready-to-paste client config plus a no-client test command.
 *
 * @param name Distribution name, e.g. `@agentic-web-labs/npm-advisor-mcp`.
 * @param version Package version, e.g. `0.4.0`.
 */
export function buildUsageText(name: string, version: string): string {
  return `${name} ${version}

A Model Context Protocol (MCP) server exposing npm package intelligence
(security, license, scoring, recommendations) to MCP-aware AI clients.

This is an MCP server, not an interactive CLI. By default it speaks MCP over
stdio and is meant to be spawned by an MCP-aware client such as Claude Code,
Claude Desktop, Cursor, VSCode, or Continue.

Usage:
  npx -y ${name} [options]

Options:
  --http                    Serve MCP over Streamable HTTP instead of stdio.
  --port <n>                HTTP port (default 3845).
  --host <addr>             HTTP bind address (default 127.0.0.1; use 0.0.0.0 to expose).
  --transport <stdio|http>  Select the transport explicitly (default stdio).
  -h, --help                Show this help and exit.
  -v, --version             Show the version and exit.

Environment:
  GITHUB_TOKEN, GH_TOKEN    Public-read GitHub token; lifts the GitHub API limit
                            from 60 to 5,000 req/hr.
  MCP_HTTP_TOKEN            Bearer token required for non-loopback HTTP mode.

Configure an MCP client (example):
  {
    "mcpServers": {
      "npm-advisor": {
        "command": "npx",
        "args": ["-y", "${name}"],
        "env": { "GITHUB_TOKEN": "ghp_..." }
      }
    }
  }

Try it without a client, using the MCP Inspector:
  npx @modelcontextprotocol/inspector npx -y ${name}
`;
}

/**
 * Builds the short hint printed to stderr when the binary is launched
 * directly in a terminal (stdin is a TTY) rather than spawned by an MCP
 * client. Without it the process just sits silently waiting on stdin,
 * which reads as a hang.
 *
 * @param name Distribution name, e.g. `@agentic-web-labs/npm-advisor-mcp`.
 */
export function buildTtyHint(name: string): string {
  return `${name} is an MCP server, not an interactive CLI. It is now waiting for an MCP client to drive it over stdio.
  - Run with --help for usage and an example client configuration.
  - Try it now: npx @modelcontextprotocol/inspector npx -y ${name}
Press Ctrl+C to exit.
`;
}
