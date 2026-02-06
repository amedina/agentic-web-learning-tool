/**
 * External dependencies
 */
import { useContextSelector } from '@google-awlt/common';

/**
 * Internal dependencies
 */
import Context, { type EventLogsContextProps } from './context';

export function useEventLogs(): EventLogsContextProps;
export function useEventLogs<T>(
  selector: (state: EventLogsContextProps) => T
): T;

/**
 * Hook to access event logs context.
 * @param selector Selector function to partially select state.
 * @returns selected part of the state
 */
export function useEventLogs<T>(
  selector: (state: EventLogsContextProps) => T | EventLogsContextProps = (
    state
  ) => state
) {
  return useContextSelector(Context, selector);
}

export default useEventLogs;
