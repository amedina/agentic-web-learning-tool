/**
 * External dependencies
 */
import { noop, createContext } from '@google-awlt/common';
/**
 * Internal dependencies.
 */
import {  } from '../../../../utils'
import type { AgentType } from '@/types';

export interface ModelProviderStoreContext {
  state: {
    agents: AgentType[],
    selectedAgent: AgentType[]
  };
  actions: {
    setSelectedAgent: React.Dispatch<React.SetStateAction<AgentType>>,
  };
}

const initialState: ModelProviderStoreContext = {
  state: {
    agents: [],
    selectedAgent: [],
  },
  actions: {
    setSelectedAgent: noop
  },
};

export default createContext<ModelProviderStoreContext>(initialState);
