/**
 * External dependencies.
 */
import { describe, expect, it } from "vitest";

/**
 * Internal dependencies.
 */
import {
  buildClaudeCodeCommand,
  buildClaudeCodeRemoveCommand,
  buildJsonMergePayload,
  buildServerEntry,
  getSupportedClients,
  mergeIntoExistingConfig,
  removeFromExistingConfig,
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
  it("renders a `claude mcp add` command with the script path quoted", () => {
    expect(buildClaudeCodeCommand("/path with space/server.js")).toBe(
      `claude mcp add ${SERVER_KEY_NAME} -- node "/path with space/server.js"`,
    );
  });
});

describe("buildClaudeCodeRemoveCommand", () => {
  it("renders the matching `claude mcp remove` command", () => {
    expect(buildClaudeCodeRemoveCommand()).toBe(
      `claude mcp remove ${SERVER_KEY_NAME}`,
    );
  });

  it("uses Claude Desktop's mcpsrv_<uuid> format for the server key", () => {
    expect(SERVER_KEY_NAME).toMatch(
      /^mcpsrv_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
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

  it("strips a legacy `mcpsrv_npm_advisor` entry while writing the current key", () => {
    const merged = mergeIntoExistingConfig(
      "claude-desktop",
      {
        mcpServers: {
          mcpsrv_npm_advisor: {
            command: "node",
            args: ["/legacy/server.js"],
          },
          filesystem: { command: "node", args: ["/other/server.js"] },
        },
      },
      buildServerEntry("/new/server.js"),
    );
    expect(merged.mcpServers).toEqual({
      filesystem: { command: "node", args: ["/other/server.js"] },
      [SERVER_KEY_NAME]: { command: "node", args: ["/new/server.js"] },
    });
    // Specifically: the legacy key is gone so the user doesn't end
    // up with two registrations of the same server after a rename.
    expect(
      (merged.mcpServers as Record<string, unknown>).mcpsrv_npm_advisor,
    ).toBeUndefined();
  });

  it("strips a legacy `npm-advisor` entry while writing the current key", () => {
    const merged = mergeIntoExistingConfig(
      "claude-desktop",
      {
        mcpServers: {
          "npm-advisor": {
            command: "node",
            args: ["/legacy/server.js"],
          },
          filesystem: { command: "node", args: ["/other/server.js"] },
        },
      },
      buildServerEntry("/new/server.js"),
    );
    expect(merged.mcpServers).toEqual({
      filesystem: { command: "node", args: ["/other/server.js"] },
      [SERVER_KEY_NAME]: { command: "node", args: ["/new/server.js"] },
    });
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

describe("removeFromExistingConfig", () => {
  it("strips the current SERVER_KEY entry and reports removed=true", () => {
    const result = removeFromExistingConfig("claude-desktop", {
      mcpServers: {
        [SERVER_KEY_NAME]: { command: "node", args: ["/x/server.js"] },
      },
    });
    expect(result.removed).toBe(true);
    expect(result.config.mcpServers).toEqual({});
  });

  it("strips the legacy mcpsrv_npm_advisor entry too", () => {
    const result = removeFromExistingConfig("claude-desktop", {
      mcpServers: {
        mcpsrv_npm_advisor: { command: "node", args: ["/legacy/server.js"] },
      },
    });
    expect(result.removed).toBe(true);
    expect(result.config.mcpServers).toEqual({});
  });

  it("strips the legacy `npm-advisor` entry too", () => {
    const result = removeFromExistingConfig("claude-desktop", {
      mcpServers: {
        "npm-advisor": { command: "node", args: ["/legacy/server.js"] },
      },
    });
    expect(result.removed).toBe(true);
    expect(result.config.mcpServers).toEqual({});
  });

  it("preserves every other MCP server entry alongside ours", () => {
    const result = removeFromExistingConfig("claude-desktop", {
      mcpServers: {
        filesystem: { command: "node", args: ["/other/server.js"] },
        [SERVER_KEY_NAME]: { command: "node", args: ["/x/server.js"] },
      },
    });
    expect(result.removed).toBe(true);
    expect(result.config.mcpServers).toEqual({
      filesystem: { command: "node", args: ["/other/server.js"] },
    });
  });

  it("preserves every other top-level key in the existing config", () => {
    const result = removeFromExistingConfig("claude-desktop", {
      defaultModel: "claude-3-5-sonnet",
      mcpServers: {
        [SERVER_KEY_NAME]: { command: "node", args: ["/x/server.js"] },
      },
    });
    expect(result.config).toMatchObject({
      defaultModel: "claude-3-5-sonnet",
      mcpServers: {},
    });
  });

  it("uses the `servers` map for vscode native MCP", () => {
    const result = removeFromExistingConfig("vscode", {
      servers: {
        [SERVER_KEY_NAME]: { command: "node", args: ["/x/server.js"] },
        other: { command: "x", args: [] },
      },
    });
    expect(result.removed).toBe(true);
    expect(result.config.servers).toEqual({
      other: { command: "x", args: [] },
    });
  });

  it("returns removed=false when no npm-advisor entry is present", () => {
    const result = removeFromExistingConfig("claude-desktop", {
      mcpServers: { other: { command: "x", args: [] } },
    });
    expect(result.removed).toBe(false);
    expect(result.config.mcpServers).toEqual({
      other: { command: "x", args: [] },
    });
  });

  it("returns removed=false when the existing config has no MCP map at all", () => {
    const result = removeFromExistingConfig("claude-desktop", {
      defaultModel: "claude-3-5-sonnet",
    });
    expect(result.removed).toBe(false);
    expect(result.config).toEqual({ defaultModel: "claude-3-5-sonnet" });
  });

  it("returns removed=false on a null (missing) existing config", () => {
    const result = removeFromExistingConfig("claude-desktop", null);
    expect(result.removed).toBe(false);
    expect(result.config).toEqual({});
  });
});
