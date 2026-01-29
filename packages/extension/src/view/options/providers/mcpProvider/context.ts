/**
 * External dependencies
 */
import { createContext, noop, type MCPServerConfig } from '@google-awlt/common';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

export interface MCPProviderContextType {
  state: {
    serverConfigs: Record<string, MCPServerConfig>;
    toolList: Record<string, { tools: Tool[]; isError: boolean }>;
    clients: Record<string, Client>;
    inspectedServerName: string | null;
  };
  actions: {
    addConfig: (config: MCPServerConfig, serverName: string) => Promise<void>;
    removeConfig: (serverName: string) => void;
    validateConfig: (
      config: MCPServerConfig,
      serverName: string
    ) => Promise<{ isValid: boolean; errors: string[] }>;
    handleToggle: (serverName: string, value: boolean) => void;
    getClient: (serverName: string) => Promise<Client | undefined>;
    setInspectedServerName: (serverName: string | null) => void;
  };
}

const initialState: MCPProviderContextType = {
  state: {
    serverConfigs: {},
    toolList: {},
    clients: {},
    inspectedServerName: null,
  },
  actions: {
    addConfig: () => Promise.resolve(),
    removeConfig: noop,
    validateConfig: () => Promise.resolve({ isValid: true, errors: [] }),
    handleToggle: noop,
    getClient: () => Promise.resolve(undefined),
    setInspectedServerName: noop,
  },
};

export default createContext<MCPProviderContextType>(initialState);
