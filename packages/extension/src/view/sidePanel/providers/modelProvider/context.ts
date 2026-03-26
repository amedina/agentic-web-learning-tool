/**
 * External dependencies
 */
import { noop, createContext } from '@google-awlt/common';
/**
 * Internal dependencies.
 */
import type { AgentType, APIKeys } from '../../../../types';
import type { CloudHostedTransport } from '../../transports/cloudHosted';
import type { GeminiNanoChatTransport } from '../../transports/geminiNano';
import { transportGenerator } from '../../transports';

export const FALLBACK_AGENT = transportGenerator(
  'browser-ai',
  'prompt-api',
  {}
);
export interface ModelProviderStoreContext {
  state: {
    apiKeys: { [key: string]: APIKeys };
    selectedAgent: AgentType;
    transport: GeminiNanoChatTransport | CloudHostedTransport;
    toolNameToMCPMap: Record<string, string>;
  };
  actions: {
    setSelectedAgent: React.Dispatch<React.SetStateAction<AgentType>>;
  };
}

const initialState: ModelProviderStoreContext = {
  state: {
    apiKeys: {},
    selectedAgent: {
      modelProvider: 'browser-ai',
      model: 'prompt-api',
    },
    toolNameToMCPMap: {},
    transport: FALLBACK_AGENT,
  },
  actions: {
    setSelectedAgent: noop,
  },
};

export default createContext<ModelProviderStoreContext>(initialState);
