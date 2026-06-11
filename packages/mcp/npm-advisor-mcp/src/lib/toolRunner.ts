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
 * Every failure surface is normalised into an `isError: true` result with a
 * structured-but-human-readable text payload — never rethrown — so the MCP
 * SDK doesn't turn it into a JSON-RPC error that aborts the entire session.
 * The client model sees a recoverable response it can reason about and tell
 * the user what to do, instead of an opaque protocol-level failure.
 *
 * Special-cases:
 *  - {@link GithubRateLimitError} adds GitHub-token setup guidance so the
 *    user has a clear path to lifting the 60 req/hr limit.
 *  - Errors with a recognisable `code` (e.g. `ENOENT` from filesystem
 *    operations) include the code in the payload so the model can tell
 *    "file not found" apart from "permission denied".
 *
 * @param handler - The tool's async work. May throw or return any
 *   JSON-serialisable value.
 * @returns A {@link ToolResult} ready for the SDK to ship over the wire.
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
      return githubRateLimitResult(error);
    }
    return genericErrorResult(error);
  }
}

/**
 * Render the GitHub rate-limit error with explicit guidance for the
 * caller's user. Kept separate from the generic path so the
 * remediation text doesn't grow as more error classes pick up bespoke
 * advice.
 */
function githubRateLimitResult(error: GithubRateLimitError): ToolResult {
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

/**
 * Render an arbitrary thrown value as an `isError: true` content block.
 * Logs the full stack to stderr (so server operators retain a debug
 * trail) and emits a compact JSON payload to the wire so the LLM can
 * differentiate failure modes without having to parse a free-form
 * stack trace.
 */
function genericErrorResult(error: unknown): ToolResult {
  const errorName = error instanceof Error ? error.name : "Error";
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown error";
  const code =
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
      ? (error as { code: string }).code
      : undefined;

  // Stack traces are useful when reading server logs but should not be
  // exposed to the LLM — they're large, fragile across builds, and
  // often leak filesystem paths that don't add value to the model's
  // reasoning. Log the stack to stderr, keep the wire payload tight.
  if (error instanceof Error && error.stack) {
    process.stderr.write(`npm-advisor-mcp tool error: ${error.stack}\n`);
  }

  const payload: {
    error: string;
    name: string;
    code?: string;
  } = { error: message, name: errorName };
  if (code) {
    payload.code = code;
  }

  return {
    isError: true,
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}
