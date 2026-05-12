/**
 * Discriminated union describing what the CLI was asked to do.
 */
export type CliInvocation =
  | { command: "help" }
  | { command: "list"; url?: string; token?: string }
  | {
      command: "call";
      toolName: string;
      toolArgs: Record<string, unknown> | undefined;
      url?: string;
      token?: string;
    };

/**
 * Parses the CLI argv (minus `node` and the script path). Recognised
 * shape:
 *
 *   [global-flags] <command> [command-args]
 *
 * Global flags:
 *   --url <url>       MCP endpoint URL.
 *   --token <token>   Bearer token for the Authorization header.
 *
 * Commands:
 *   list              Lists every tool the server advertises.
 *   call <tool> [json]  Invokes a tool. The trailing arg, if present,
 *                       must parse as a JSON object literal.
 *   help, --help, -h  Prints usage and exits.
 *
 * Throws on unknown flags, missing values, or malformed JSON so the
 * caller can render usage text alongside the error.
 */
export function parseCliInvocation(argv: readonly string[]): CliInvocation {
  let url: string | undefined;
  let token: string | undefined;

  let index = 0;
  while (index < argv.length) {
    const token_ = argv[index];

    if (token_ === "--help" || token_ === "-h" || token_ === "help") {
      return { command: "help" };
    }

    if (token_ === "--url" || token_ === "--token") {
      const value = argv[index + 1];
      if (value === undefined) {
        throw new Error(`${token_} requires a value.`);
      }
      if (token_ === "--url") {
        url = value;
      } else {
        token = value;
      }
      index += 2;
      continue;
    }

    if (token_.startsWith("--url=")) {
      url = token_.slice("--url=".length);
      index += 1;
      continue;
    }

    if (token_.startsWith("--token=")) {
      token = token_.slice("--token=".length);
      index += 1;
      continue;
    }

    break;
  }

  const command = argv[index];

  if (command === undefined) {
    throw new Error("Missing command. Expected one of: list, call, help.");
  }

  if (command === "list") {
    if (index + 1 < argv.length) {
      throw new Error(`Unexpected argument after 'list': ${argv[index + 1]}.`);
    }
    return { command: "list", url, token };
  }

  if (command === "call") {
    const toolName = argv[index + 1];
    if (toolName === undefined || toolName.startsWith("--")) {
      throw new Error("'call' requires a tool name.");
    }

    const rawArgs = argv[index + 2];
    if (rawArgs !== undefined && index + 3 < argv.length) {
      throw new Error("Pass tool arguments as a single JSON-encoded string.");
    }

    let toolArgs: Record<string, unknown> | undefined;
    if (rawArgs !== undefined) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawArgs);
      } catch (error) {
        throw new Error(
          `Tool arguments must be valid JSON: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        throw new Error("Tool arguments must be a JSON object.");
      }
      toolArgs = parsed as Record<string, unknown>;
    }

    return { command: "call", toolName, toolArgs, url, token };
  }

  throw new Error(`Unknown command '${command}'. Expected: list, call, help.`);
}
