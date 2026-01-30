/**
 * External dependencies
 */
import { useEffect } from 'react';

/**
 * Internal dependencies
 */
import { useEventLogsContext } from '../context';

export const useEventLogs = (initialLastRunToolName: string | null = null) => {
  const context = useEventLogsContext();

  // Update lastRunToolName when prop changes, if needed
  useEffect(() => {
    if (initialLastRunToolName) {
      context.setLastRunToolName(initialLastRunToolName);
    }
  }, [initialLastRunToolName, context]);

  return context;
};
