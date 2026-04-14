/**
 * External dependencies
 */
import { useContextSelector } from '@google-awlt/common';
/**
 * Internal dependencies.
 */
import Context, { type ModelProviderStoreContext } from './context';

export function useModelProvider(): ModelProviderStoreContext;
export function useModelProvider<T>(
  selector: (state: ModelProviderStoreContext) => T
): T;

export function useModelProvider<T>(
  selector: (
    state: ModelProviderStoreContext
  ) => T | ModelProviderStoreContext = (state) => state
) {
  return useContextSelector(Context, selector);
}

export default useModelProvider;
