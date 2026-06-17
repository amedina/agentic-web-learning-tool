/**
 * External dependencies.
 */
import { describe, expect, it } from "vitest";

/**
 * Internal dependencies.
 */
import { buildTtyHint, buildUsageText } from "../usage";

describe("buildUsageText", () => {
  const text = buildUsageText("@agentic-web-labs/npm-advisor-mcp", "0.4.0");

  it("opens with the package name and version", () => {
    expect(text.startsWith("@agentic-web-labs/npm-advisor-mcp 0.4.0")).toBe(
      true,
    );
  });

  it("states it is an MCP server, not an interactive CLI", () => {
    expect(text).toContain("MCP server, not an interactive CLI");
  });

  it("documents the transport flags and the help/version flags", () => {
    for (const flag of [
      "--http",
      "--port",
      "--host",
      "--transport",
      "-h, --help",
      "-v, --version",
    ]) {
      expect(text).toContain(flag);
    }
  });

  it("documents the GitHub and HTTP auth env vars", () => {
    expect(text).toContain("GITHUB_TOKEN");
    expect(text).toContain("GH_TOKEN");
    expect(text).toContain("MCP_HTTP_TOKEN");
  });

  it("includes a ready-to-paste mcpServers config and an MCP Inspector command", () => {
    expect(text).toContain('"mcpServers"');
    expect(text).toContain(
      "npx @modelcontextprotocol/inspector npx -y @agentic-web-labs/npm-advisor-mcp",
    );
  });
});

describe("buildTtyHint", () => {
  const hint = buildTtyHint("@agentic-web-labs/npm-advisor-mcp");

  it("explains the process is an MCP server waiting on stdin", () => {
    expect(hint).toContain("MCP server");
    expect(hint).toContain("waiting for an MCP client");
  });

  it("points at --help and the MCP Inspector, and how to exit", () => {
    expect(hint).toContain("--help");
    expect(hint).toContain("npx @modelcontextprotocol/inspector");
    expect(hint).toContain("Ctrl+C");
  });
});
