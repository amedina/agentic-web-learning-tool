/**
 * External dependencies.
 */
import { useState, useCallback } from 'react';
import { useMcpClient } from '@mcp-b/mcp-react-hooks';
import {
  Table,
  TableProvider,
  type TableColumn,
  type TableData,
  type InfoType,
} from '@google-awlt/design-system';

/**
 * Internal Dependencies
 */
import ActionButton from './actionButton';

const noop = () => {};

const TABLE_SEARCH_KEYS = ['name', 'type'];

const tableFilters = {
  allAvailableTools: {
    type: {
      title: 'Type',
      hasStaticFilterValues: true,
      filterValues: {
        MCP: { selected: null },
        WebMCP: { selected: null },
      },
    },
  },
  eventLogger: {
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
        success: { selected: null },
        error: { selected: null },
      },
    },
    duration: {
      title: 'Duration',
      hasStaticFilterValues: true,
      filterValues: {
        success: { selected: null },
        error: { selected: null },
      },
    },
  },
};

const tableColumns: Record<string, TableColumn[]> = {
  allAvailableTools: [
    {
      header: 'Name',
      accessorKey: 'name',
      cell: (info: InfoType) => info,
      enableHiding: false,
    },
    {
      header: 'Description',
      accessorKey: 'description',
      cell: (info: InfoType) => info,
      enableHiding: false,
    },
    {
      header: 'Action',
      accessorKey: 'action',
      cell: (info: InfoType) => <ActionButton onRunTool={noop} t={info} />,
    },
  ],
  eventLogger: [
    {
      header: 'Name',
      accessorKey: 'name',
      cell: (info: InfoType) => info,
      enableHiding: false,
    },
    {
      header: 'Time',
      accessorKey: 'time',
      cell: (info: InfoType) => info,
      enableHiding: false,
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: (info: InfoType) => info,
      enableHiding: false,
    },
    {
      header: 'Status',
      accessorKey: 'status',
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
      header: 'Description',
      accessorKey: 'description',
      cell: (info: InfoType) => info,
      enableHiding: false,
    },
  ],
};

const EventLoggerTable = () => {
  const { tools: availableTools } = useMcpClient();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [showAllTools, setShowAllTools] = useState(false);

  console.log(availableTools, 'availableTools');

  const tableData: Record<string, TableData[]> = {
    allAvailableTools: [
      {
        name: 'get_page_title',
        originalData: {},
        description: 'Cookie A description',
      },
      {
        name: 'alert_page_title',
        originalData: {},
        description: 'Cookie B description',
      },
    ],
    eventLogger: [
      {
        name: 'get_page_title',
        time: '203',
        type: 'MCP',
        status: 'success',
        duration: '203',
        originalData: {},
        description: 'Cookie A description',
      },
      {
        name: 'alert_page_title',
        time: '200',
        type: 'WebMCP',
        status: 'success',
        duration: '203',
        originalData: {},
        description: 'Cookie B description',
      },
    ],
  };

  const extraInterfaceToTopBar = useCallback(() => {
    return (
      <div className="flex items-center gap-2 w-[130px]">
        <input
          id="show-all-tools"
          type="checkbox"
          checked={showAllTools}
          onChange={() => setShowAllTools(!showAllTools)}
        />
        <label htmlFor="show-all-tools" className="text-xs select-none">
          Show all tools
        </label>
      </div>
    );
  }, [showAllTools]);

  return (
    <TableProvider
      data={showAllTools ? tableData.allAvailableTools : tableData.eventLogger}
      tableColumns={
        showAllTools ? tableColumns.allAvailableTools : tableColumns.eventLogger
      }
      tableFilterData={
        showAllTools ? tableFilters.allAvailableTools : tableFilters.eventLogger
      }
      tableSearchKeys={TABLE_SEARCH_KEYS}
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
        containerClasses="min-h-screen"
      />
    </TableProvider>
  );
};

export default EventLoggerTable;
