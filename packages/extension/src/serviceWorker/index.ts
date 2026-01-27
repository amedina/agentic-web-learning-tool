/**
 * External dependencies
 */
import { z } from 'zod';
z.config({ jitless: true });
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { type CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ExtensionServerTransport } from '@mcp-b/transports';
/**
 * Internal dependencies
 */
import { CONNECTION_NAMES, logger } from '../utils';
import McpHub from './mcpHub';
import './chromeListeners';
import './engine';
import handleToolEnableDisableOnLocalStorageChange from './utils/handleToolEnableDisableOnLocalStorageChange';
import { START_MCP_CONNECTION } from '../constants';

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: false })
  .catch((error) => {
    logger(['error'], ['Failed to set panel behavior:', error]);
  });

chrome.runtime.onConnect.addListener(async (port) => {
  if (port.name !== CONNECTION_NAMES.MCP_HOST) {
    return;
  }

  const sharedServer = new McpServer(
    { name: 'Extension-Hub', version: '1.0.0' },
    { capabilities: { tools: { listChanged: true } } }
  );

  const mcpHub = new McpHub(sharedServer);

  chrome.storage.local.onChanged.addListener(
    async (changes: { [key: string]: chrome.storage.StorageChange }) => {
      await handleToolEnableDisableOnLocalStorageChange(changes, mcpHub);
    }
  );

  if (port.sender?.tab?.id !== undefined) {
    await chrome.tabs.sendMessage(port.sender?.tab?.id, START_MCP_CONNECTION);
  }

  const transport = new ExtensionServerTransport(port, {
    keepAlive: true,
    keepAliveInterval: 25_000,
  });

  try {
    //Why this is being done look here https://github.com/modelcontextprotocol/typescript-sdk/issues/893
    sharedServer.registerTool(
      'dummyTool',
      {},
      () =>
        ({
          content: [
            {
              type: 'text',
              text: `Failed to execute tool: Tab connection lost or closed.`,
            },
          ],
          isError: true,
        }) as CallToolResult
    );
  } catch (_error) {
    //supress error
    logger(['warn', 'error'], ['Error registering tool:', _error]);
  }

  sharedServer.connect(transport);
  mcpHub.setupConnections();

  if (mcpHub.registeredTools.size > 0) {
    sharedServer.server?.transport?.send({
      jsonrpc: '2.0',
      method: 'get/Tools',
    });
  }
});
