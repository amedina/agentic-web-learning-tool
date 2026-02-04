/**
 * External dependencies
 */
import { z } from 'zod';
z.config({ jitless: true });
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
/**
 * Internal dependencies
 */
import {
  updateWorkflowsContextMenu,
  handleContextMenuClick,
} from '../view/contextMenu';
import { CONNECTION_NAMES, logger, isUrl } from '../utils';
import McpHub from './mcpHub';
import './chromeListeners';
import './workflowEngine';
import { createAndAssignHub } from './utils';

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
    port.name !== CONNECTION_NAMES.MCP_HOST_DEVTOOLS
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

    createAndAssignHub(mcpHubSidepanelInstances, port, serverInstances, tabId);
  }

  if (port.name === CONNECTION_NAMES.MCP_HOST_DEVTOOLS) {
    let tabId = 0;

    if (!port.sender?.url) {
      return;
    }

    if (isUrl(port.sender?.url)) {
      tabId = parseInt(new URL(port.sender?.url).hash.substring(1));
    }

    if (!tabId) {
      return;
    }

    createAndAssignHub(mcpHubDevtoolInstances, port, serverInstances, tabId);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ status: 'ok' });
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
