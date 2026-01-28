/**
 * External dependencies.
 */
import { useState, useCallback, useEffect } from 'react';
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

const allToolsFilters = {
  type: {
    title: 'Type',
    hasStaticFilterValues: true,
    filterValues: {
      MCP: { selected: null },
      WebMCP: { selected: null },
    },
  },
};

const eventLoggerFilters = {
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
};

const allToolsColumns: TableColumn[] = [
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
];

const eventLoggerColumns: TableColumn[] = [
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
];

const EventLoggerTable = () => {
  const { tools: availableTools } = useMcpClient();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [showAllTools, setShowAllTools] = useState(true);
  const [allToolsData, setAllToolsData] = useState<TableData[]>([]);
  const [eventLoggerData] = useState<TableData[]>([
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
  ]);

  useEffect(() => {
    if (availableTools) {
      const tools = availableTools.map((tool) => ({
        name: tool.name,
        originalData: {},
        inputSchema: tool.inputSchema,
        description: tool.description,
      }));

      setAllToolsData(tools);
    }
  }, [availableTools]);

  const extraInterfaceToTopBar = useCallback(() => {
    return (
      <label className="flex items-center gap-2 w-[130px]">
        <input
          type="checkbox"
          checked={showAllTools}
          onChange={() => setShowAllTools(!showAllTools)}
        />
        <span className="text-xs select-none">Show all tools</span>
      </label>
    );
  }, [showAllTools]);

  return (
    <TableProvider
      data={showAllTools ? allToolsData : eventLoggerData}
      tableColumns={showAllTools ? allToolsColumns : eventLoggerColumns}
      tableFilterData={showAllTools ? allToolsFilters : eventLoggerFilters}
      tableSearchKeys={TABLE_SEARCH_KEYS}
      onRowClick={(row: TableData) => {
        setSelectedKey(row?.name ?? null);
      }}
      onRowContextMenu={noop}
      getRowObjectKey={(row: any) => row?.originalData.name as string}
    >
      <Table
        selectedKey={selectedKey}
        isFiltersSidebarOpen={true}
        extraInterfaceToTopBar={extraInterfaceToTopBar}
        containerClasses="min-h-screen"
      />
    </TableProvider>
  );
};

export default EventLoggerTable;
