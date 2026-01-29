/**
 * External dependencies
 */
import {
  useState,
  useCallback,
  type PropsWithChildren,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import { Client } from '@modelcontextprotocol/sdk/client';
import {
  isEqual,
  type MCPConfig,
  type MCPServerConfig,
} from '@google-awlt/common';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { toast } from '@google-awlt/design-system';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

/**
 * Internal dependencies
 */
import MCPContext, { type MCPProviderContextType } from './context';
import { logger } from '../../../../utils';
import { McpConnectionProvider } from '@google-awlt/mcp-inspector';

const Provider = ({ children }: PropsWithChildren) => {
  // We use a functional update to ensure we always have a fresh Map
  const [serverConfigs, setServerConfigs] = useState<
    MCPProviderContextType['state']['serverConfigs']
  >({});

  const [toolList, setToolList] = useState<
    MCPProviderContextType['state']['toolList']
  >({});

  const [clients, setClients] = useState<
    MCPProviderContextType['state']['clients']
  >({});

  const [inspectedServerName, setInspectedServerName] =
    useState<MCPProviderContextType['state']['inspectedServerName']>(null);

  const initialFetch = useRef(false);
  //for internal usage
  const _toolList = useRef(toolList);
  const initalSyncToolFetchRef = useRef(new Set());

  const createClientAndListTools = useCallback(
    async (
      config: MCPServerConfig,
      serverName: string,
      doNotStoreTools = false,
      initialSync = false
    ) => {
      try {
        if (
          !config.enabled ||
          _toolList.current[serverName]?.tools?.length > 0 ||
          initalSyncToolFetchRef.current.has(serverName)
        ) {
          return;
        }

        const requestInit: RequestInit = {};

        if (config.authToken) {
          requestInit.headers = {
            Authorization: `Bearer ${config.authToken}`,
          };
        }
        initalSyncToolFetchRef.current.add(serverName);

        const client = new Client({
          name: 'chrome-options-page-client',
          version: '1.0',
        });

        const transport = new StreamableHTTPClientTransport(
          new URL(config.url),
          {
            requestInit,
          }
        );

        await client.connect(transport);
        const toolsList = await client.listTools();

        if (doNotStoreTools) {
          toast.success('Config successfully validated.');
          return;
        }

        setToolList((prev) => ({
          ...prev,
          [serverName]: {
            tools: toolsList.tools,
            isError: false,
          },
        }));

        if (!initialSync) {
          toast.success('MCP Server successfully added to extension');
        }
      } catch (_error) {
        const errorMessage = `Couldnt add ${config.name} ${'Error fetching tools from MCP Server. Please check the server URL, check the token expiry.'}`;

        if (doNotStoreTools) {
          return errorMessage;
        }

        setToolList((prev) => ({
          ...prev,
          [serverName]: {
            tools: [],
            isError: true,
          },
        }));

        toast.error(errorMessage);
      }
    },
    []
  );

  const getClient = useCallback(
    async (serverName: string) => {
      const config = serverConfigs[serverName];
      if (!config) {
        return undefined;
      }

      // Return existing client if connected
      if (clients[serverName]) {
        return clients[serverName];
      }

      try {
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

        const requestInit: RequestInit = {};
        if (config.authToken) {
          requestInit.headers = {
            Authorization: `Bearer ${config.authToken}`,
          };
        }

        let transport;
        if (config.transport === 'sse') {
          transport = new SSEClientTransport(new URL(config.url), {
            eventSourceInit: {
              withCredentials: false,
            },
            requestInit,
          });
        } else {
          transport = new StreamableHTTPClientTransport(new URL(config.url), {
            requestInit,
          });
        }

        await client.connect(transport);

        setClients((prev) => ({
          ...prev,
          [serverName]: client,
        }));

        return client;
      } catch (error) {
        console.error('Failed to connect client:', error);
        toast.error(`Failed to connect to ${config.name}`);
        return undefined;
      }
    },
    [serverConfigs, clients]
  );

  const handleToggle = useCallback((serverName: string, value: boolean) => {
    setServerConfigs((prev) => {
      const newValue = structuredClone(prev);
      newValue[serverName] = {
        ...newValue[serverName],
        enabled: value,
      };
      return newValue;
    });
  }, []);

  const addConfig = useCallback(
    async (
      config: MCPServerConfig,
      serverName: string,
      initialSync = false
    ) => {
      setServerConfigs((prev) => {
        if (prev[serverName]) {
          if (isEqual(prev[serverName], config)) {
            return prev;
          }
        }

        return {
          ...prev,
          [serverName]: config,
        };
      });

      await createClientAndListTools(
        config,
        serverName,
        undefined,
        initialSync
      );
    },
    [createClientAndListTools]
  );

  useEffect(() => {
    if (!initialFetch.current) {
      return;
    }

    chrome.storage.local.set(
      {
        mcpServers: serverConfigs,
      },
      () => {
        Object.keys(serverConfigs).map(async (serverName) => {
          await createClientAndListTools(serverConfigs[serverName], serverName);
        });
      }
    );
  }, [serverConfigs, createClientAndListTools]);

  const initialSync = useCallback(() => {
    chrome.storage.local.get(
      'mcpServers',
      async ({ mcpServers }: MCPConfig) => {
        await Promise.all(
          Object.keys(mcpServers ?? {}).map(async (serverName) => {
            if (!serverName) {
              return Promise.resolve();
            }

            await addConfig(mcpServers?.[serverName], serverName, true);
          })
        );
      }
    );
  }, [addConfig]);

  useEffect(() => {
    (async () => {
      if (initialFetch.current) {
        return;
      }
      initialFetch.current = true;
      await initialSync();
    })();
  }, [initialSync]);

  /**
   * Action: Remove a Server Configuration
   */
  const removeConfig = useCallback(
    (serverName: string) => {
      // Close client connection if exists
      if (clients[serverName]) {
        try {
          clients[serverName].close();
        } catch (e) {
          console.error('Error closing client:', e);
        }
      }

      setClients((prev) => {
        const newClients = { ...prev };
        delete newClients[serverName];
        return newClients;
      });

      setToolList((prev) => {
        const newToolList = { ...prev };
        delete newToolList[serverName];
        return newToolList;
      });

      setServerConfigs((prev) => {
        const newConfig = structuredClone(prev);
        delete newConfig[serverName];
        return newConfig;
      });
    },
    [clients]
  );

  /**
   * Action: Validate the Config
   * Checks for required fields and valid URL formats.
   */
  const validateConfig = useCallback(
    async (config: MCPServerConfig, serverName: string, isEditing = false) => {
      const errors: string[] = [];

      if (!serverName || serverName.trim().length === 0) {
        errors.push('Server name is required.');
      }

      if (
        !isEditing &&
        Object.keys(serverConfigs).find(
          (key) => serverConfigs[key]?.name === serverName
        ) &&
        errors.length === 0
      ) {
        errors.push('Server name is already in use.');
      }

      if (!config.url && errors.length === 0) {
        errors.push('Server URL is required.');
      } else {
        try {
          new URL(config.url);
        } catch (_error) {
          logger(['error'], [_error]);
          errors.push('Invalid URL format.' + _error);
        }
      }

      if (errors.length > 1) {
        return {
          errors,
          isValid: errors.length === 0,
        };
      }

      const result = await createClientAndListTools(config, serverName, true);

      if (typeof result === 'boolean' || typeof result === 'string') {
        const message =
          typeof result === 'boolean'
            ? 'There was some error in the MCP configuration'
            : result;
        errors.push(message);
      }

      return {
        errors,
        isValid: errors.length === 0,
      };
    },
    [createClientAndListTools, serverConfigs]
  );

  const value = useMemo(
    () => ({
      state: {
        serverConfigs,
        toolList,
        clients,
        inspectedServerName,
      },
      actions: {
        addConfig,
        removeConfig,
        validateConfig,
        handleToggle,
        getClient,
        setInspectedServerName,
      },
    }),
    [
      serverConfigs,
      toolList,
      addConfig,
      removeConfig,
      validateConfig,
      handleToggle,
    ]
  );

  return (
    <MCPContext.Provider value={value}>
      <McpConnectionProvider
        client={inspectedServerName ? clients[inspectedServerName] : null}
      >
        {children}
      </McpConnectionProvider>
    </MCPContext.Provider>
  );
};

export default Provider;
