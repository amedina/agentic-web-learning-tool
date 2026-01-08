/**
 * External dependencies
 */
import { createContext } from '@google-awlt/common';
/**
 * Internal dependencies.
 */
import type { APIKeys } from '../../../../types';

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

export default createContext<ModelProviderStoreContext>(initialState);
