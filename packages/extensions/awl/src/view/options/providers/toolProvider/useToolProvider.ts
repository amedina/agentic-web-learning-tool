/**
 * External dependencies
 */
import { useContextSelector } from '@agentic-labs/common';
/**
 * Internal dependencies.
 */
import Context, { type ToolProviderStoreContext } from './context';

export function useToolProvider(): ToolProviderStoreContext;
export function useToolProvider<T>(
  selector: (state: ToolProviderStoreContext) => T
): T;

export function useToolProvider<T>(
  selector: (
    state: ToolProviderStoreContext
  ) => T | ToolProviderStoreContext = (state) => state
) {
  return useContextSelector(Context, selector);
}

export default useToolProvider;
