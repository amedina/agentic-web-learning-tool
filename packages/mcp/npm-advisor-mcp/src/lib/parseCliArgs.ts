/**
 * Default port for the HTTP transport. Picked from the unassigned
 * IANA range; users can override with `--port`.
 */
export const DEFAULT_HTTP_PORT = 3845;

/**
 * Default bind address. Loopback-only by design — exposing the
 * server externally is opt-in via `--host 0.0.0.0` (or any
 * specific interface address).
 */
export const DEFAULT_HTTP_HOST = "127.0.0.1";

/**
 * Parsed result of {@link parseCliArgs}.
 */
export type CliArgs =
  | { transport: "stdio" }
  | {
      transport: "http";
      port: number;
      host: string;
    };

/**
 * Parses `process.argv`-style flag arrays for the npm-advisor-mcp
 * binary. Recognised flags:
 *
 *   --http, --transport=http      Enable the HTTP Streamable transport.
 *   --transport=stdio             Force stdio (the default).
 *   --port=<n>, --port <n>        TCP port for HTTP mode.
 *   --host=<addr>, --host <addr>  Bind address for HTTP mode.
 *
 * Throws if a flag value is missing or unparseable. Any unknown flag
 * is also a hard error so users notice typos rather than silently
 * falling back to defaults. `--help` / `--version` are intercepted by
 * the entry point before this runs, so they never reach here.
 */
export function parseCliArgs(argv: readonly string[]): CliArgs {
  let transport: "stdio" | "http" = "stdio";
  let port = DEFAULT_HTTP_PORT;
  let host = DEFAULT_HTTP_HOST;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--http") {
      transport = "http";
      continue;
    }

    if (token === "--stdio") {
      transport = "stdio";
      continue;
    }

    const transportValue = readFlagValue(token, "--transport", argv, index);
    if (transportValue.matched) {
      const value = transportValue.value;
      if (value !== "stdio" && value !== "http") {
        throw new Error(
          `Unknown --transport value '${value}'. Expected 'stdio' or 'http'.`,
        );
      }
      transport = value;
      index = transportValue.consumedNextToken ? index + 1 : index;
      continue;
    }

    const portValue = readFlagValue(token, "--port", argv, index);
    if (portValue.matched) {
      const parsed = Number.parseInt(portValue.value, 10);
      if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65535) {
        throw new Error(
          `Invalid --port value '${portValue.value}'. Expected an integer 0-65535.`,
        );
      }
      port = parsed;
      index = portValue.consumedNextToken ? index + 1 : index;
      continue;
    }

    const hostValue = readFlagValue(token, "--host", argv, index);
    if (hostValue.matched) {
      if (hostValue.value.length === 0) {
        throw new Error("--host value cannot be empty.");
      }
      host = hostValue.value;
      index = hostValue.consumedNextToken ? index + 1 : index;
      continue;
    }

    throw new Error(`Unknown argument '${token}'. Run with --help for usage.`);
  }

  if (transport === "stdio") {
    return { transport: "stdio" };
  }
  return { transport: "http", port, host };
}

/**
 * Tries to read `--name=value` (single token) or `--name value`
 * (two tokens). Returns whether the flag matched, the resolved value,
 * and whether the caller should advance the index past the next token.
 */
function readFlagValue(
  token: string,
  flag: string,
  argv: readonly string[],
  index: number,
):
  | { matched: true; value: string; consumedNextToken: boolean }
  | { matched: false } {
  if (token === flag) {
    const next = argv[index + 1];
    if (next === undefined) {
      throw new Error(`${flag} requires a value.`);
    }
    return { matched: true, value: next, consumedNextToken: true };
  }
  const prefix = `${flag}=`;
  if (token.startsWith(prefix)) {
    return {
      matched: true,
      value: token.slice(prefix.length),
      consumedNextToken: false,
    };
  }
  return { matched: false };
}
