/**
 * External dependencies
 */
import { z } from 'zod';
z.config({ jitless: true });
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { WebMCPTool } from '@google-awlt/design-system';
import PQueue from 'p-queue';
/**
 * Internal dependencies
 */
import {
  updateWorkflowsContextMenu,
  handleContextMenuClick,
} from '../view/contextMenu';
import {
  CONNECTION_NAMES,
  logger,
  isUrl,
  setLogLevelFromSyncSettings,
} from '../utils';
import McpHub from './mcpHub';
import './chromeListeners';
import './workflowEngine';
import { createAndAssignHub } from './utils';

const PromiseQueue = new PQueue({
  concurrency: 1,
});
//@ts-expect-error -- Adding this so this can be accessed across files in service worker
if (!globalThis.PromiseQueue) {
  //@ts-expect-error -- Adding this so this can be accessed across files in service worker
  globalThis.PromiseQueue = PromiseQueue;
}

(async () => await setLogLevelFromSyncSettings())();

const mcpHubSidepanelInstances = new Map<number, McpHub>();
const mcpHubDevtoolInstances = new Map<number, McpHub>();
const mcpHubOptionsInstances = new Map<number, McpHub>();
const serverInstances = new Map<number, McpServer>();

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: false })
  .catch((error) => {
    logger(['error'], ['Failed to set panel behavior:', error]);
  });

//@ts-expect-error -- for debugging purpose
globalThis.mcpData = {
  mcpHubDevtoolInstances,
  mcpHubOptionsInstances,
  mcpHubSidepanelInstances,
  serverInstances,
};

chrome.tabs.onRemoved.addListener((tabId) => {
  mcpHubDevtoolInstances.delete(tabId);
  mcpHubOptionsInstances.delete(tabId);
  mcpHubSidepanelInstances.delete(tabId);
  serverInstances.delete(tabId);
});

//sidepanel instance
chrome.runtime.onConnect.addListener(async (port) => {
  //Only listen to connections initiated from sidepanel or devtools
  //If connection is initiated from devtools condition becomes false and function is not returned early
  //If connection is initiated from sidepanel condition becomes false and function is not returned early
  //If connection is initiated from content script condition is true and function retrns early
  if (
    port.name !== CONNECTION_NAMES.MCP_HOST_SIDEPANEL &&
    !port.name.startsWith(CONNECTION_NAMES.MCP_HOST_DEVTOOLS)
  ) {
    return;
  }

  if (port.name === CONNECTION_NAMES.MCP_HOST_SIDEPANEL) {
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

    await createAndAssignHub(
      mcpHubSidepanelInstances,
      port,
      serverInstances,
      tabId
    );
  }

  if (port.name.startsWith(CONNECTION_NAMES.MCP_HOST_DEVTOOLS)) {
    let tabId = 0;
    tabId = parseInt(
      port.name.substring(CONNECTION_NAMES.MCP_HOST_DEVTOOLS.length)
    );

    if (!tabId) {
      return;
    }

    await createAndAssignHub(
      mcpHubDevtoolInstances,
      port,
      serverInstances,
      tabId
    );
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ status: 'ok' });
  }

  if (message.type === 'updateScript') {
    //@ts-expect-error -- PromiseQueue is added to globalThis in service worker
    globalThis.PromiseQueue.add(async () => {
      const { newCode, toolName, tabId } = message.payload;
      const { userWebMCPTools } =
        await chrome.storage.local.get('userWebMCPTools');

      const reformedWebMcpTools = (userWebMCPTools as WebMCPTool[]).map(
        (tool) => {
          if (tool.name !== toolName) {
            return tool;
          }

          if (tool.editedScript) {
            tool.editedScript.code = newCode;
            tool.editedScript.tabId.push(tabId);
          } else {
            tool = {
              ...tool,
              editedScript: {
                tabId,
                code: newCode,
              },
            };
          }
          return tool;
        }
      );

      chrome.storage.local.set({
        userWebMCPTools: reformedWebMcpTools,
      });
    });
  }
});

// Context Menu Listeners
chrome.contextMenus.onClicked.addListener(handleContextMenuClick);

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    updateWorkflowsContextMenu(tab.url);
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab?.url) {
    updateWorkflowsContextMenu(tab.url);
  }
});
