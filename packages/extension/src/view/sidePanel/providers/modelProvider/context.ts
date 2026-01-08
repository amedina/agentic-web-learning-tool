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

export interface ModelProviderStoreContext {
	state: {
		apiKeys: { [key: string]: APIKeys };
		selectedAgent: AgentType;
		transport: GeminiNanoChatTransport | CloudHostedTransport | null;
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
		transport: null,
	},
	actions: {
		setSelectedAgent: noop,
	},
};

export default createContext<ModelProviderStoreContext>(initialState);
