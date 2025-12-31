/**
 * External dependencies
 */
import { useContextSelector } from '@google-awlt/common';
/**
 * Internal dependencies.
 */
import Context, { type ToolProviderStoreContext } from './context';

export function useToolProvider(): ToolProviderStoreContext;
export function useToolProvider<T>(selector: (state: ToolProviderStoreContext) => T): T;

/**
 * Cookie store hook.
 * @param selector Selector function to partially select state.
 * @returns selected part of the state
 */
export function useToolProvider<T>(
  selector: (state: ToolProviderStoreContext) => T | ToolProviderStoreContext = (state) =>
    state
) {
  return useContextSelector(Context, selector);
}

export default useToolProvider;
