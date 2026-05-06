/**
 * External dependencies.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Internal dependencies.
 */
import { type McpClientDescriptor, SERVER_KEY_NAME } from "../clientConfigs";
import {
  getClientStatus,
  installForClient,
  removeForClient,
} from "../operations";

/**
 * Builds an absolute-path json-merge client descriptor for tests.
 * Skipping `getSupportedClients()` lets us point at a temp file that
 * we control; using an absolute configPath also bypasses the
 * workspace-folder resolver, so the tests don't depend on the
 * vscodeMock's workspace state.
 */
function makeClient(
  id: McpClientDescriptor["id"],
  configPath: string,
): McpClientDescriptor {
  return {
    id,
    label: `${id} (test)`,
    description: "test descriptor",
    strategy: { kind: "json-merge", configPath },
  };
}

const SERVER_PATH = "/abs/path/to/server.js";

let tempDir: string;
let configPath: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "mcp-ops-"));
  configPath = join(tempDir, "config.json");
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("getClientStatus", () => {
  it("returns no-config when the file does not exist yet", () => {
    const status = getClientStatus(
      makeClient("claude-desktop", configPath),
      SERVER_PATH,
    );
    expect(status).toEqual({ kind: "no-config", configPath });
  });

  it("returns not-installed when the file has no mcpServers map", () => {
    writeFileSync(configPath, JSON.stringify({ defaultModel: "x" }));
    const status = getClientStatus(
      makeClient("claude-desktop", configPath),
      SERVER_PATH,
    );
    expect(status).toEqual({ kind: "not-installed", configPath });
  });

  it("returns not-installed when our key is absent from the map", () => {
    writeFileSync(
      configPath,
      JSON.stringify({
        mcpServers: {
          filesystem: { command: "node", args: ["/other.js"] },
        },
      }),
    );
    const status = getClientStatus(
      makeClient("claude-desktop", configPath),
      SERVER_PATH,
    );
    expect(status).toEqual({ kind: "not-installed", configPath });
  });

  it("returns installed when the entry's path matches the current server path", () => {
    writeFileSync(
      configPath,
      JSON.stringify({
        mcpServers: {
          [SERVER_KEY_NAME]: { command: "node", args: [SERVER_PATH] },
        },
      }),
    );
    const status = getClientStatus(
      makeClient("claude-desktop", configPath),
      SERVER_PATH,
    );
    expect(status).toEqual({ kind: "installed", configPath });
  });

  it("returns installed-stale when the entry points at a different path", () => {
    writeFileSync(
      configPath,
      JSON.stringify({
        mcpServers: {
          [SERVER_KEY_NAME]: { command: "node", args: ["/old/server.js"] },
        },
      }),
    );
    const status = getClientStatus(
      makeClient("claude-desktop", configPath),
      SERVER_PATH,
    );
    expect(status).toEqual({
      kind: "installed-stale",
      configPath,
      currentPath: "/old/server.js",
    });
  });

  it("uses the `servers` map for the vscode native MCP client", () => {
    writeFileSync(
      configPath,
      JSON.stringify({
        servers: {
          [SERVER_KEY_NAME]: { command: "node", args: [SERVER_PATH] },
        },
      }),
    );
    const status = getClientStatus(
      makeClient("vscode", configPath),
      SERVER_PATH,
    );
    expect(status).toEqual({ kind: "installed", configPath });
  });

  it("returns error when the file is unparseable JSON", () => {
    writeFileSync(configPath, "{not json");
    const status = getClientStatus(
      makeClient("claude-desktop", configPath),
      SERVER_PATH,
    );
    expect(status.kind).toBe("error");
    if (status.kind === "error") {
      expect(status.configPath).toBe(configPath);
    }
  });

  it("returns cli-snippet for the Claude Code descriptor without touching the fs", () => {
    const status = getClientStatus(
      {
        id: "claude-code",
        label: "Claude Code",
        description: "test",
        strategy: { kind: "cli-snippet" },
      },
      SERVER_PATH,
    );
    expect(status).toEqual({ kind: "cli-snippet" });
  });
});

describe("installForClient", () => {
  it("creates the config file with our entry under mcpServers", () => {
    const result = installForClient(
      makeClient("claude-desktop", configPath),
      SERVER_PATH,
    );
    expect(result).toEqual({ ok: true });
    const written = JSON.parse(readFileSync(configPath, "utf8")) as Record<
      string,
      unknown
    >;
    expect(written.mcpServers).toEqual({
      [SERVER_KEY_NAME]: { command: "node", args: [SERVER_PATH] },
    });
  });

  it("preserves every other top-level key when merging into an existing file", () => {
    writeFileSync(
      configPath,
      JSON.stringify({
        defaultModel: "x",
        mcpServers: {
          filesystem: { command: "node", args: ["/other.js"] },
        },
      }),
    );
    const result = installForClient(
      makeClient("claude-desktop", configPath),
      SERVER_PATH,
    );
    expect(result).toEqual({ ok: true });
    const written = JSON.parse(readFileSync(configPath, "utf8")) as Record<
      string,
      unknown
    >;
    expect(written).toMatchObject({
      defaultModel: "x",
      mcpServers: {
        filesystem: { command: "node", args: ["/other.js"] },
        [SERVER_KEY_NAME]: { command: "node", args: [SERVER_PATH] },
      },
    });
  });

  it("returns an error result for cli-snippet descriptors", () => {
    const result = installForClient(
      {
        id: "claude-code",
        label: "Claude Code",
        description: "test",
        strategy: { kind: "cli-snippet" },
      },
      SERVER_PATH,
    );
    expect(result.ok).toBe(false);
  });
});

describe("removeForClient", () => {
  it("returns nothingToDo=true when the config file does not exist", () => {
    const result = removeForClient(makeClient("claude-desktop", configPath));
    expect(result).toEqual({ ok: true, nothingToDo: true });
  });

  it("returns nothingToDo=true when our entry is not present", () => {
    writeFileSync(
      configPath,
      JSON.stringify({
        mcpServers: { other: { command: "x", args: [] } },
      }),
    );
    const result = removeForClient(makeClient("claude-desktop", configPath));
    expect(result).toEqual({ ok: true, nothingToDo: true });
    const stillThere = JSON.parse(readFileSync(configPath, "utf8")) as Record<
      string,
      unknown
    >;
    expect(stillThere.mcpServers).toEqual({
      other: { command: "x", args: [] },
    });
  });

  it("strips our entry and reports ok without nothingToDo when it removed something", () => {
    writeFileSync(
      configPath,
      JSON.stringify({
        defaultModel: "x",
        mcpServers: {
          filesystem: { command: "node", args: ["/other.js"] },
          [SERVER_KEY_NAME]: { command: "node", args: [SERVER_PATH] },
        },
      }),
    );
    const result = removeForClient(makeClient("claude-desktop", configPath));
    expect(result.ok).toBe(true);
    expect(result).not.toHaveProperty("nothingToDo", true);
    const written = JSON.parse(readFileSync(configPath, "utf8")) as Record<
      string,
      unknown
    >;
    expect(written).toMatchObject({
      defaultModel: "x",
      mcpServers: {
        filesystem: { command: "node", args: ["/other.js"] },
      },
    });
    expect(
      (written.mcpServers as Record<string, unknown>)[SERVER_KEY_NAME],
    ).toBeUndefined();
  });
});
