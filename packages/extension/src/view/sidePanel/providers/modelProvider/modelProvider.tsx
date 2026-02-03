/**
 * External dependencies.
 */
import {
  type PropsWithChildren,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { McpClientProvider } from '@mcp-b/mcp-react-hooks';
import { ExtensionClientTransport } from '@mcp-b/transports';
import { Client } from '@modelcontextprotocol/sdk/client';
import type { MCPServerConfig } from '@google-awlt/common';
/**
 * Internal dependencies.
 */
import { transportGenerator } from '../../transports';
import type { CloudHostedTransport } from '../../transports/cloudHosted';
import { GeminiNanoChatTransport } from '../../transports/geminiNano';
import Context, { FALLBACK_AGENT } from './context';
import { CONNECTION_NAMES } from '../../../../utils';
import type { AgentType, APIKeys } from '../../../../types';

export const transport = new ExtensionClientTransport({
  portName: CONNECTION_NAMES.MCP_HOST_SIDEPANEL,
});

//MCP client instance that connects to the extension background script
export const client = new Client({
  name: 'Extension Sidepanel',
  version: '1.0.0',
});

const Provider = ({ children }: PropsWithChildren) => {
  const [apiKeys, setApiKeys] = useState<{ [key: string]: APIKeys }>({});
  const [selectedAgent, setSelectedAgent] = useState<AgentType>({
    modelProvider: 'browser-ai',
    model: 'prompt-api',
  });
  const [toolNameToMCPMap, setToolNameToMCPMap] = useState<
    Record<string, string>
  >({});

  const [_transport, setTransport] = useState<
    GeminiNanoChatTransport | CloudHostedTransport
  >(FALLBACK_AGENT);
  const initialFetchDone = useRef<boolean>(false);

  useEffect(() => {
    if (!initialFetchDone.current) {
      return;
    }

    if (selectedAgent && selectedAgent?.modelProvider !== 'browser-ai') {
      setTransport(
        transportGenerator(
          selectedAgent?.modelProvider,
          selectedAgent?.model,
          {
            ...apiKeys[selectedAgent?.modelProvider],
          },
          apiKeys[selectedAgent.modelProvider]?.thinkingMode
        )
      );
    } else {
      setTransport(transportGenerator('browser-ai', 'prompt-api', {}));
    }

    chrome.storage.sync.set({
      selectedAgent,
    });
  }, [apiKeys, selectedAgent]);

  const fetchMCPServersAndCreateMapping = useCallback(async () => {
    const {
      mcpServers = {},
    }: { mcpServers: { [key: string]: MCPServerConfig } } =
      await chrome.storage.local.get('mcpServers');

    const mappedObject: Record<string, string> = {};

    Object.keys(mcpServers).forEach((key) => {
      mappedObject[key] = mcpServers[key]?.name;
    });

    setToolNameToMCPMap(mappedObject);
  }, []);

  /**
   * Sets current frames for sidebar, detected if the current tab is to be analysed,
   * parses data currently in store, set current tab URL.
   */
  const intitialSync = useCallback(async () => {
    const {
      apiKeys: _apiKeys = {},
      selectedAgent: _selectedAgent,
    }: { apiKeys: { [key: string]: APIKeys }; selectedAgent: AgentType } =
      await chrome.storage.sync.get(['apiKeys', 'selectedAgent']);

    await fetchMCPServersAndCreateMapping();

    setApiKeys(_apiKeys);

    if (!_selectedAgent) {
      setSelectedAgent({ model: 'prompt-api', modelProvider: 'browser-ai' });
      setTransport(FALLBACK_AGENT);
      (FALLBACK_AGENT as GeminiNanoChatTransport).initializeSession();
      initialFetchDone.current = true;
      return;
    }

    if (_selectedAgent?.modelProvider === 'browser-ai') {
      setSelectedAgent(_selectedAgent);
      setTransport(FALLBACK_AGENT);
      (FALLBACK_AGENT as GeminiNanoChatTransport).initializeSession();
    } else {
      setSelectedAgent(_selectedAgent);
      setTransport(
        transportGenerator(
          _selectedAgent?.modelProvider,
          _selectedAgent?.model,
          {
            ..._apiKeys[_selectedAgent?.modelProvider],
          },
          _apiKeys[_selectedAgent.modelProvider]?.thinkingMode
        )
      );
    }
    initialFetchDone.current = true;
  }, [fetchMCPServersAndCreateMapping]);

  const onSyncStorageChangedListener = useCallback(
    async (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (!changes.apiKeys) {
        return;
      }

      const { apiKeys = {} }: { apiKeys: { [key: string]: APIKeys } } =
        await chrome.storage.sync.get('apiKeys');

      setApiKeys(apiKeys);
    },
    []
  );

  const onLocalStorageChangedListener = useCallback(
    async (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (!changes.mcpServers) {
        return;
      }

      fetchMCPServersAndCreateMapping();
    },
    [fetchMCPServersAndCreateMapping]
  );

  useEffect(() => {
    if (!_transport || !initialFetchDone.current) {
      return;
    }

    if (selectedAgent?.modelProvider !== 'browser-ai') {
      return;
    }

    (_transport as GeminiNanoChatTransport).initializeSession();
  }, [selectedAgent?.modelProvider, _transport]);

  useEffect(() => {
    intitialSync();
    chrome.storage.sync.onChanged.addListener(onSyncStorageChangedListener);
    chrome.storage.local.onChanged.addListener(onLocalStorageChangedListener);
    return () => {
      chrome.storage.sync.onChanged.removeListener(
        onSyncStorageChangedListener
      );
      chrome.storage.local.onChanged.removeListener(
        onLocalStorageChangedListener
      );
    };
  }, [
    intitialSync,
    onSyncStorageChangedListener,
    onLocalStorageChangedListener,
  ]);

  const memoisedValue = useMemo(() => {
    return {
      state: {
        apiKeys,
        selectedAgent,
        transport: _transport,
        toolNameToMCPMap,
      },
      actions: {
        setSelectedAgent,
      },
    };
  }, [apiKeys, selectedAgent, toolNameToMCPMap, _transport]);

  return (
    <Context.Provider value={memoisedValue}>
      <McpClientProvider client={client} transport={transport} opts={{}}>
        {children}
      </McpClientProvider>
    </Context.Provider>
  );
};

export default Provider;
