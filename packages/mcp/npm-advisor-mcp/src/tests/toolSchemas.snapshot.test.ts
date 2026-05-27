/**
 * External dependencies.
 */
import { describe, expect, it } from "vitest";
import { toJSONSchema, z } from "zod";

/**
 * Internal dependencies.
 */
import { createServer } from "../server";

/**
 * Minimal shape this test reads off the SDK's private tool registry.
 * We treat the rest of the entry as opaque so a future SDK change
 * adding fields doesn't crash this test.
 */
interface RegisteredToolEntry {
  title?: string;
  description?: string;
  inputSchema?: z.ZodType;
}

/**
 * Pull the registered tools off the SDK's private map. The MCP SDK
 * doesn't expose a public list-of-registered-tools API; the snapshot
 * test reads the internal field so we can serialise input schemas
 * without spinning up a transport.
 */
function registeredTools(
  server: Awaited<ReturnType<typeof createServer>>,
): Record<string, RegisteredToolEntry> {
  return (
    server as unknown as {
      _registeredTools: Record<string, RegisteredToolEntry>;
    }
  )._registeredTools;
}

/**
 * Turn a registered tool entry into the snapshot payload. Includes
 * title + description so accidental wording changes are caught, plus
 * the JSON-schema serialisation of the input shape so accidental
 * removal / rename / required-flag-flip of any input field shows up
 * as a snapshot diff.
 */
function snapshotShape(tool: RegisteredToolEntry): unknown {
  const inputSchema = tool.inputSchema
    ? toJSONSchema(tool.inputSchema, { target: "draft-2020-12" })
    : null;
  return {
    title: tool.title ?? null,
    description: tool.description ?? null,
    inputSchema,
  };
}

describe("MCP tool schemas - snapshot", () => {
  it("registered tool names match the locked set", async () => {
    const server = await createServer();
    const tools = registeredTools(server);
    // Order-stable to make accidental tool removal / addition obvious
    // in a snapshot diff.
    expect(Object.keys(tools).sort()).toMatchInlineSnapshot(`
      [
        "analyze_package_json",
        "analyze_project",
        "get_package_stats",
        "list_known_projects",
        "list_workspace_dependencies",
      ]
    `);
  });

  it("input schema for every tool matches the locked snapshot", async () => {
    const server = await createServer();
    const tools = registeredTools(server);
    const payload: Record<string, unknown> = {};
    for (const name of Object.keys(tools).sort()) {
      payload[name] = snapshotShape(tools[name]);
    }
    // Falls back to a file-based snapshot stored alongside this test.
    // Updating it requires `pnpm vitest -u` — that's intentional
    // friction so a tool-surface change is a deliberate act.
    expect(payload).toMatchSnapshot();
  });
});
