/**
 * External dependencies
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  type CallToolResult,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { Client } from '@modelcontextprotocol/sdk/client';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { MCPConfig, MCPServerConfig } from '@google-awlt/common';
/**
 * Internal dependencies
 */
import { RequestManager, sanitizeToolName, isDomainAllowed } from './utils';
import {
  MESSAGE_TYPES,
  CONNECTION_NAMES,
  logger,
  jsonSchemaToZod,
} from '../utils';
import type { ContentScriptMessage, TabData } from './types';
import {
  chromeApiBuiltInTools,
  type keys,
} from '../contentScript/tools/builtInTools';
/**
 * The central hub managing connections between the MCP Server and Chrome Tabs.
 * It acts as a proxy, registering tools found in browser tabs and forwarding execution requests.
 */
class McpHub {
  private server: McpServer;
  clientList = new Map<
    string,
    {
      client: Client;
      transport: StreamableHTTPClientTransport;
      connected: boolean;
      toolsFetched: boolean;
    }
  >();

  // Storage: Domain -> DataId (tab-123) -> TabData
  private domains = new Map<string, Map<string, TabData>>();

  private activeTabId: number | null = null;
  private requestManager = new RequestManager();
  private apiTools: any[] = [];

  // Track registered tools to allow updating/removing them dynamically
  registeredTools = new Map<
    string,
    ReturnType<typeof this.server.registerTool>
  >();

  constructor(server: McpServer) {
    this.server = server;
    this.setupConnections();
    this.trackActiveTab();
    this.registerAllExtensionTools();
    chrome.storage.local.onChanged.addListener((changes) => {
      if (changes?.chromeAPIBuiltInToolsState) {
        this.onLocalStoreChangedListener();
      }
    });
  }

  async fetchLocalStorageAndRegisterTools() {
    const {
      chromeAPIBuiltInToolsState,
    }: {
      chromeAPIBuiltInToolsState: {
        [key in keys]: {
          enabled: boolean;
        };
      };
    } = await chrome.storage.local.get('chromeAPIBuiltInToolsState');

    Object.keys(chromeAPIBuiltInToolsState ?? {}).forEach((toolKey) => {
      if (chromeAPIBuiltInToolsState?.[toolKey as keys]?.enabled) {
        if (!chromeApiBuiltInTools[toolKey as keys]) {
          return;
        }

        this.apiTools.push(
          new chromeApiBuiltInTools[toolKey as keys].instance(this.server)
        );
      }
    });

    this.registerApiCheckTool();

    // Register all API tools
    for (const tool of this.apiTools) {
      tool.register();
    }
  }

  async onLocalStoreChangedListener() {
    //@ts-expect-error -- we are accessing a private variable as private variable are only available in TS annotations
    Object.keys(this.server._registeredTools).forEach((toolName) => {
      if (
        toolName.startsWith('extension_tool_') ||
        toolName.startsWith('dom_extract_')
      ) {
        //@ts-expect-error -- we are accessing a private variable as private variable are only available in TS annotations
        this.server._registeredTools[toolName].remove();
      }
    });

    this.apiTools = [];

    await this.fetchLocalStorageAndRegisterTools();

    this.registerApiCheckTool();
    this.server.server?.transport?.send({
      jsonrpc: '2.0',
      method: 'get/Tools',
    });
  }

  async registerAllExtensionTools() {
    logger(['debug'], ['Registering extension tools...']);

    await this.fetchLocalStorageAndRegisterTools();
  }

  private registerApiCheckTool() {
    //@ts-expect-error -- we are accessing a private variable as private variable are only available in TS annotations
    if (this.server._registeredTools['extension_tool_check_available_apis']) {
      return;
    }
    this.server.registerTool(
      'extension_tool_check_available_apis',
      {
        description:
          'Check which Chrome Extension APIs are available to the extension',
        inputSchema: {},
      },
      async () => {
        const apis = this.getAvailableApis();
        let permissions = null;

        // Only try to get permissions if the API is available
        if (
          chrome.permissions &&
          typeof chrome.permissions.getAll === 'function'
        ) {
          try {
            permissions = await chrome.permissions.getAll();
          } catch (error) {
            console.error('Failed to get permissions:', error);
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  availableApis: apis,
                  permissions: permissions
                    ? {
                        permissions: permissions.permissions || [],
                        origins: permissions.origins || [],
                      }
                    : 'Permissions API not available',
                },
                null,
                2
              ),
            },
          ],
        };
      }
    );
  }

  /**
   * Get a summary of available Chrome APIs
   */
  getAvailableApis(): Record<string, any> {
    const apiStatuses: Record<string, any> = {};

    for (const tool of this.apiTools) {
      const availability = tool.checkAvailability();
      apiStatuses[tool.apiName.toLowerCase()] = {
        available: availability.available,
        message: availability.message,
        details: availability.details,
      };
    }

    return apiStatuses;
  }

  async removeMCPServer(serverName: string) {
    Array.from(this.registeredTools.entries()).map(
      ([toolName, registeredTool]) => {
        if (toolName.startsWith(serverName)) {
          this.registeredTools.delete(toolName);
          registeredTool.remove();
        }
      }
    );
    this.clientList.delete(serverName);
    this.server.server?.transport?.send({
      jsonrpc: '2.0',
      method: 'get/Tools',
    });
  }

  async addNewServer(serverConfig: MCPServerConfig, serverName: string) {
    try {
      const storedConfig = this.clientList.get(serverName);

      if (storedConfig?.toolsFetched) {
        this.enableMCPServerTools(serverName);
        return;
      }

      const requestInit: RequestInit = {};

      if (serverConfig.authToken) {
        requestInit.headers = {
          Authorization: `Bearer ${serverConfig.authToken}`,
        };
      }

      const transport = new StreamableHTTPClientTransport(
        new URL(serverConfig.url),
        {
          requestInit,
        }
      );

      const client = new Client(
        {
          name: 'chrome-extension-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      await client.connect(transport);
      const toolsList = await client.listTools();
      this.clientList.set(serverName, {
        client,
        transport,
        connected: true,
        toolsFetched: true,
      });

      this.registerOrUpdateTools(
        serverName,
        '',
        null,
        toolsList.tools as unknown as Tool[],
        false,
        true
      );
    } catch (_error) {
      logger(
        ['error'],
        ['Failed to register the server and list the tools', _error]
      );
    }
  }

  async disableMCPServerTools(serverId: string) {
    Array.from(this.registeredTools.entries()).forEach(
      ([toolName, registeredTool]) => {
        if (toolName.endsWith(`mcp_${serverId}`)) {
          registeredTool.disable();
        }
      }
    );
    this.server.server?.transport?.send({
      jsonrpc: '2.0',
      method: 'get/Tools',
    });
  }

  async enableMCPServerTools(serverId: string) {
    Array.from(this.registeredTools.entries()).forEach(
      ([toolName, registeredTool]) => {
        if (toolName.endsWith(`mcp_${serverId}`)) {
          registeredTool.enable();
        }
      }
    );
    this.server.server?.transport?.send({
      jsonrpc: '2.0',
      method: 'get/Tools',
    });
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

  setupConnections() {
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === CONNECTION_NAMES.CONTENT_SCRIPT) {
        this.handleContentScriptConnection(port);
      }
    });
    //Gather the MCP server configs from the chrome localStorage
    chrome.storage.local.get(
      'mcpServers',
      async ({ mcpServers }: MCPConfig) => {
        await Promise.all(
          Object.keys(mcpServers ?? {}).map(async (serverName) => {
            if (!serverName) {
              return Promise.resolve();
            }

            if (!mcpServers[serverName].enabled) {
              return Promise.resolve();
            }

            await this.addNewServer(mcpServers[serverName], serverName);
          })
        );
      }
    );
  }

  /**
   * Manages the lifecycle of a connection to a specific browser tab's content script.
   */
  private handleContentScriptConnection(port: chrome.runtime.Port) {
    const tabId = port.sender?.tab?.id;
    const url = port.sender?.tab?.url || '';

    if (!tabId) {
      logger(['warn'], ['Connection attempted from port without tab ID']);
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
              await this.registerOrUpdateTools(
                domain,
                dataId,
                port,
                message.tools,
                false,
                false
              );
              await this.injectToolsAndRegisterFunction(tabId);
            }
            break;
          case MESSAGE_TYPES.UPDATE:
            if (message.tools) {
              await this.registerOrUpdateTools(
                domain,
                dataId,
                port,
                message.tools,
                false,
                false
              );
            }
            break;
          case MESSAGE_TYPES.RESULT:
            if (message.requestId) {
              this.requestManager.resolve(message.requestId, message.data);
            }
            break;
          default:
            console.log(`Unknown message type from tab ${tabId}:`, message);
        }
      } catch (err) {
        logger(['error'], [`Error handling message from tab ${tabId}:`, err]);
      }
    });

    // Cleanup on disconnect
    port.onDisconnect.addListener(() => {
      this.unregisterTab(domain, dataId);
    });
  }

  private registerMCPServerTools(serverName: string, tools: Tool[]) {
    for (const tool of tools) {
      const config = {
        ...tool,
        inputSchema: jsonSchemaToZod(tool.inputSchema),
      };

      const prefixedToolName = `${tool.name}_mcp_${serverName}`;

      if (this.registeredTools.has(prefixedToolName)) {
        // Update existing tool
        this.registeredTools.get(prefixedToolName)!.update(config as any);
      } else {
        // Register new tool
        const mcpTool = this.server.registerTool(
          prefixedToolName,
          config as any,
          async (args: any) =>
            this.executeTool(serverName, '', tool.name, args, true)
        );
        this.registeredTools.set(prefixedToolName, mcpTool);
      }

      this.server.server?.transport?.send({
        jsonrpc: '2.0',
        method: 'get/Tools',
      });
    }
  }

  /**
   * Main logic to register tools from a specific tab into the MCP server.
   */
  private async registerOrUpdateTools(
    serverOrDomainName: string,
    dataId: string,
    port: chrome.runtime.Port | null,
    tools: Tool[],
    isRegister: boolean,
    isMCPServerTool: boolean
  ) {
    if (isMCPServerTool) {
      this.registerMCPServerTools(serverOrDomainName, tools);
    } else {
      await this.registerOrUpdateWebMCPTools(
        serverOrDomainName,
        dataId,
        port as chrome.runtime.Port,
        tools,
        isRegister
      );
    }
  }

  private async registerOrUpdateWebMCPTools(
    domain: string,
    dataId: string,
    port: chrome.runtime.Port,
    tools: Tool[],
    isRegister: boolean
  ) {
    // Unified filtering: Filter out any tool that is disabled in storage OR not allowed on this domain
    const storage = await chrome.storage.local.get([
      'builtInWebMCPToolsState',
      'userWebMCPTools',
    ]);
    const builtInState = (storage.builtInWebMCPToolsState || {}) as Record<
      string,
      boolean | undefined
    >;
    const userTools = (storage.userWebMCPTools || []) as Array<{
      name: string;
      enabled: boolean;
      allowedDomains?: string[];
    }>;
    const userToolsMap = new Map(userTools.map((t) => [t.name, t]));

    const currentUrl = port.sender?.tab?.url || '';
    const disabledToolNames = new Set<string>();

    for (const [name, enabled] of Object.entries(builtInState)) {
      if (enabled === false) disabledToolNames.add(name);
    }

    for (const tool of userTools) {
      if (tool.enabled === false) {
        disabledToolNames.add(tool.name);
      }
    }

    const activeTools = tools.filter((tool) => {
      if (disabledToolNames.has(tool.name)) {
        return false;
      }

      const userToolConfig = userToolsMap.get(tool.name);
      if (userToolConfig) {
        if (!isDomainAllowed(currentUrl, userToolConfig.allowedDomains)) {
          return false;
        }
      }

      return true;
    });

    const domainData = this.getDomainData(domain);
    const existingTabData = domainData.get(dataId);

    // 1. Update Internal State
    const tabData: TabData = {
      tools: activeTools,
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

    for (const tool of activeTools) {
      const uniqueToolName = this.generateUniqueToolName(
        toolNameComponents.cleanDomain,
        toolNameComponents.prefix,
        tool.name
      );
      const description = this.generateTabDescription(
        domain,
        dataId,
        tool.description || ''
      );

      const config = {
        title: tool.title,
        description,
        inputSchema: jsonSchemaToZod(tool.inputSchema),
        annotations: tool.annotations,
      };

      if (this.registeredTools.has(uniqueToolName)) {
        // Update existing tool
        this.registeredTools.get(uniqueToolName)!.update(config);
      } else {
        // Register new tool
        const mcpTool = this.server.registerTool(
          uniqueToolName,
          config,
          async (args: any) =>
            this.executeTool(domain, dataId, tool.name, args, false)
        );
        this.server.server?.transport?.send({
          jsonrpc: '2.0',
          method: 'get/Tools',
        });
        this.registeredTools.set(uniqueToolName, mcpTool);
      }
    }

    // 4. Cleanup removed tools (if this is an update event)
    if (!isRegister) {
      const oldTools = existingTabData?.tools || [];
      const removedTools = oldTools.filter(
        (t) => !activeTools.some((nt) => nt.name === t.name)
      );

      for (const tool of removedTools) {
        const uniqueToolName = this.generateUniqueToolName(
          toolNameComponents.cleanDomain,
          toolNameComponents.prefix,
          tool.name
        );
        this.registeredTools.get(uniqueToolName)?.remove();
        this.registeredTools.delete(uniqueToolName);
      }
    }
  }

  private unregisterTab(domain: string, dataId: string) {
    const domainData = this.getDomainData(domain);
    if (!domainData.has(dataId)) {
      return;
    }

    this.unregisterTools(domain, dataId);
    domainData.delete(dataId);
  }

  private unregisterTools(domain: string, dataId: string) {
    const domainData = this.getDomainData(domain);
    const tabData = domainData.get(dataId);
    if (!tabData) {
      return;
    }

    const cleanDomain = sanitizeToolName(domain);
    const prefix = dataId.startsWith('cached-')
      ? dataId
      : `tab${tabData.tabId ?? ''}`;

    for (const tool of tabData.tools) {
      const uniqueToolName = this.generateUniqueToolName(
        cleanDomain,
        prefix,
        tool.name
      );
      this.registeredTools.get(uniqueToolName)?.remove();
      this.registeredTools.delete(uniqueToolName);
    }
  }

  /**
   * Forwards a tool execution request to the specific Chrome tab via its Port.
   */
  async executeMCPTool(
    serverName: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<CallToolResult> {
    try {
      const connector = this.clientList.get(serverName);

      if (!connector?.client) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to execute tool: MCPServer connection lost or closed.`,
            },
          ],
          isError: true,
        };
      }

      const response = await connector.client.callTool({
        name: toolName,
        arguments: args ?? {},
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

  /**
   * Forwards a tool execution request to the specific Chrome tab via its Port.
   */
  async executeWebMCPTool(
    domain: string,
    dataId: string,
    toolName: string,
    args: unknown
  ): Promise<CallToolResult> {
    try {
      const port = await this.getPortForDataId(domain, dataId);

      if (!port) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to execute tool: Tab connection lost or closed.`,
            },
          ],
          isError: true,
        };
      }
      // Forward request to content script using RequestManager
      const response = await this.requestManager.create(port, {
        type: MESSAGE_TYPES.EXECUTE,
        toolName,
        args,
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

  async executeTool(
    serverOrDomainName: string,
    dataId: string,
    toolName: string,
    args: Record<string, unknown> | unknown,
    isMCPServerTool: boolean
  ) {
    if (isMCPServerTool) {
      return this.executeMCPTool(
        serverOrDomainName,
        toolName,
        args as Record<string, unknown>
      );
    } else {
      return this.executeWebMCPTool(serverOrDomainName, dataId, toolName, args);
    }
  }

  private async getPortForDataId(
    domain: string,
    dataId: string
  ): Promise<chrome.runtime.Port | null> {
    const domainData = this.getDomainData(domain);
    const tabData = domainData.get(dataId);
    if (!tabData) {
      return null;
    }

    if (!tabData.isClosed && tabData.port) {
      // If the tab exists but isn't active, activate it to ensure execution context works
      if (tabData.tabId && tabData.tabId !== this.activeTabId) {
        try {
          await chrome.tabs.update(tabData.tabId, { active: true });
        } catch (e) {
          logger(['warn'], [`Failed to activate tab ${tabData.tabId}`, e]);
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
        logger(['error'], ['Error updating active tab tools:', e]);
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
      const [activeTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (activeTab?.id) {
        this.activeTabId = activeTab.id;
      }
    } catch (e) {
      logger(['error'], ['Error initializing active tab:', e]);
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
    if (!tabData || tabData.isClosed || !tabData.tabId) {
      return;
    }

    const toolNameComponents = {
      cleanDomain: sanitizeToolName(domain),
      prefix: `tab${tabData.tabId}`,
    };

    for (const tool of tabData.tools) {
      const uniqueToolName = this.generateUniqueToolName(
        toolNameComponents.cleanDomain,
        toolNameComponents.prefix,
        tool.name
      );
      const description = this.generateTabDescription(
        domain,
        dataId,
        tool.description || ''
      );

      if (this.registeredTools.has(uniqueToolName)) {
        this.registeredTools.get(uniqueToolName)!.update({ description });
      }
    }
  }

  private generateUniqueToolName(
    cleanDomain: string,
    prefix: string,
    rawToolName: string
  ): string {
    return `website_tool_${cleanDomain}_${prefix}_${sanitizeToolName(rawToolName)}`;
  }

  private generateTabDescription(
    domain: string,
    dataId: string,
    originalDesc: string
  ): string {
    const domainData = this.getDomainData(domain);
    const tabData = domainData.get(dataId);
    if (!tabData) return `[${domain}] ${originalDesc}`;

    const isActive = !tabData.isClosed && tabData.tabId === this.activeTabId;
    const status = isActive ? 'Active' : tabData.isClosed ? 'Closed' : '';
    // Format: [example.com • Active Tab] Tool Description
    return `[${domain} • ${status ? `${status} ` : ''}Tab] ${originalDesc}`;
  }

  async injectToolsAndRegisterFunction(tabId: number) {
    const storage = await chrome.storage.local.get();
    const userWebMCPTools = storage && storage['userWebMCPTools'];
    let tabUrl = '';

    try {
      const tab = await chrome.tabs.get(tabId);
      tabUrl = tab.url || '';
    } catch (e) {
      console.warn(
        `WebMCP: Could not get tab URL for injection (tabId: ${tabId})`,
        e
      );
    }

    // Filter out disabled user tools AND tools not allowed on this domain
    const enabledUserTools = Array.isArray(userWebMCPTools)
      ? userWebMCPTools.filter((t: any) => {
          if (t.enabled === false) return false;
          return isDomainAllowed(tabUrl, t.allowedDomains);
        })
      : [];

    chrome.scripting
      .executeScript({
        target: { tabId: tabId },
        world: 'MAIN',
        func: registerDynamicToolFromScripting,
        args: [enabledUserTools],
      })
      .then((result) => {
        console.log('WebMCP: tools registered', result);
      })
      .catch((error) => {
        console.error('WebMCP: Error injecting user tools', error);
      });

    async function registerDynamicToolFromScripting(tools: any) {
      //@ts-expect-error -- window.navigator.modelContext is injected dynamically
      const mcp = window.navigator.modelContext;
      for (const toolWrapper of tools) {
        try {
          // 1. Create a Blob from the code string
          const blob = new Blob([toolWrapper.code], {
            type: 'text/javascript',
          });
          const url = URL.createObjectURL(blob);

          // 2. Dynamically import the blob as a module
          // This works because we stripped CSP headers
          const module = await import(url);

          // 3. Construct the tool object
          const toolToRegister = {
            ...module.metadata,
            execute: module.execute,
          };
          console.log('WebMCP: Tool to register:', toolToRegister);
          // 4. Register
          if (mcp) {
            await mcp.registerTool(toolToRegister);
            console.log(
              'WebMCP: User tool registered successfully:',
              toolToRegister.name
            );
          } else {
            console.log('WebMCP: Cannot register tool, mcp missing');
          }

          // Clean up
          URL.revokeObjectURL(url);
        } catch (err) {
          console.log(
            'WebMCP: Failed to register user tool:',
            toolWrapper.name,
            err
          );
        }
      }
    }
  }
}

export default McpHub;
