/**
 * External dependencies
 */
import { useContextSelector } from '@google-awlt/common';
/**
 * Internal dependencies.
 */
import Context, { type CommandProviderContextType } from './context';

export function useCommandProvider(): CommandProviderContextType;
export function useCommandProvider<T>(
  selector: (state: CommandProviderContextType) => T
): T;

/**
 * Cookie store hook.
 * @param selector Selector function to partially select state.
 * @returns selected part of the state
 */
export function useCommandProvider<T>(
  selector: (
    state: CommandProviderContextType
  ) => T | CommandProviderContextType = (state) => state
) {
  return useContextSelector(Context, selector);
}

export default useCommandProvider;
