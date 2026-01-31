/**
 * External dependencies
 */
import { useCallback, useEffect } from 'react';
import {
  Table,
  TableProvider,
  LogDetail,
  Toaster,
  type TableRow,
} from '@google-awlt/design-system';
import { noop } from '@google-awlt/common';

/**
 * Internal Dependencies
 */
import {
  EVENT_LOGGER_FILTERS,
  EVENT_LOGGER_COLUMNS,
  TABLE_SEARCH_KEYS,
} from './constants';
import { useEventLogs } from './eventLogsProvider';
import { useSettings } from '../../../stateProviders';

export const WebMCPInspector = () => {
  const { eventLoggerData, selectedKey, setSelectedKey } = useEventLogs(
    ({ state, actions }) => ({
      eventLoggerData: state.eventLoggerData,
      selectedKey: state.selectedKey,
      setSelectedKey: actions.setSelectedKey,
    })
  );
  const { theme } = useSettings(({ state }) => ({ theme: state.theme }));

  useEffect(() => {
    console.log(selectedKey, 'selectedKey');
  }, [selectedKey]);

  const renderDetailPanel = useCallback((row: TableRow) => {
    let data = row.originalData;

    if (data.originalData) {
      data = data.originalData;
    }

    return <LogDetail log={data as any} />;
  }, []);

  return (
    <TableProvider
      data={eventLoggerData}
      tableColumns={EVENT_LOGGER_COLUMNS}
      tableFilterData={EVENT_LOGGER_FILTERS}
      tableSearchKeys={TABLE_SEARCH_KEYS}
      onRowClick={(row: any) => {
        setSelectedKey(row?.id);
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
        isFiltersSidebarOpen={true}
        renderDetailPanel={renderDetailPanel}
      />
    </TableProvider>
  );
};
