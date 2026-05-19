/**
 * External dependencies.
 */
import { GithubRateLimitError } from "@agentic-web-labs/package-analyzer-core";

/**
 * MCP CallToolResult shape every tool in this server returns. The MCP SDK
 * accepts richer content types, but npm-advisor-mcp always returns a single
 * stringified-JSON `text` block so any client AI can parse it deterministically.
 */
export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
  [key: string]: unknown;
}

/**
 * Runs a tool handler and wraps its return value in an MCP CallToolResult.
 *
 * When the handler (or anything it transitively calls in analyzer-core)
 * throws a `GithubRateLimitError`, the failure is converted into an
 * `isError` result whose text tells the model exactly how the user can
 * lift the limit — otherwise the model only sees the opaque
 * `GITHUB_RATE_LIMIT` marker and can't give actionable guidance.
 *
 * Any other error rethrows so the MCP SDK turns it into a JSON-RPC error.
 */
export async function runTool<T>(
  handler: () => Promise<T>,
): Promise<ToolResult> {
  try {
    const value = await handler();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(value, null, 2),
        },
      ],
    };
  } catch (error) {
    if (error instanceof GithubRateLimitError) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `${error.message}\n\nTo lift this limit from 60 requests/hour to 5,000 requests/hour, ask the user to set a GitHub personal-access token in the npm-advisor-mcp entry of their MCP client config (e.g. claude_desktop_config.json):\n\n  "env": { "GITHUB_TOKEN": "ghp_..." }\n\nThe token only needs "public read" scope. See the npm-advisor-mcp README "GitHub authentication" section for full setup.`,
          },
        ],
      };
    }
    throw error;
  }
}
