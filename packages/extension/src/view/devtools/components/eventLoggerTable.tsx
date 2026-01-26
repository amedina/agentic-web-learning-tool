/**
 * External dependencies.
 */
import { useState } from 'react';

/**
 * Internal dependencies.
 */
import {
  Table,
  TableProvider,
  type TableColumn,
  type TableData,
  type InfoType,
} from '@google-awlt/design-system';

const noop = () => {};

const tableSearchKeys = ['name', 'category'];

const tableFilters = {
  category: {
    title: 'Category',
    hasStaticFilterValues: true,
    filterValues: {
      Analytics: { selected: null },
      Marketing: { selected: null },
      Functional: { selected: null },
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
      <span className={info === 'Active' ? 'text-green-600' : 'text-red-600'}>
        {info}
      </span>
    ),
  },
];

const mockData: TableData[] = [
  {
    name: 'Cookie A',
    category: 'Analytics',
    status: 'Active',
    originalData: {},
    description: 'Cookie A description',
  },
  {
    name: 'Cookie B',
    category: 'Marketing',
    status: 'Inactive',
    originalData: {},
    description: 'Cookie B description',
  },
  {
    name: 'Cookie C',
    category: 'Functional',
    status: 'Active',
    originalData: {},
    description: 'Cookie C description',
  },
  {
    name: 'Cookie D',
    category: 'Analytics',
    status: 'Active',
    originalData: {},
    description: 'Cookie D description',
  },
  {
    name: 'Cookie E',
    category: 'Marketing',
    status: 'Inactive',
    originalData: {},
    description: 'Cookie E description',
  },
];

const EventLoggerTable = () => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

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
      <Table selectedKey={selectedKey} isFiltersSidebarOpen={false} />
    </TableProvider>
  );
};

export default EventLoggerTable;
