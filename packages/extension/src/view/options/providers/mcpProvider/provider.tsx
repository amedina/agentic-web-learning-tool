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
  const clients = useRef<ClientState>({});
  const transports = useRef<TransportState>({});

  const [inspectedServerName, setInspectedServerName] =
    useState<MCPProviderContextType['state']['inspectedServerName']>(null);

  const initialFetch = useRef(false);
  //for internal usage
  const _toolList = useRef(toolList);
  const initalSyncToolFetchRef = useRef(new Set());

  const connectToMCPServer = useCallback(
    async (config: MCPServerConfig, serverName: string) => {
      const headers: HeadersInit = {};

      const serverAuthProvider = new InspectorOAuthClientProvider(config.url);
      let oauthToken;

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
          header.enabled && header.name.trim().toLowerCase() === 'authorization'
      );

      if (needsOAuthToken) {
        oauthToken = (await serverAuthProvider.tokens())?.access_token;
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
      console.log('connect');
      const toolsList = await client.listTools();

      return { toolsList, transport, client, oauthToken };
    },
    []
  );

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

        const { toolsList, transport, client, oauthToken } =
          await connectToMCPServer(config, serverName);

        clients.current[serverName] = client;
        transports.current[serverName] = transport;

        if (oauthToken) {
          setServerConfigs((prev) => {
            const newValue = { ...prev };
            newValue[serverName].oAuthToken = oauthToken;
            return newValue;
          });
        }

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
    [connectToMCPServer]
  );

  const closeConnection = useCallback(async (serverName: string) => {
    const client = clients.current[serverName];
    const transport = transports.current[serverName];
    if (transport instanceof StreamableHTTPClientTransport) {
      await transport.terminateSession();
      await client.close();
    } else {
      await client.close();
    }
  }, []);

  const handleToggle = useCallback(
    async (serverName: string, value: boolean) => {
      if (!value) {
        await closeConnection(serverName);
      } else {
        try {
          setServerConfigs((prev) => {
            const newValue = { ...prev };
            newValue[serverName].isReconnecting = true;
            return newValue;
          });

          const { transport, client, oauthToken } = await connectToMCPServer(
            serverConfigs[serverName],
            serverName
          );

          clients.current[serverName] = client;

          transports.current[serverName] = transport;

          setServerConfigs((prev) => {
            const newValue = { ...prev };
            newValue[serverName].isReconnecting = false;
            if (oauthToken) {
              newValue[serverName].oAuthToken = oauthToken;
            }
            return newValue;
          });
        } catch (_error) {
          //ignore
        }
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
    [closeConnection, connectToMCPServer, serverConfigs]
  );

  const addConfig = useCallback(
    async (
      config: MCPServerConfig,
      serverName: string,
      initialSync = false
    ) => {
      let serverConfigExists = false;
      setServerConfigs((prev) => {
        if (prev[serverName]) {
          serverConfigExists = true;
          if (isEqual(prev[serverName], config)) {
            return prev;
          }
        }

        return {
          ...prev,
          [serverName]: {
            ...config,
            isReconnecting: true,
          },
        };
      });

      if (serverConfigExists) {
        await closeConnection(serverName);
        delete clients.current[serverName];
        delete transports.current[serverName];
      }

      await createClientAndListTools(
        config,
        serverName,
        undefined,
        initialSync
      );

      setServerConfigs((prev) => {
        const newValue = { ...prev };
        newValue[serverName].isReconnecting = false;
        return newValue;
      });
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
  const removeConfig = useCallback((serverName: string) => {
    // Close client connection if exists
    if (clients.current[serverName]) {
      try {
        clients.current[serverName].close();
      } catch (e) {
        console.error('Error closing client:', e);
      }
    }

    delete clients.current[serverName];
    delete transports.current[serverName];

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
  }, []);

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
        clients: clients.current,
        inspectedServerName,
        transports: transports.current,
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
      inspectedServerName,
      addConfig,
      removeConfig,
      validateConfig,
      handleToggle,
    ]
  );

  return (
    <McpConnectionProvider
      client={inspectedServerName ? clients.current[inspectedServerName] : null}
      transport={
        inspectedServerName ? transports.current[inspectedServerName] : null
      }
    >
      <MCPContext.Provider value={value}>{children}</MCPContext.Provider>
    </McpConnectionProvider>
  );
};

export default Provider;
