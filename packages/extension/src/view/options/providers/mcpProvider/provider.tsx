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
  type CustomHeaders,
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
import {
  InspectorOAuthClientProvider,
  McpConnectionProvider,
} from '@google-awlt/mcp-inspector';

type ClientState = {
  [key: string]: Client;
};

type TransportState = {
  [key: string]: StreamableHTTPClientTransport | SSEClientTransport;
};

const Provider = ({ children }: PropsWithChildren) => {
  // We use a functional update to ensure we always have a fresh Map
  const [serverConfigs, setServerConfigs] = useState<
    MCPProviderContextType['state']['serverConfigs']
  >({});

  const [toolList, setToolList] = useState<
    MCPProviderContextType['state']['toolList']
  >({});

  const [clients, setClients] = useState<ClientState>({});

  const [transports, setTransports] = useState<TransportState>({});

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

        const headers: HeadersInit = {};

        const serverAuthProvider = new InspectorOAuthClientProvider(config.url);

        let finalHeaders: CustomHeaders = config.customHeaders || [];

        const isEmptyAuthHeader = (header: CustomHeaders[number]) =>
          header.name.trim().toLowerCase() === 'authorization' &&
          header.value.trim().toLowerCase() === 'bearer';

        // Check for empty Authorization headers and show validation error
        const hasEmptyAuthHeader = finalHeaders.some(
          (header) => header.enabled && isEmptyAuthHeader(header)
        );

        if (hasEmptyAuthHeader) {
          toast.error('Invalid Authorization Header', {
            description:
              'Authorization header is enabled but empty. Please add a token or disable the header.',
          });
        }

        const needsOAuthToken = !finalHeaders.some(
          (header) =>
            header.enabled &&
            header.name.trim().toLowerCase() === 'authorization'
        );

        if (needsOAuthToken) {
          const oauthToken = (await serverAuthProvider.tokens())?.access_token;
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
        initalSyncToolFetchRef.current.add(serverName);

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
          config.transport === 'streamable-http'
            ? new StreamableHTTPClientTransport(new URL(config.url), {
                requestInit: {
                  headers: headers,
                },
              })
            : new SSEClientTransport(new URL(config.url), {
                requestInit: {
                  headers: headers,
                },
              });

        await client.connect(transport);
        const toolsList = await client.listTools();

        setClients((prev) => {
          if (prev[serverName]) {
            return prev;
          }

          return {
            ...prev,
            [serverName]: client,
          };
        });

        setTransports((prev) => {
          if (prev[serverName]) {
            return prev;
          }

          return {
            ...prev,
            [serverName]: transport,
          };
        });

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

  const closeConnection = useCallback(
    (serverName: string) => {
      const client = clients[serverName];
      if (client instanceof StreamableHTTPClientTransport) {
        client.terminateSession();
      } else {
        client.close();
      }
    },
    [clients]
  );

  const handleToggle = useCallback(
    (serverName: string, value: boolean) => {
      if (!value) {
        closeConnection(serverName);
      } else {
        const client = clients[serverName];
        const transport = transports[serverName];
        client.connect(transport);
      }
      setServerConfigs((prev) => {
        const newValue = structuredClone(prev);
        newValue[serverName] = {
          ...newValue[serverName],
          enabled: value,
        };
        return newValue;
      });
    },
    [clients, closeConnection, transports]
  );

  const addConfig = useCallback(
    async (
      config: MCPServerConfig,
      serverName: string,
      initialSync = false
    ) => {
      if (serverName) {
        closeConnection(serverName);
        setClients((prev) => {
          const newClients = { ...prev };
          delete newClients[serverName];
          return newClients;
        });

        setTransports((prev) => {
          const newTransports = { ...prev };
          delete newTransports[serverName];
          return newTransports;
        });
      }

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
    [closeConnection, createClientAndListTools]
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

      setTransports((prev) => {
        const newTransports = { ...prev };
        delete newTransports[serverName];
        return newTransports;
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
        setInspectedServerName,
      },
    }),
    [
      serverConfigs,
      toolList,
      clients,
      inspectedServerName,
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
        transport={inspectedServerName ? transports[inspectedServerName] : null}
      >
        {children}
      </McpConnectionProvider>
    </MCPContext.Provider>
  );
};

export default Provider;
