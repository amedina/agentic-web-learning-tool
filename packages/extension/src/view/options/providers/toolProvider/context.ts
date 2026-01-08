/**
 * External dependencies
 */
import { createContext, noop } from '@google-awlt/common';
import type { WebMCPTool } from '@google-awlt/design-system';
import type { Dispatch, SetStateAction } from 'react';

export interface ToolProviderStoreContext {
  state: {
    userTools: WebMCPTool[];
    builtInTools: WebMCPTool[];
  };
  actions: {
    setUserTools: Dispatch<SetStateAction<WebMCPTool[]>>;
    setBuiltInTools: Dispatch<SetStateAction<WebMCPTool[]>>;
    saveBuiltInState: (tools: WebMCPTool[]) => void;
    saveUserTools: (tools: WebMCPTool[]) => void;
  };
}

const initialState: ToolProviderStoreContext = {
  state: {
    userTools: [],
    builtInTools: [],
  },
  actions: {
    setBuiltInTools: noop,
    setUserTools: noop,
    saveBuiltInState: noop,
    saveUserTools: noop,
  },
};

export default createContext<ToolProviderStoreContext>(initialState);
