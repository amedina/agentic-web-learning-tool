/**
 * External dependencies
 */
import { createContext, noop, type MCPServerConfig } from '@google-awlt/common';
import type { Client } from '@modelcontextprotocol/sdk/client';
import type { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import type { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
/**
 * Internal dependencies
 */
import type { StatelessHTTPClientTransport } from './StatelessHTTPClientTransport';

export interface MCPProviderContextType {
  state: {
    serverConfigs: Record<string, MCPServerConfig>;
    toolList: Record<string, { tools: Tool[]; isError: boolean }>;
    clients: Record<string, Client>;
    inspectedServerName: string | null;
    transports: {
      [key: string]:
        | StreamableHTTPClientTransport
        | SSEClientTransport
        | StatelessHTTPClientTransport;
    };
  };
  actions: {
    addConfig: (config: MCPServerConfig, serverName: string) => Promise<void>;
    removeConfig: (serverName: string) => void;
    validateConfig: (
      config: MCPServerConfig,
      serverName: string
    ) => Promise<{ isValid: boolean; errors: string[] }>;
    handleToggle: (serverName: string, value: boolean) => void;
    setInspectedServerName: (serverName: string | null) => void;
  };
}

const initialState: MCPProviderContextType = {
  state: {
    serverConfigs: {},
    toolList: {},
    inspectedServerName: null,
    clients: {},
    transports: {},
  },
  actions: {
    addConfig: () => Promise.resolve(),
    removeConfig: noop,
    validateConfig: () => Promise.resolve({ isValid: true, errors: [] }),
    handleToggle: noop,
    setInspectedServerName: noop,
  },
};

export default createContext<MCPProviderContextType>(initialState);
