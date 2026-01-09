/**
 * External dependencies
 */
import { useContextSelector } from '@google-awlt/common';
/**
 * Internal dependencies.
 */
import Context, { type MCPProviderContextType } from './context';

export function useMcpProvider(): MCPProviderContextType;
export function useMcpProvider<T>(
  selector: (state: MCPProviderContextType) => T
): T;

/**
 * Allowed list hook.
 * @param selector Selector function to partially select state.
 * @returns selected part of the state
 */
export function useMcpProvider<T>(
  selector: (state: MCPProviderContextType) => T | MCPProviderContextType = (
    state
  ) => state
) {
  return useContextSelector(Context, selector);
}

export default useMcpProvider;
