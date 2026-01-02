/**
 * External dependencies
 */
import { noop, createContext } from '@google-awlt/common';
/**
 * Internal dependencies.
 */
import type { AgentType } from '../../../../types';
import type { CloudHostedTransport } from '../../transports/cloudHosted';
import type { GeminiNanoChatTransport } from '../../transports/geminiNano';
import { DEFAULT_AGENTS } from '../../../../constants';

export interface ModelProviderStoreContext {
  state: {
    agents: AgentType[],
    selectedAgent: AgentType,
    transport: GeminiNanoChatTransport | CloudHostedTransport | null;
  };
  actions: {
    setSelectedAgent: React.Dispatch<React.SetStateAction<AgentType>>,
  };
}

const initialState: ModelProviderStoreContext = {
  state: {
    agents: [],
    selectedAgent: DEFAULT_AGENTS[0],
    transport: null
  },
  actions: {
    setSelectedAgent: noop
  },
};

export default createContext<ModelProviderStoreContext>(initialState);
