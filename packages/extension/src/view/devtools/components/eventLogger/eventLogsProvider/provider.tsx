/**
 * External dependencies
 */
import { useState, useEffect, useMemo, type PropsWithChildren } from 'react';
import { type TableData } from '@google-awlt/design-system';

/**
 * Internal dependencies
 */
import EventLogsContext, { type EventLogsContextProps } from './context';
import { MESSAGE_TYPES } from '../../../../../utils';
import type { ToolExecutionLog } from '../types';
import { isLocalTool, getRowKey } from '../utils';

function EventLogsProvider({ children }: PropsWithChildren) {
  const [eventLoggerData, setEventLoggerData] = useState<TableData[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [lastRunToolName, setLastRunToolName] = useState<string | null>(null);

  const tabId = chrome.devtools?.inspectedWindow?.tabId;

  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === MESSAGE_TYPES.TOOL_LOG) {
        setEventLoggerData((prevData) => {
          const newLog = message.payload as ToolExecutionLog;

          // Filter out if not local tool
          if (!isLocalTool(newLog.toolName, tabId)) {
            return prevData;
          }

          const existingIndex = prevData.findIndex(
            (item) => item.originalData.id === newLog.id
          );

          const mappedLog: TableData = {
            name: newLog.toolName,
            time: new Date(newLog.startTime).toLocaleTimeString(),
            type: newLog.type,
            status: newLog.status,
            duration: newLog.duration ? `${newLog.duration}ms` : '-',
            originalData: newLog,
            description: newLog.result ? 'Success' : newLog.error || 'Pending',
          };

          if (existingIndex !== -1) {
            const updatedData = [...prevData];
            updatedData[existingIndex] = {
              ...updatedData[existingIndex],
              ...mappedLog,
            };
            return updatedData;
          } else {
            return [mappedLog, ...prevData];
          }
        });

        const newLog = message.payload as ToolExecutionLog;

        // Auto-select the row if it matches the last run tool
        if (newLog.toolName === lastRunToolName) {
          setLastRunToolName(null);
          const key = getRowKey(
            newLog.toolName,
            new Date(newLog.startTime).toLocaleTimeString()
          );
          setSelectedKey(key);
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [lastRunToolName, tabId]);

  const contextValue = useMemo<EventLogsContextProps>(
    () => ({
      state: {
        eventLoggerData,
        selectedKey,
        lastRunToolName,
      },
      actions: {
        setSelectedKey,
        setLastRunToolName,
      },
    }),
    [eventLoggerData, selectedKey, lastRunToolName]
  );

  return (
    <EventLogsContext.Provider value={contextValue}>
      {children}
    </EventLogsContext.Provider>
  );
}

export default EventLogsProvider;
