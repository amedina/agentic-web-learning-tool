import { ExtensionClientTransport } from "@mcp-b/transports";
import { Client } from "@modelcontextprotocol/sdk/client";

export const transport = new ExtensionClientTransport({
  portName: "mcp",
});

// Create MCP client
export const client = new Client({
  name: "Extension Sidepanel",
  version: "1.0.0",
});