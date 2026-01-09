/**
 * External dependencies
 */
import { createContext, noop, type MCPServerConfig } from '@google-awlt/common';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface MCPProviderContextType {
  state: {
    serverConfigs: Record<string, MCPServerConfig>;
    toolList: Record<string, Tool[]>;
  };
  actions: {
    addConfig: (config: MCPServerConfig, serverName: string) => Promise<void>;
    removeConfig: (serverName: string) => void;
    validateConfig: (
      config: MCPServerConfig,
      serverName: string
    ) => Promise<{ isValid: boolean; errors: string[] }>;
    handleToggle: (serverName: string, value: boolean) => void;
  };
}

const initialState: MCPProviderContextType = {
  state: {
    serverConfigs: {},
    toolList: {},
  },
  actions: {
    addConfig: () => Promise.resolve(),
    removeConfig: noop,
    validateConfig: () => Promise.resolve({ isValid: true, errors: [] }),
    handleToggle: noop,
  },
};

export default createContext<MCPProviderContextType>(initialState);
