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
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import {
  DOM_TOOL_NAME_PREFIX,
  EXTENSION_TOOL_PREFIX,
  type CustomHeaders,
  type MCPConfig,
  type MCPServerConfig,
} from '@google-awlt/common';
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
import type { ContentScriptMessage } from './types';
import {
  chromeApiBuiltInTools,
  type keys,
} from '../contentScript/tools/builtInTools';
/**
 * The central hub managing connections between the MCP Server and Chrome Tabs.
 * It acts as a proxy, registering tools found in browser tabs and forwarding execution requests.
 */
class McpHub {
  server: McpServer;
  clientList = new Map<
    string,
    {
      client: Client;
      transport: StreamableHTTPClientTransport | SSEClientTransport;
      connected: boolean;
      toolsFetched: boolean;
    }
  >();

  private port: chrome.runtime.Port | null = null;
  private requestManager = new RequestManager();
  private apiTools: any[] = [];
  private tabId: number = 0;
  private toolInjected = false;

  // Track registered tools to allow updating/removing them dynamically
  registeredTools = new Map<
    string,
    ReturnType<typeof this.server.registerTool>
  >();

  constructor(server: McpServer, tabId: number) {
    this.server = server;
    this.setupConnections();
    this.registerAllExtensionTools();
    this.tabId = tabId;
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
        toolName.startsWith(EXTENSION_TOOL_PREFIX) ||
        toolName.startsWith(DOM_TOOL_NAME_PREFIX)
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
      if (!serverConfig.url) {
        logger(
          ['warn'],
          [`Skipping server ${serverName} as it is missing a URL.`]
        );
        return;
      }
      const headers: HeadersInit = {};

      let finalHeaders: CustomHeaders = serverConfig.customHeaders || [];

      const isEmptyAuthHeader = (header: CustomHeaders[number]) =>
        header.name.trim().toLowerCase() === 'authorization' &&
        header.value.trim().toLowerCase() === 'bearer';

      // Check for empty Authorization headers and show validation error
      const hasEmptyAuthHeader = finalHeaders.some(
        (header) => header.enabled && isEmptyAuthHeader(header)
      );

      if (hasEmptyAuthHeader) {
        return;
      }

      const needsOAuthToken = !finalHeaders.some(
        (header) =>
          header.enabled && header.name.trim().toLowerCase() === 'authorization'
      );

      if (needsOAuthToken) {
        const oauthToken = serverConfig?.oAuthToken;
        if (oauthToken) {
          // Add the OAuth token
          finalHeaders = [
            // Remove any existing Authorization headers with empty tokens
            ...finalHeaders.filter((header) => !isEmptyAuthHeader(header)),
            {
              name: 'Authorization',
              value: `Bearer ${oauthToken}`,
              enabled: true,
            },
          ];
        }
      }

      // Process all enabled custom headers
      const customHeaderNames: string[] = [];
      finalHeaders.forEach((header) => {
        if (header.enabled && header.name.trim() && header.value.trim()) {
          const headerName = header.name.trim();
          const headerValue = header.value.trim();

          headers[headerName] = headerValue;

          // Track custom header names for server processing
          if (headerName.toLowerCase() !== 'authorization') {
            customHeaderNames.push(headerName);
          }
        }
      });

      // Add custom header names as a special request header for server processing
      if (customHeaderNames.length > 0) {
        headers['x-custom-auth-headers'] = JSON.stringify(customHeaderNames);
      }

      const client = new Client(
        {
          name: 'chrome-options-page-client',
          version: '1.0',
        },
        {
          capabilities: {
            sampling: {},
            elicitation: {},
            roots: {
              listChanged: true,
            },
          },
        }
      );

      const transport =
        serverConfig.transport === 'streamable-http'
          ? new StreamableHTTPClientTransport(new URL(serverConfig.url), {
              requestInit: {
                headers: headers,
              },
            })
          : new SSEClientTransport(new URL(serverConfig.url), {
              requestInit: {
                headers: headers,
              },
            });

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

    if (tabId !== this.tabId) {
      return;
    }
    this.port = port;
    const domain = this.extractDomainFromUrl(url);

    // Listener for messages coming FROM the tab
    this.port.onMessage.addListener(async (message: ContentScriptMessage) => {
      try {
        switch (message.type) {
          case MESSAGE_TYPES.REGISTER:
            if (message.tools) {
              await this.registerOrUpdateTools(
                domain,
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
    this.port.onDisconnect.addListener(() => {
      this.unregisterTab();
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
            this.executeTool(serverName, tool.name, args, true)
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
    tools: Tool[],
    isRegister: boolean,
    isMCPServerTool: boolean
  ) {
    if (isMCPServerTool) {
      this.registerMCPServerTools(serverOrDomainName, tools);
    } else {
      await this.registerOrUpdateWebMCPTools(
        serverOrDomainName,
        tools,
        isRegister
      );
    }
  }

  private async registerOrUpdateWebMCPTools(
    domain: string,
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

    const currentUrl = this.port?.sender?.tab?.url || '';
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

    for (const tool of activeTools) {
      const uniqueToolName = this.generateUniqueToolName(tool.name);

      const config = {
        title: tool.title,
        description: tool.description,
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
          async (args: any) => this.executeTool(domain, tool.name, args, false)
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
      const oldTools = Array.from(this.registeredTools.entries()) || [];
      const removedTools = oldTools.filter(
        ([toolName]) =>
          !activeTools.some((activeTool) => activeTool.name === toolName)
      );

      for (const [toolName] of removedTools) {
        this.registeredTools.get(toolName)?.remove();
        this.registeredTools.delete(toolName);
      }
    }
  }

  private unregisterTab() {
    this.unregisterTools();
  }

  private unregisterTools() {
    for (const [toolName] of this.registeredTools.entries()) {
      if (toolName.startsWith('extension_tool') || toolName.includes(`_mcp_`)) {
        return;
      }
      this.registeredTools.get(toolName)?.remove();
      this.registeredTools.delete(toolName);
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
    toolName: string,
    args: unknown
  ): Promise<CallToolResult> {
    try {
      if (!this.port) {
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
      const response = await this.requestManager.create(this.port, {
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
      return this.executeWebMCPTool(toolName, args);
    }
  }

  private generateUniqueToolName(rawToolName: string): string {
    return `${sanitizeToolName(rawToolName)}`;
  }

  async injectToolsAndRegisterFunction(tabId: number) {
    if (this.toolInjected) {
      return;
    }

    const storage = await chrome.storage.local.get();
    const userWebMCPTools = storage && storage['userWebMCPTools'];
    let tabUrl = '';

    try {
      const tab = await chrome.tabs.get(tabId);
      tabUrl = tab.url || '';
    } catch (e) {
      logger(
        ['warn'],
        [`WebMCP: Could not get tab URL for injection (tabId: ${tabId})`, e]
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
        this.toolInjected = true;
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
