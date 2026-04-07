/**
 * External dependencies.
 */
import {
  DomExtractionTools,
  HistoryApiTools,
  ScriptingApiTools,
  StorageApiTools,
  TabGroupsApiTools,
  TabsApiTools,
  WindowsApiTools,
} from '@mcp-b/extension-tools';

export const mcpbTools = {
  dom_extraction: {
    name: 'DOM Extraction',
    namespace: 'mcp_b',
    allowedDomains: ['<all_urls>'],
    instance: DomExtractionTools,
    inputSchema: {},
    description:
      'Extracts high-level structural overview of the page. This is the first step for AI agents to understand page layout.',
    enabled: true,
    isBuiltIn: true,
    isExtension: true,
  },
  history: {
    name: 'History',
    namespace: 'mcp_b',
    instance: HistoryApiTools,
    allowedDomains: ['<all_urls>'],
    description: 'Performs operations on the Chrome History API',
    inputSchema: {},
    enabled: true,
    isBuiltIn: true,
    isExtension: true,
  },
  scripting: {
    name: 'Scripting',
    namespace: 'mcp_b',
    instance: ScriptingApiTools,
    allowedDomains: ['<all_urls>'],
    inputSchema: {},
    description:
      'Executes JavaScript code in a specific tab using chrome.scripting API. Limited by CSP restrictions. If no tabId is specified, operates on the currently active tab',
    options: {
      executeScript: true,
      executeUserScript: true,
      insertCSS: false,
      removeCSS: false,
    },
    enabled: true,
    isBuiltIn: true,
    isExtension: true,
  },
  storage: {
    name: 'Storage',
    namespace: 'mcp_b',
    instance: StorageApiTools,
    allowedDomains: ['<all_urls>'],
    description: 'Performs operations on Chrome storage API',
    inputSchema: {},
    enabled: true,
    isBuiltIn: true,
    isExtension: true,
  },
  tab_group: {
    name: 'Tab Groups',
    namespace: 'mcp_b',
    instance: TabGroupsApiTools,
    allowedDomains: ['<all_urls>'],
    description: 'Performs operations on tab groups using Chrome TabGroups API',
    inputSchema: {},
    enabled: true,
    isBuiltIn: true,
    isExtension: true,
  },
  tabs: {
    name: 'Tabs',
    namespace: 'mcp_b',
    instance: TabsApiTools,
    allowedDomains: ['<all_urls>'],
    description: 'Performs various tab operations using the Chrome Tabs API',
    inputSchema: {},
    options: {
      getAllTabs: true,
      createTab: true,
      closeTabs: true,
      updateTab: true,
    },
    enabled: true,
    isBuiltIn: true,
    isExtension: true,
  },
  windows: {
    name: 'Windows',
    namespace: 'mcp_b',
    instance: WindowsApiTools,
    allowedDomains: ['<all_urls>'],
    inputSchema: {},
    description: 'Performs operations on browser windows.',
    enabled: true,
    isBuiltIn: true,
    isExtension: true,
  },
};

export type keys = keyof typeof mcpbTools;
