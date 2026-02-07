/**
 * External dependencies
 */
import type { TableColumn, InfoType } from '@google-awlt/design-system';

export const TABLE_SEARCH_KEYS = ['name', 'type'];

export const ALL_TOOLS_FILTERS = {
  type: {
    title: 'Type',
    hasStaticFilterValues: true,
    filterValues: {
      MCP: { selected: null },
      WebMCP: { selected: null },
    },
  },
};

export const EVENT_LOGGER_FILTERS = {
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
      pending: { selected: null },
    },
  },
};

export const EVENT_LOGGER_COLUMNS: TableColumn[] = [
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
];

export const TOOL_CATEGORIES = {
  USER: 'user',
  BUILT_IN: 'built-in',
  MCP_SERVER: 'mcp-server',
  MCP_B: 'mcp-b',
  WEBSITE: 'website',
  WORKFLOW: 'workflow',
};
