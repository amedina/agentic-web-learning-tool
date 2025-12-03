/**
 * External dependencies
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { ExtensionServerTransport } from '@mcp-b/transports';
/**
 * Internal dependencies
 */
import { RequestManager } from './utils/requestManager';
import { MESSAGE_TYPES, CONNECTION_NAMES } from '../utils/constants';

interface TabData {
  tools: Tool[];
  lastUpdated: number;
  url: string;
  tabId?: number;
  port?: chrome.runtime.Port;
  isClosed: boolean;
}

type ContentScriptMessage =
  | { type: typeof MESSAGE_TYPES.REGISTER; tools: Tool[] }
  | { type: typeof MESSAGE_TYPES.UPDATE; tools: Tool[] }
  | { type: typeof MESSAGE_TYPES.RESULT; requestId: string; data: {success: boolean; payload: CallToolResult | Error } };


/**
 * Sanitizes a string to be safe for use in MCP tool names.
 */
function sanitizeToolName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * The central hub managing connections between the MCP Server and Chrome Tabs.
 * It acts as a proxy, registering tools found in browser tabs and forwarding execution requests.
 */
class McpHub {
  private server: McpServer;
  
  // Storage: Domain -> DataId (tab-123) -> TabData
  private domains = new Map<string, Map<string, TabData>>();
  
  private activeTabId: number | null = null;
  private requestManager = new RequestManager();
  
  // Track registered tools to allow updating/removing them dynamically
  private registeredTools = new Map<string, ReturnType<typeof this.server.registerTool>>();

  constructor(server: McpServer) {
    this.server = server;
    this.setupConnections();
    this.trackActiveTab();
  }

  /**
   * Retrieves or creates the storage map for a specific domain.
   */
  private getDomainData(domain: string): Map<string, TabData> {
    if (!this.domains.has(domain)) {
      this.domains.set(domain, new Map());
    }
    return this.domains.get(domain)!;
  }

  /**
   * parsing the domain from a raw URL string.
   * Handles localhost/IP edge cases.
   */
  private extractDomainFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      // Preserve port for localhost development
      if (['localhost', '127.0.0.1', '[::1]'].includes(hostname)) {
        return `localhost:${urlObj.port || '80'}`;
      }
      return hostname;
    } catch {
      return 'unknown';
    }
  }

  private setupConnections() {
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === CONNECTION_NAMES.CONTENT_SCRIPT) {
        this.handleContentScriptConnection(port);
      }
    });
  }

  /**
   * Manages the lifecycle of a connection to a specific browser tab's content script.
   */
  private handleContentScriptConnection(port: chrome.runtime.Port) {
    const tabId = port.sender?.tab?.id;
    const url = port.sender?.tab?.url || '';

    if (!tabId) {
      console.warn('Connection attempted from port without tab ID');
      return;
    }

    const domain = this.extractDomainFromUrl(url);
    const dataId = `tab-${tabId}`;

    // Listener for messages coming FROM the tab
    port.onMessage.addListener(async (message: ContentScriptMessage) => {
      try {
        switch (message.type) {
          case MESSAGE_TYPES.REGISTER:
            if (message.tools) {
              await this.registerOrUpdateTools(domain, dataId, port, message.tools, true);
            }
            break;
          case MESSAGE_TYPES.UPDATE:
            if (message.tools) {
              await this.registerOrUpdateTools(domain, dataId, port, message.tools, false);
            }
            break;
          case MESSAGE_TYPES.RESULT:
            if (message.requestId) {
              this.requestManager.resolve(message.requestId, message.data);
            }
            break;
        }
      } catch (err) {
        console.error(`Error handling message from tab ${tabId}:`, err);
      }
    });

    // Cleanup on disconnect
    port.onDisconnect.addListener(() => {
      this.unregisterTab(domain, dataId);
    });
  }

  /**
   * Main logic to register tools from a specific tab into the MCP server.
   */
  private async registerOrUpdateTools(
    domain: string,
    dataId: string,
    port: chrome.runtime.Port,
    tools: Tool[],
    isRegister: boolean
  ) {
    const domainData = this.getDomainData(domain);
    const existingTabData = domainData.get(dataId);

    // 1. Update Internal State
    const tabData: TabData = {
      tools,
      lastUpdated: Date.now(),
      url: port.sender?.tab?.url || '',
      tabId: port.sender?.tab?.id,
      port,
      isClosed: false,
    };
    domainData.set(dataId, tabData);

    // 2. Ensure active tab state is known before calculating descriptions
    if (this.activeTabId === null) {
      await this.initializeActiveTab();
    }

    // 3. Register/Update tools with MCP Server
    const toolNameComponents = {
      cleanDomain: sanitizeToolName(domain),
      prefix: dataId.startsWith('cached-') ? dataId : `tab${tabData.tabId}`,
    };

    for (const tool of tools) {
      const uniqueToolName = this.generateUniqueToolName(toolNameComponents.cleanDomain, toolNameComponents.prefix, tool.name);
      const description = this.generateTabDescription(domain, dataId, tool.description || '');

      // Create Zod schema dynamically based on tool definition
      // Note: We use z.any() because we are proxying JSON schemas we cannot strictly validate at build time
      const inputSchema: Record<string, z.ZodTypeAny> = {};
      for (const key in tool.inputSchema.properties ?? {}) {
        inputSchema[key] = z.any();
      }

      const config = {
        title: tool.title,
        description,
        inputSchema: inputSchema as any, // Cast required due to SDK constraints vs dynamic schema
        annotations: tool.annotations,
      };

      if (this.registeredTools.has(uniqueToolName)) {
        // Update existing tool
        this.registeredTools.get(uniqueToolName)!.update(config);
      } else {
        // Register new tool
        const mcpTool = this.server.registerTool(uniqueToolName, config, async (args: any) =>
          this.executeTool(domain, dataId, tool.name, args)
        );
        this.registeredTools.set(uniqueToolName, mcpTool);
      }
    }

    // 4. Cleanup removed tools (if this is an update event)
    if (!isRegister) {
      const oldTools = existingTabData?.tools || [];
      const removedTools = oldTools.filter((t) => !tools.some((nt) => nt.name === t.name));
      
      for (const tool of removedTools) {
        const uniqueToolName = this.generateUniqueToolName(toolNameComponents.cleanDomain, toolNameComponents.prefix, tool.name);
        this.registeredTools.get(uniqueToolName)?.remove();
        this.registeredTools.delete(uniqueToolName);
      }
    }
  }

  private unregisterTab(domain: string, dataId: string) {
    const domainData = this.getDomainData(domain);
    if (!domainData.has(dataId)){
        return;
    }

    this.unregisterTools(domain, dataId);
    domainData.delete(dataId);
  }

  private unregisterTools(domain: string, dataId: string) {
    const domainData = this.getDomainData(domain);
    const tabData = domainData.get(dataId);
    if (!tabData){
        return;
    }

    const cleanDomain = sanitizeToolName(domain);
    const prefix = dataId.startsWith('cached-') ? dataId : `tab${tabData.tabId ?? ''}`;

    for (const tool of tabData.tools) {
      const uniqueToolName = this.generateUniqueToolName(cleanDomain, prefix, tool.name);
      this.registeredTools.get(uniqueToolName)?.remove();
      this.registeredTools.delete(uniqueToolName);
    }
  }

  /**
   * Forwards a tool execution request to the specific Chrome tab via its Port.
   */
  private async executeTool(
    domain: string,
    dataId: string,
    toolName: string,
    args: unknown
  ): Promise<CallToolResult> {
    try {
      const port = await this.getPortForDataId(domain, dataId);
      
      if (!port) {
        return {
          content: [{ type: 'text', text: `Failed to execute tool: Tab connection lost or closed.` }],
          isError: true,
        };
      }

      // Forward request to content script using RequestManager
      const response = await this.requestManager.create(port, { 
        type: MESSAGE_TYPES.EXECUTE, 
        toolName, 
        args 
      });

      return response as CallToolResult;

    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to execute tool: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async getPortForDataId(domain: string, dataId: string): Promise<chrome.runtime.Port | null> {
    const domainData = this.getDomainData(domain);
    const tabData = domainData.get(dataId);
    if (!tabData){
        return null;
    }

    if (!tabData.isClosed && tabData.port) {
      // If the tab exists but isn't active, activate it to ensure execution context works
      if (tabData.tabId && tabData.tabId !== this.activeTabId) {
        try {
          await chrome.tabs.update(tabData.tabId, { active: true });
        } catch (e) {
          console.warn(`Failed to activate tab ${tabData.tabId}`, e);
          return null;
        }
      }
      return tabData.port;
    }
    return null;
  }

  private trackActiveTab() {
    this.initializeActiveTab();

    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      const previousActiveTabId = this.activeTabId;
      this.activeTabId = activeInfo.tabId;

      // Update descriptions for the previous tab (remove "Active" tag)
      if (previousActiveTabId && previousActiveTabId !== this.activeTabId) {
        this.attemptUpdateTabDescription(previousActiveTabId);
      }

      // Update descriptions for the new tab (add "Active" tag) and request a refresh
      try {
        const tab = await chrome.tabs.get(this.activeTabId);
        if (tab.url) {
          const domain = this.extractDomainFromUrl(tab.url);
          const dataId = `tab-${this.activeTabId}`;
          this.updateToolDescriptions(domain, dataId);
          this.requestToolsFromTab(domain, dataId);
        }
      } catch (e) {
        console.log('Error updating active tab tools:', e);
      }
    });
  }

  private async attemptUpdateTabDescription(tabId: number) {
    try {
      const prevTab = await chrome.tabs.get(tabId);
      if (prevTab.url) {
        const prevDomain = this.extractDomainFromUrl(prevTab.url);
        const prevDataId = `tab-${tabId}`;
        this.updateToolDescriptions(prevDomain, prevDataId);
      }
    } catch {
      // Tab likely closed, ignore
    }
  }

  private async initializeActiveTab() {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab?.id) {
        this.activeTabId = activeTab.id;
      }
    } catch (e) {
      console.error('Error initializing active tab:', e);
    }
  }

  private requestToolsFromTab(domain: string, dataId: string) {
    const domainData = this.getDomainData(domain);
    const tabData = domainData.get(dataId);
    if (tabData && !tabData.isClosed && tabData.port) {
      tabData.port.postMessage({ type: MESSAGE_TYPES.REFRESH_REQUEST });
    }
  }

  private updateToolDescriptions(domain: string, dataId: string) {
    const domainData = this.getDomainData(domain);
    const tabData = domainData.get(dataId);
    if (!tabData || tabData.isClosed || !tabData.tabId){
        return;
    }

    const toolNameComponents = {
      cleanDomain: sanitizeToolName(domain),
      prefix: `tab${tabData.tabId}`,
    };

    for (const tool of tabData.tools) {
      const uniqueToolName = this.generateUniqueToolName(toolNameComponents.cleanDomain, toolNameComponents.prefix, tool.name);
      const description = this.generateTabDescription(domain, dataId, tool.description || '');

      if (this.registeredTools.has(uniqueToolName)) {
        this.registeredTools.get(uniqueToolName)!.update({ description });
      }
    }
  }

  private generateUniqueToolName(cleanDomain: string, prefix: string, rawToolName: string): string {
    return `website_tool_${cleanDomain}_${prefix}_${sanitizeToolName(rawToolName)}`;
  }

  private generateTabDescription(domain: string, dataId: string, originalDesc: string): string {
    const domainData = this.getDomainData(domain);
    const tabData = domainData.get(dataId);
    if (!tabData) return `[${domain}] ${originalDesc}`;

    const isActive = !tabData.isClosed && tabData.tabId === this.activeTabId;
    const status = isActive ? 'Active' : tabData.isClosed ? 'Closed' : '';
    // Format: [example.com • Active Tab] Tool Description
    return `[${domain} • ${status ? `${status} ` : ''}Tab] ${originalDesc}`;
  }
}

// Initialize the MCP Server and Hub
const sharedServer = new McpServer({ name: 'Extension-Hub', version: '1.0.0' });
new McpHub(sharedServer);

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== CONNECTION_NAMES.MCP_HOST) {
    return;
  }

  const transport = new ExtensionServerTransport(port, {
    keepAlive: true,
    keepAliveInterval: 25_000,
  });
  sharedServer.connect(transport);
});
