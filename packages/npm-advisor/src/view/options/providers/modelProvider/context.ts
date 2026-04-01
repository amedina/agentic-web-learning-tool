/**
 * External dependencies
 */
import { createContext } from "react";

/**
 * Internal dependencies
 */
import type { APIKeys } from "../../../../types";

export interface ModelProviderStoreContext {
  state: {
    apiKeys: { [key: string]: APIKeys };
  };
}

const initialState: ModelProviderStoreContext = {
  state: {
    apiKeys: {},
  },
};

const ModelContext = createContext<ModelProviderStoreContext>(initialState);

export default ModelContext;
