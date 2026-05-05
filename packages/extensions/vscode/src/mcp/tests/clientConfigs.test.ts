/**
 * External dependencies.
 */
import { describe, expect, it } from "vitest";

/**
 * Internal dependencies.
 */
import {
  buildClaudeCodeCommand,
  buildJsonMergePayload,
  buildServerEntry,
  getSupportedClients,
  mergeIntoExistingConfig,
  SERVER_KEY_NAME,
} from "../clientConfigs";

describe("getSupportedClients", () => {
  it("returns at least the four canonical clients", () => {
    const ids = getSupportedClients().map((client) => client.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "claude-desktop",
        "cursor",
        "vscode",
        "claude-code",
      ]),
    );
  });

  it("attaches a json-merge config path to every client except claude-code", () => {
    for (const client of getSupportedClients()) {
      if (client.id === "claude-code") {
        expect(client.strategy.kind).toBe("cli-snippet");
      } else {
        expect(client.strategy.kind).toBe("json-merge");
        if (client.strategy.kind === "json-merge") {
          expect(client.strategy.configPath).toBeTruthy();
        }
      }
    }
  });
});

describe("buildServerEntry", () => {
  it("uses node as the launcher and the script path as the only arg", () => {
    const entry = buildServerEntry("/abs/path/server.js");
    expect(entry).toEqual({
      command: "node",
      args: ["/abs/path/server.js"],
    });
  });
});

describe("buildClaudeCodeCommand", () => {
  it("renders a `claude mcp add` command with the script path quoted and the mcpsrv_* tagged key", () => {
    expect(buildClaudeCodeCommand("/path with space/server.js")).toBe(
      'claude mcp add mcpsrv_npm_advisor -- node "/path with space/server.js"',
    );
  });
});

describe("buildJsonMergePayload", () => {
  it("nests under `mcpServers` for non-vscode clients", () => {
    const payload = buildJsonMergePayload(
      "claude-desktop",
      buildServerEntry("/x/server.js"),
    );
    expect(payload).toEqual({
      mcpServers: {
        [SERVER_KEY_NAME]: { command: "node", args: ["/x/server.js"] },
      },
    });
  });

  it("nests under `servers` for the vscode native MCP file", () => {
    const payload = buildJsonMergePayload(
      "vscode",
      buildServerEntry("/x/server.js"),
    );
    expect(payload).toEqual({
      servers: {
        [SERVER_KEY_NAME]: { command: "node", args: ["/x/server.js"] },
      },
    });
  });
});

describe("mergeIntoExistingConfig", () => {
  it("preserves every other top-level key in the existing config", () => {
    const merged = mergeIntoExistingConfig(
      "claude-desktop",
      {
        defaultModel: "claude-3-5-sonnet",
        windowSize: { width: 1024 },
      },
      buildServerEntry("/x/server.js"),
    );
    expect(merged).toMatchObject({
      defaultModel: "claude-3-5-sonnet",
      windowSize: { width: 1024 },
      mcpServers: {
        [SERVER_KEY_NAME]: { command: "node", args: ["/x/server.js"] },
      },
    });
  });

  it("preserves every existing MCP server entry alongside ours", () => {
    const merged = mergeIntoExistingConfig(
      "claude-desktop",
      {
        mcpServers: {
          filesystem: { command: "node", args: ["/other/server.js"] },
        },
      },
      buildServerEntry("/x/server.js"),
    );
    expect(merged.mcpServers).toEqual({
      filesystem: { command: "node", args: ["/other/server.js"] },
      [SERVER_KEY_NAME]: { command: "node", args: ["/x/server.js"] },
    });
  });

  it("overwrites a stale npm-advisor entry rather than duplicating it", () => {
    const merged = mergeIntoExistingConfig(
      "cursor",
      {
        mcpServers: {
          [SERVER_KEY_NAME]: { command: "node", args: ["/old/server.js"] },
        },
      },
      buildServerEntry("/new/server.js"),
    );
    expect(merged.mcpServers).toEqual({
      [SERVER_KEY_NAME]: { command: "node", args: ["/new/server.js"] },
    });
  });

  it("creates the mcpServers map when the existing config has no MCP section", () => {
    const merged = mergeIntoExistingConfig(
      "claude-desktop",
      { unrelated: true },
      buildServerEntry("/x/server.js"),
    );
    expect(merged).toEqual({
      unrelated: true,
      mcpServers: {
        [SERVER_KEY_NAME]: { command: "node", args: ["/x/server.js"] },
      },
    });
  });

  it("uses the `servers` map for vscode and ignores any pre-existing `mcpServers` key", () => {
    const merged = mergeIntoExistingConfig(
      "vscode",
      {
        mcpServers: { other: { command: "x", args: [] } },
      },
      buildServerEntry("/x/server.js"),
    );
    expect(merged).toEqual({
      mcpServers: { other: { command: "x", args: [] } },
      servers: {
        [SERVER_KEY_NAME]: { command: "node", args: ["/x/server.js"] },
      },
    });
  });

  it("strips a legacy `npm-advisor` entry while writing the new mcpsrv_* key", () => {
    const merged = mergeIntoExistingConfig(
      "claude-desktop",
      {
        mcpServers: {
          "npm-advisor": { command: "node", args: ["/legacy/server.js"] },
          filesystem: { command: "node", args: ["/other/server.js"] },
        },
      },
      buildServerEntry("/new/server.js"),
    );
    expect(merged.mcpServers).toEqual({
      filesystem: { command: "node", args: ["/other/server.js"] },
      [SERVER_KEY_NAME]: { command: "node", args: ["/new/server.js"] },
    });
    // Specifically: the legacy key is gone so Claude Desktop's UI
    // doesn't have a second un-disconnectable entry to argue about.
    expect(
      (merged.mcpServers as Record<string, unknown>)["npm-advisor"],
    ).toBeUndefined();
  });

  it("handles a null existing config (file not present) by returning a fresh object", () => {
    const merged = mergeIntoExistingConfig(
      "claude-desktop",
      null,
      buildServerEntry("/x/server.js"),
    );
    expect(merged).toEqual({
      mcpServers: {
        [SERVER_KEY_NAME]: { command: "node", args: ["/x/server.js"] },
      },
    });
  });
});
