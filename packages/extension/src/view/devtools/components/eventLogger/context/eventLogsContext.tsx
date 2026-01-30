/**
 * External dependencies
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { type TableData } from '@google-awlt/design-system';

/**
 * Internal dependencies
 */
import { MESSAGE_TYPES } from '../../../../../utils';
import type { ToolExecutionLog } from '../types';
import { isLocalTool, getRowKey } from '../utils';

export interface EventLogsContextType {
  eventLoggerData: TableData[];
  selectedKey: string | null;
  setSelectedKey: (key: string | null) => void;
  setLastRunToolName: (name: string | null) => void;
}

const EventLogsContext = createContext<EventLogsContextType | undefined>(
  undefined
);

export const EventLogsProvider = ({ children }: { children: ReactNode }) => {
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

  return (
    <EventLogsContext.Provider
      value={{
        eventLoggerData,
        selectedKey,
        setSelectedKey,
        setLastRunToolName,
      }}
    >
      {children}
    </EventLogsContext.Provider>
  );
};

export const useEventLogsContext = () => {
  const context = useContext(EventLogsContext);
  if (context === undefined) {
    throw new Error(
      'useEventLogsContext must be used within a EventLogsProvider'
    );
  }
  return context;
};
