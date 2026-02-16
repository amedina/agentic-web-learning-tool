/**
 * External dependencies
 */
import {
  useState,
  useEffect,
  useMemo,
  type PropsWithChildren,
  useCallback,
} from 'react';
import { type TableData, type WebMCPTool } from '@google-awlt/design-system';

/**
 * Internal dependencies
 */
import EventLogsContext, { type EventLogsContextProps } from './context';
import { MESSAGE_TYPES } from '../../../../utils';
import type { ToolExecutionLog } from '../../types';

function EventLogsProvider({ children }: PropsWithChildren) {
  const [eventLoggerData, setEventLoggerData] = useState<TableData[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [lastRunToolName, setLastRunToolName] = useState<string | null>(null);
  const [isToolRunning, setIsToolRunning] = useState<boolean>(false);

  const tabId = chrome.devtools?.inspectedWindow?.tabId;

  useEffect(() => {
    if (tabId) {
      chrome.storage.session.get(`eventLog_${tabId}`, (result) => {
        if (result[`eventLog_${tabId}`]) {
          setEventLoggerData(result[`eventLog_${tabId}`] as TableData[]);
        }
      });
    }
  }, [tabId]);

  useEffect(() => {
    if (tabId && eventLoggerData.length > 0) {
      chrome.storage.session.set({ [`eventLog_${tabId}`]: eventLoggerData });
    }
  }, [eventLoggerData, tabId]);

  const onLocalStorageChangedListener = useCallback(
    (changes: any) => {
      if (changes?.['userWebMCPTools']?.newValue) {
        const userWebMCPTool = changes?.['userWebMCPTools']
          ?.newValue as WebMCPTool;

        const updatedEventLoggerData = eventLoggerData.map((tool) => {
          const regexp = new RegExp('debugger');
          const debuggerCount = tool.originalData?.editedScript.code
            .matchAll(regexp)
            .toArray().length;
          const debuggerCountInUserTool = userWebMCPTool?.editedScript?.code
            ?.matchAll(regexp)
            //@ts-expect-error -- matchAll is not available in older versions of typescript
            .toArray().length;
          if (debuggerCount < debuggerCountInUserTool) {
            return tool;
          }
          if (
            tool.originalData.name === userWebMCPTool.name &&
            tool.originalData?.editedScript &&
            tool.originalData.editedScript.tabId ===
              chrome.devtools.inspectedWindow.tabId
          ) {
            delete tool.originalData.editedScript;
          }
          return tool;
        });

        setEventLoggerData(updatedEventLoggerData);
        chrome.storage.session.set({
          [`eventLog_${tabId}`]: updatedEventLoggerData,
        });
      }
    },
    [eventLoggerData]
  );

  useEffect(() => {
    chrome.storage.local.onChanged.addListener(onLocalStorageChangedListener);
    return () =>
      chrome.storage.local.onChanged.removeListener(
        onLocalStorageChangedListener
      );
  }, [onLocalStorageChangedListener]);

  const handleMessage = useCallback(
    (message: any) => {
      if (message.type === MESSAGE_TYPES.TOOL_LOG) {
        const newLog = message.payload as ToolExecutionLog;

        newLog.id = newLog.id || crypto.randomUUID();

        const mappedLog: TableData = {
          id: newLog.id,
          name: newLog.toolName,
          time: new Date(newLog.startTime).toLocaleTimeString(),
          type: newLog.type,
          status: newLog.status,
          duration: newLog.duration ? `${newLog.duration}ms` : '-',
          originalData: newLog,
          description: newLog.result ? 'Success' : newLog.error || 'Pending',
        };

        setEventLoggerData((prevData) => {
          const existingIndex = prevData.findIndex(
            (item) => item.originalData.id === newLog.id
          );

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

        if (isToolRunning && newLog.id !== selectedKey) {
          setSelectedKey(newLog.id);
        }
      }
    },
    [isToolRunning, tabId, selectedKey]
  );

  useEffect(() => {
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [handleMessage]);

  const contextValue = useMemo<EventLogsContextProps>(
    () => ({
      state: {
        eventLoggerData,
        selectedKey,
        lastRunToolName,
        isToolRunning,
      },
      actions: {
        setEventLoggerData,
        setSelectedKey,
        setLastRunToolName,
        setIsToolRunning,
      },
    }),
    [eventLoggerData, selectedKey, lastRunToolName, isToolRunning]
  );

  return (
    <EventLogsContext.Provider value={contextValue}>
      {children}
    </EventLogsContext.Provider>
  );
}

export default EventLogsProvider;
