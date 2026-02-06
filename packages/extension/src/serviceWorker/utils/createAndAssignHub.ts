/**
 * External dependencies
 */
import { ExtensionServerTransport } from '@mcp-b/transports';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
/**
 * Internal dependencies
 */
import { START_MCP_CONNECTION } from '../../constants';
import { logger, MESSAGE_TYPES } from '../../utils';
import McpHub from '../mcpHub';
import handleToolEnableDisableOnLocalStorageChange from './handleToolEnableDisableOnLocalStorageChange';

const createAndAssignHub = (
  mcpHubInstances: Map<number, McpHub>,
  port: chrome.runtime.Port,
  serverInstances: Map<number, McpServer>,
  tabId: number
) => {
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

  const mcpHub = new McpHub(sharedServer, tabId);

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

  mcpHubInstances.set(tabId, mcpHub);
  serverInstances.set(tabId, sharedServer);
  chrome.tabs
    .sendMessage(tabId, { type: START_MCP_CONNECTION })
    .then(() => {
      if (chrome?.runtime?.lastError) {
        return;
      }
      mcpHub.injectToolsAndRegisterFunction(tabId);
      mcpHub.injectWorkflowToolsAndRegisterFunction(tabId);
    })
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
};

export default createAndAssignHub;
