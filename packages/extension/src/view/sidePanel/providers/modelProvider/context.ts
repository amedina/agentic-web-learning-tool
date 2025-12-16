/**
 * External dependencies.
 */
import type { AssistantRuntime } from '@assistant-ui/react';
/**
 * Internal dependencies.
 */
import { noop, createContext } from '../../../../utils'

export interface ModelProviderStoreContext {
  state: {
    selectedModel: string;
    selectedProvider: string;
    runtime: AssistantRuntime | null;
  };
  actions: {
    setSelectedModel: (model: string, provider: string) => void,
  };
}

const initialState: ModelProviderStoreContext = {
  state: {
    selectedModel: '',
    selectedProvider: '',
    runtime: null,
  },
  actions: {
    setSelectedModel: noop,
  },
};

export default createContext<ModelProviderStoreContext>(initialState);
