/**
 * External dependencies
 */
import { useCallback } from 'react';
import {
  Table,
  TableProvider,
  LogDetail,
  Toaster,
  type TableRow,
  type WebMCPTool,
} from '@google-awlt/design-system';
import { noop } from '@google-awlt/common';
import { Ban } from 'lucide-react';

/**
 * Internal Dependencies
 */
import {
  EVENT_LOGGER_FILTERS,
  EVENT_LOGGER_COLUMNS,
  TABLE_SEARCH_KEYS,
} from '../../constants';
import { useEventLogs } from '../../providers';
import { useSettings } from '../../../stateProviders';

export const Inspector = () => {
  const { eventLoggerData, selectedKey, setSelectedKey, setEventLoggerData } =
    useEventLogs(({ state, actions }) => ({
      eventLoggerData: state.eventLoggerData,
      selectedKey: state.selectedKey,
      setSelectedKey: actions.setSelectedKey,
      setEventLoggerData: actions.setEventLoggerData,
    }));
  const { theme } = useSettings(({ state }) => ({ theme: state.theme }));

  const renderDetailPanel = useCallback((row: TableRow) => {
    let data = row.originalData;

    if (data.originalData) {
      data = data.originalData;
    }

    const onScriptChange = async (newCode: string) => {
      const { userWebMCPTools } =
        await chrome.storage.local.get('userWebMCPTools');
      const reformedWebMcpTools = (userWebMCPTools as WebMCPTool[]).map(
        (tool) => {
          if (tool.name !== data.toolName) {
            return tool;
          }

          if (tool.editedScript) {
            tool.editedScript.code = newCode;
            tool.editedScript.tabId.push(chrome.devtools.inspectedWindow.tabId);
          } else {
            tool = {
              ...tool,
              editedScript: {
                tabId: [chrome.devtools.inspectedWindow.tabId],
                code: newCode,
              },
            };
          }
          return tool;
        }
      );

      chrome.storage.local.set({
        userWebMCPTools: reformedWebMcpTools,
      });
    };

    return <LogDetail log={data as any} onScriptChange={onScriptChange} />;
  }, []);

  const resetTable = useCallback(() => {
    const tabId = chrome.devtools?.inspectedWindow?.tabId;
    chrome.storage.session.set({ [`eventLog_${tabId}`]: [] });
    setSelectedKey(null);
    setEventLoggerData([]);
  }, [setEventLoggerData, setSelectedKey]);

  const extraInterfaceToTopBar = useCallback(() => {
    return (
      <button onClick={resetTable} title="Reset log">
        <Ban width={15} height={15} color="#404040" />
      </button>
    );
  }, [resetTable]);

  return (
    <TableProvider
      data={eventLoggerData}
      tableColumns={EVENT_LOGGER_COLUMNS}
      tableFilterData={EVENT_LOGGER_FILTERS}
      tableSearchKeys={TABLE_SEARCH_KEYS}
      tablePersistentSettingsKey="inspectorTable"
      onRowClick={(row: any) => {
        if (row?.id) {
          setSelectedKey(row?.id);
        }
      }}
      onRowContextMenu={noop}
      getRowObjectKey={(row: any) => {
        const data = row.originalData || row;
        return data?.id as string;
      }}
    >
      <Toaster
        position="top-center"
        theme={theme === 'auto' ? 'system' : theme}
        toastOptions={{
          duration: 1000,
        }}
      />
      <Table
        selectedKey={selectedKey}
        isFiltersSidebarOpen={eventLoggerData.length > 0}
        hideFiltering={eventLoggerData.length === 0}
        extraInterfaceToTopBar={extraInterfaceToTopBar}
        renderDetailPanel={renderDetailPanel}
      />
    </TableProvider>
  );
};
