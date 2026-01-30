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
} from '@google-awlt/design-system';
import { noop } from '@google-awlt/common';

/**
 * Internal Dependencies
 */
import { useSettings } from '../../../stateProviders';
import {
  EVENT_LOGGER_FILTERS,
  EVENT_LOGGER_COLUMNS,
  TABLE_SEARCH_KEYS,
} from './constants';
import { getRowKey } from './utils';
import { useEventLogs } from './hooks/useEventLogs';

export const WebMCPInspector = () => {
  const { eventLoggerData, selectedKey, setSelectedKey } = useEventLogs();
  const { theme } = useSettings(({ state }) => ({ theme: state.theme }));

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
        const rowKey = getRowKey(row?.name, row?.time);
        setSelectedKey(rowKey);
      }}
      onRowContextMenu={noop}
      getRowObjectKey={(row: any) => {
        const data = row.original || row;
        const name = data?.name as string;
        const time = data?.time as string;
        return getRowKey(name, time);
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
