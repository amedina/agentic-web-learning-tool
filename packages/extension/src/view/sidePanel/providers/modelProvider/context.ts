/**
 * Internal dependencies.
 */
import { noop, createContext } from '../../../../utils'
import type { GeminiNanoChatTransport } from '../../transports/geminiNano';
import type { CloudHostedTrapsort } from '../../transports/cloudHosted';

export interface ModelProviderStoreContext {
  state: {
    selectedModel: string;
    selectedProvider: string;
    transport: GeminiNanoChatTransport | CloudHostedTrapsort | null;
    baseUrl: string;
    apiKey: string;
  };
  actions: {
    setSelectedModel: (model: string, provider: string) => void,
    handleCustomConfig: (baseUrl: string, customConfig: Record<string, any>) => void;
    setApiKey: React.Dispatch<React.SetStateAction<string>>,
  };
}

const initialState: ModelProviderStoreContext = {
  state: {
    selectedModel: '',
    selectedProvider: '',
    transport: null,
    baseUrl: '',
    apiKey: ''
  },
  actions: {
    setSelectedModel: noop,
    handleCustomConfig: noop,
    setApiKey: noop,
  },
};

export default createContext<ModelProviderStoreContext>(initialState);
