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
import { CONNECTION_NAMES, logger, MESSAGE_TYPES } from '../utils';
import McpHub from './mcpHub';
import './chromeListeners';
import './engine';
import handleToolEnableDisableOnLocalStorageChange from './utils/handleToolEnableDisableOnLocalStorageChange';
import { START_MCP_CONNECTION } from '../constants';
import { isUrl } from '../view/sidePanel/utils';

const mcpHubInstances = new Map<number, McpHub>();
const serverInstances = new Map<number, McpServer>();

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: false })
  .catch((error) => {
    logger(['error'], ['Failed to set panel behavior:', error]);
  });

chrome.runtime.onConnect.addListener(async (port) => {
  if (port.name !== CONNECTION_NAMES.MCP_HOST) {
    return;
  }
  let tabId = 0;
  if (!port.sender?.url) {
    return;
  }

  if (isUrl(port.sender?.url)) {
    tabId = parseInt(new URL(port.sender?.url).hash.substring(5));
  }

  if (!tabId) {
    return;
  }

  if (mcpHubInstances.has(tabId)) {
    const sharedServer = serverInstances.get(tabId);
    const transport = new ExtensionServerTransport(port, {
      keepAlive: true,
    });
    const mcpHub = mcpHubInstances.get(tabId);

    if (!mcpHub || !sharedServer) {
      return;
    }

    sharedServer.connect(transport);

    chrome.tabs
      .sendMessage(tabId, { type: START_MCP_CONNECTION })
      .catch((error) => {
        logger(
          ['error'],
          ['Failed to send START_MCP_CONNECTION message:', error]
        );
      });

    chrome.tabs
      .sendMessage(tabId, { type: MESSAGE_TYPES.REFRESH_REQUEST })
      .catch((error) => {
        logger(
          ['error'],
          ['Failed to send START_MCP_CONNECTION message:', error]
        );
      });

    if (mcpHub?.registeredTools.size > 0) {
      sharedServer?.server?.transport?.send({
        jsonrpc: '2.0',
        method: 'get/Tools',
      });
    }
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

  const transport = new ExtensionServerTransport(port, {
    keepAlive: true,
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

  mcpHubInstances.set(tabId, mcpHub);
  serverInstances.set(tabId, sharedServer);
  chrome.tabs
    .sendMessage(tabId, { type: START_MCP_CONNECTION })
    .catch((error) => {
      logger(
        ['error'],
        ['Failed to send START_MCP_CONNECTION message:', error]
      );
    });
  if (mcpHub.registeredTools.size > 0) {
    sharedServer.server?.transport?.send({
      jsonrpc: '2.0',
      method: 'get/Tools',
    });
  }
});
