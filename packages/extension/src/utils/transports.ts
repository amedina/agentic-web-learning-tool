import { ExtensionClientTransport } from "@mcp-b/transports";
import { Client } from "@modelcontextprotocol/sdk/client";
import { CONNECTION_NAMES } from "./constants";

export const transport = new ExtensionClientTransport({
  portName: CONNECTION_NAMES.MCP_HOST,
});

//MCP client instance that connects to the extension background script
export const client = new Client({
  name: "Extension Sidepanel",
  version: "1.0.0",
});