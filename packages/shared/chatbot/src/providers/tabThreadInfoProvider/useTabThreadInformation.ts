/**
 * External dependencies
 */
import { useContextSelector } from '@google-awlt/common';
/**
 * Internal dependencies.
 */
import Context, { type TabThreadContextProps } from './context';

export function useTabThreadInformation(): TabThreadContextProps;
export function useTabThreadInformation<T>(
  selector: (state: TabThreadContextProps) => T
): T;

/**
 * Allowed list hook.
 * @param selector Selector function to partially select state.
 * @returns selected part of the state
 */
export function useTabThreadInformation<T>(
  selector: (state: TabThreadContextProps) => T | TabThreadContextProps = (
    state
  ) => state
) {
  return useContextSelector(Context, selector);
}

export default useTabThreadInformation;
