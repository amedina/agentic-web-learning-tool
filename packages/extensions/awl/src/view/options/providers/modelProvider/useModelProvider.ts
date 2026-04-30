/**
 * External dependencies
 */
import { useContextSelector } from '@agentic-labs/common';
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
