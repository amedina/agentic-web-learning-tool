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
import type { MCPConfig, MCPServerConfig } from '@google-awlt/common';
import {
  StreamableHTTPClientTransport,
  StreamableHTTPError,
} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { toast } from '@google-awlt/design-system';

/**
 * Internal dependencies
 */
import MCPContext, { type MCPProviderContextType } from './context';
import { logger } from '../../../../utils';

const Provider = ({ children }: PropsWithChildren) => {
  // We use a functional update to ensure we always have a fresh Map
  const [serverConfigs, setServerConfigs] = useState<
    MCPProviderContextType['state']['serverConfigs']
  >({});

  const [toolList, setToolList] = useState<
    MCPProviderContextType['state']['toolList']
  >({});

  const initialFetch = useRef(false);

  const createClientAndListTools = useCallback(
    async (
      config: MCPServerConfig,
      serverName: string,
      doNotStoreTools = false,
      initialSync = false
    ) => {
      try {
        if (!config.enabled || toolList[serverName]?.tools?.length > 0) {
          return;
        }

        const requestInit: RequestInit = {};

        if (config.authToken) {
          requestInit.headers = {
            Authorization: `Bearer ${config.authToken}`,
          };
        }

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
      } catch (error) {
        const errorMessage = `Couldnt add ${config.name} ${
          //@ts-expect-error -- message extends error
          (error as typeof StreamableHTTPError)?.message ??
          'Error fetching tools from MCP Server.'
        }`;

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
    [toolList]
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
      setServerConfigs((prev) => ({
        ...prev,
        [serverName]: config,
      }));

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
        initialFetch.current = true;
      }
    );
  }, [addConfig]);

  useEffect(() => {
    initialSync();
  }, [initialSync]);

  /**
   * Action: Remove a Server Configuration
   */
  const removeConfig = useCallback((serverName: string) => {
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
    async (config: MCPServerConfig, serverName: string) => {
      const errors: string[] = [];

      if (!serverName || serverName.trim().length === 0) {
        errors.push('Server name is required.');
      }

      if (
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
      },
      actions: {
        addConfig,
        removeConfig,
        validateConfig,
        handleToggle,
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

  return <MCPContext.Provider value={value}>{children}</MCPContext.Provider>;
};

export default Provider;
