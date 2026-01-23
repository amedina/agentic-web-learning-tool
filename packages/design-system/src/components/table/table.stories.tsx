/*
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Table,
  TableProvider,
  type TableColumn,
  type TableData,
  type InfoType,
} from './index';
import { useState } from 'react';

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
    header: 'Name',
    accessorKey: 'name',
    cell: (info: InfoType) => info,
    enableHiding: false,
  },
  {
    header: 'Category',
    accessorKey: 'category',
    cell: (info: InfoType) => info,
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
  },
  {
    name: 'Cookie B',
    category: 'Marketing',
    status: 'Inactive',
    originalData: {},
  },
  {
    name: 'Cookie C',
    category: 'Functional',
    status: 'Active',
    originalData: {},
  },
  {
    name: 'Cookie D',
    category: 'Analytics',
    status: 'Active',
    originalData: {},
  },
  {
    name: 'Cookie E',
    category: 'Marketing',
    status: 'Inactive',
    originalData: {},
  },
];

const meta: Meta<typeof Table> = {
  title: 'DesignSystem/Table',
  component: Table,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="h-[500px] w-full border border-gray-200 rounded-lg overflow-hidden">
        <Story />
      </div>
    ),
  ],
};

export default meta;

export const Default: StoryObj<typeof Table> = {
  render: () => {
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
  },
};

export const WithFiltersOpen: StoryObj<typeof Table> = {
  render: () => (
    <TableProvider
      data={mockData}
      tableColumns={tableColumns}
      tableFilterData={tableFilters}
      tableSearchKeys={tableSearchKeys}
      onRowClick={noop}
      onRowContextMenu={noop}
      getRowObjectKey={(row: any) => row.name as string}
    >
      <Table selectedKey={null} isFiltersSidebarOpen={true} />
    </TableProvider>
  ),
};
