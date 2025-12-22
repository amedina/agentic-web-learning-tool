/**
 * External dependencies
 */
import { z } from 'zod';
z.config({jitless: true});
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { type CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ExtensionServerTransport } from '@mcp-b/transports';
/**
 * Internal dependencies
 */
import { CONNECTION_NAMES } from '../utils/constants';
import McpHub from './mcpHub';
import './chromeListeners';

const sharedServer = new McpServer({ name: 'Extension-Hub', version: '1.0.0' }, { capabilities: { tools: { listChanged: true } } });

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Initialize the MCP Server and Hub
const mcpHub = new McpHub(sharedServer);

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== CONNECTION_NAMES.MCP_HOST) {
    return;
  }

  const transport = new ExtensionServerTransport(port, {
    keepAlive: true,
    keepAliveInterval: 25_000,
  });
  try {
    //Why this is being done look herehttps://github.com/modelcontextprotocol/typescript-sdk/issues/893
    sharedServer.registerTool('dummyTool', {}, () =>
    ({
      content: [{ type: 'text', text: `Failed to execute tool: Tab connection lost or closed.` }],
      isError: true,
    } as CallToolResult)
    );
  } catch (_error) {
    //supress error
  }
  sharedServer.connect(transport);
  mcpHub.setupConnections();
  if (mcpHub.registeredTools.size > 0) {
    sharedServer.server?.transport?.send({
      jsonrpc: '2.0',
      method: 'get/Tools'
    });
  }
});
