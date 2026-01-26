/**
 * External dependencies.
 */
import { useState, useCallback } from 'react';
import {
  Table,
  TableProvider,
  type TableColumn,
  type TableData,
  type InfoType,
} from '@google-awlt/design-system';
import clsx from 'clsx';

const noop = () => {};

const tableSearchKeys = ['name', 'type'];

const tableFilters = {
  type: {
    title: 'Type',
    hasStaticFilterValues: true,
    filterValues: {
      MCP: { selected: null },
      WebMCP: { selected: null },
    },
  },
  status: {
    title: 'Status',
    hasStaticFilterValues: true,
    filterValues: {
      Success: { selected: null },
      Error: { selected: null },
    },
  },
};

const tableColumns: TableColumn[] = [
  {
    header: 'Time',
    accessorKey: 'time',
    cell: (info: InfoType) => info,
  },
  {
    header: 'Type',
    accessorKey: 'type',
    cell: (info: InfoType) => info,
  },
  {
    header: 'Name',
    accessorKey: 'name',
    cell: (info: InfoType) => info,
    enableHiding: false,
  },
  {
    header: 'Duration',
    accessorKey: 'duration',
    cell: (info: InfoType) => info,
    enableHiding: false,
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: (info: InfoType) => (
      <span
        className={clsx(info === 'Success' ? 'text-green-600' : 'text-red-600')}
      >
        {info}
      </span>
    ),
  },
];

const mockData: TableData[] = [
  {
    name: 'get_page_title',
    time: '203',
    type: 'MCP',
    status: 'Success',
    duration: '203',
    originalData: {},
    description: 'Cookie A description',
  },
  {
    name: 'alert_page_title',
    time: '200',
    type: 'WebMCP',
    status: 'Success',
    duration: '203',
    originalData: {},
    description: 'Cookie B description',
  },
  {
    name: 'get_page_background',
    time: '100',
    type: 'WebMCP',
    status: 'Error',
    duration: '200',
    originalData: {},
    description: 'Cookie C description',
  },
  {
    name: 'get_info',
    time: '100',
    type: 'MCP',
    status: 'Success',
    duration: '203',
    originalData: {},
    description: 'Cookie D description',
  },
  {
    name: 'update_profile',
    time: '23',
    type: 'MCP',
    status: 'Success',
    duration: '203',
    originalData: {},
    description: 'Cookie E description',
  },
];

const EventLoggerTable = () => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const extraInterfaceToTopBar = useCallback(() => {
    return (
      <div className="flex items-center gap-2 w-[130px]">
        <input id="show-all-tools" type="checkbox" />
        <label htmlFor="show-all-tools" className="text-xs select-none">
          Show all tools
        </label>
      </div>
    );
  }, []);

  return (
    <TableProvider
      data={mockData}
      tableColumns={tableColumns}
      tableFilterData={tableFilters}
      tableSearchKeys={tableSearchKeys}
      onRowClick={(row: TableData) => {
        setSelectedKey(row?.name ?? null);
      }}
      onRowContextMenu={noop}
      getRowObjectKey={(row: any) => row?.originalData.name as string}
    >
      <Table
        selectedKey={selectedKey}
        isFiltersSidebarOpen={false}
        extraInterfaceToTopBar={extraInterfaceToTopBar}
      />
    </TableProvider>
  );
};

export default EventLoggerTable;
