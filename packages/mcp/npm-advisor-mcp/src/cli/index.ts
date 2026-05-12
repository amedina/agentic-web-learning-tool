/**
 * External dependencies.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

/**
 * Internal dependencies.
 */
import { parseCliInvocation, type CliInvocation } from "./parseCliInvocation";

const DEFAULT_URL = "http://127.0.0.1:3845/mcp";

const HELP_TEXT = `npm-advisor-mcp-cli — quick MCP client for the npm-advisor HTTP transport

Usage:
  cli list
  cli call <tool-name> [json-args]
  cli help

Options:
  --url <url>      MCP endpoint URL (default: ${DEFAULT_URL})
  --token <token>  Bearer token; falls back to MCP_HTTP_TOKEN env var

Examples:
  cli list
  cli call get_package_stats '{"name":"lodash"}'
  cli --url http://127.0.0.1:4000/mcp call list_known_projects
`;

/**
 * Entry point. Parses argv, opens a Streamable HTTP MCP session, runs
 * the requested command, prints the result, and exits.
 */
async function main(): Promise<void> {
  let invocation: CliInvocation;
  try {
    invocation = parseCliInvocation(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${formatError(error)}\n\n${HELP_TEXT}`);
    process.exit(2);
  }

  if (invocation.command === "help") {
    process.stdout.write(HELP_TEXT);
    return;
  }

  const url = invocation.url ?? DEFAULT_URL;
  const token = invocation.token ?? process.env.MCP_HTTP_TOKEN;

  const client = await connect(url, token);
  try {
    if (invocation.command === "list") {
      await runList(client);
      return;
    }
    await runCall(client, invocation.toolName, invocation.toolArgs);
  } finally {
    await client.close();
  }
}

/**
 * Builds an MCP `Client`, attaches a Streamable HTTP transport pointed
 * at `url`, and completes the initialize handshake.
 */
async function connect(
  url: string,
  token: string | undefined,
): Promise<Client> {
  const transport = new StreamableHTTPClientTransport(new URL(url), {
    requestInit: token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : undefined,
  });
  const client = new Client({
    name: "npm-advisor-mcp-cli",
    version: "0.1.0",
  });
  await client.connect(transport);
  return client;
}

/**
 * Lists every tool the server advertises along with its title and the
 * first line of its description.
 */
async function runList(client: Client): Promise<void> {
  const { tools } = await client.listTools();
  if (tools.length === 0) {
    process.stdout.write("No tools registered.\n");
    return;
  }

  for (const tool of tools) {
    const title = tool.title ?? tool.name;
    const summary = (tool.description ?? "").split("\n", 1)[0];
    process.stdout.write(`• ${tool.name}\n`);
    process.stdout.write(`    ${title}\n`);
    if (summary) {
      process.stdout.write(`    ${summary}\n`);
    }
    process.stdout.write("\n");
  }
}

/**
 * Calls a tool by name with optional JSON arguments and prints the
 * decoded response. Each text-content block is parsed as JSON when
 * possible so the user sees structured output rather than an escaped
 * string blob.
 */
async function runCall(
  client: Client,
  toolName: string,
  toolArgs: Record<string, unknown> | undefined,
): Promise<void> {
  const result = await client.callTool({
    name: toolName,
    arguments: toolArgs ?? {},
  });

  if (result.isError) {
    process.stderr.write(`Tool reported an error.\n`);
  }

  const content = Array.isArray(result.content) ? result.content : [];
  for (const block of content) {
    if (
      block &&
      typeof block === "object" &&
      "type" in block &&
      block.type === "text" &&
      typeof (block as { text?: unknown }).text === "string"
    ) {
      const text = (block as { text: string }).text;
      process.stdout.write(`${prettyJson(text)}\n`);
      continue;
    }
    process.stdout.write(`${JSON.stringify(block, null, 2)}\n`);
  }

  if (result.isError) {
    process.exit(1);
  }
}

/**
 * Returns `value` re-formatted as pretty JSON when it parses; otherwise
 * the original string. Used so tool responses (which arrive as a
 * JSON-stringified text block) render readably without crashing on
 * non-JSON content.
 */
function prettyJson(value: string): string {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

/**
 * Stringifies an arbitrary thrown value for stderr output.
 */
function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

void main().catch((error) => {
  process.stderr.write(`npm-advisor-mcp-cli: ${formatError(error)}\n`);
  process.exit(1);
});
