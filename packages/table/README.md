# @google-awlt/table

A powerful, standalone React table component extracted from the Google PSAT design system. This package provides a feature-rich data table with support for sorting, filtering, searching, column resizing, column visibility, and persistent settings.

## Features

- **Sortable Columns**: Built-in support for column sorting.
- **Filtering**: Advanced filtering capabilities with a dedicated sidebar and chip visualization.
- **Search**: Integrated search functionality.
- **Column Management**: Users can resize columns and toggle their visibility.
- **Persistent Settings**: Table state (sort order, active filters, column visibility) can be persisted.
- **Customizable**: Supports custom cell rendering, icons, and theming.
- **Portable**: Includes its own Tailwind CSS configuration and styles.

## Installation

```bash
npm install @google-awlt/table
```

## Styling Setup

This package uses Tailwind CSS. To ensure styles are applied correctly, you must import the provided CSS file in your application's entry point (e.g., `App.tsx` or `index.ts`):

```typescript
import "@google-awlt/table/theme.css";
```

If you are using Tailwind CSS in your project, the table's styles are scoped and should not conflict. The package includes a `tailwind.config.cjs` which is utilized by the internal `theme.css`.

## Basic Usage

Here is a minimal example of how to use the `Table` component.

```tsx
import React from "react";
import { Table, TableColumn, TableData } from "@google-awlt/table";
import "@google-awlt/table/theme.css"; // Import styles

const MyTable = () => {
  // 1. Define your data
  // Data must match the TableData type structure or extend it
  const data: TableData[] = [
    { name: "Apple", category: "Fruit", price: 1.2 },
    { name: "Carrot", category: "Vegetable", price: 0.8 },
    { name: "Banana", category: "Fruit", price: 1.1 },
  ];

  // 2. Define your columns
  const columns: TableColumn[] = [
    {
      header: "Name",
      accessorKey: "name",
      cell: (info) => info,
      enableHiding: false, // Prevent hiding this column
    },
    {
      header: "Category",
      accessorKey: "category",
      cell: (info) => <span className="badge">{info}</span>,
    },
    {
      header: "Price",
      accessorKey: "price",
      cell: (info) => `$${Number(info).toFixed(2)}`,
      sortingComparator: (a, b) => Number(a) - Number(b),
    },
  ];

  return (
    <div style={{ height: "500px", width: "100%" }}>
      <Table
        data={data}
        tableColumns={columns}
        // Optional: Unique key for row identification
        getRowObjectKey={(row) => row.originalData.name as string}
        // Optional: Handle row clicks
        onRowClick={(row) => console.log("Clicked:", row)}
      />
    </div>
  );
};

export default MyTable;
```

## API Reference

### `Table` Component Props (`TableProviderProps`)

| Prop                         | Type                                           | Description                                                                |
| :--------------------------- | :--------------------------------------------- | :------------------------------------------------------------------------- |
| `data`                       | `TableData[]`                                  | **Required**. Array of data objects to display.                            |
| `tableColumns`               | `TableColumn[]`                                | **Required**. Configuration for table columns.                             |
| `getRowObjectKey`            | `(row: TableRow) => string`                    | **Required**. Function to generate a unique key for each row.              |
| `onRowClick`                 | `(row: TableData \| null) => void`             | **Required**. Callback fired when a row is clicked.                        |
| `onRowContextMenu`           | `(e: React.MouseEvent, row: TableRow) => void` | **Required**. Callback for right-click context menu.                       |
| `tableFilterData`            | `TableFilter`                                  | Optional. Configuration for the filter sidebar.                            |
| `tableSearchKeys`            | `string[]`                                     | Optional. Array of keys (column accessorKeys) to include in search.        |
| `tablePersistentSettingsKey` | `string`                                       | Optional. Key used for local storage persistence of table state.           |
| `exportTableData`            | `(rows: TableRow[]) => void`                   | Optional. Function to handle "Export" button click.                        |
| `minColumnWidth`             | `number`                                       | Optional. Minimum width for columns (default is often applied internally). |

### `TableColumn` Definition

Values defining how a column behaves and renders.

```typescript
type TableColumn = {
  header: string; // Title shown in header
  accessorKey: string; // Key to access value in data object
  cell: (info: InfoType, details?: TableData) => React.JSX.Element | InfoType; // Render function
  enableHiding?: boolean; // Can user hide this column?
  isHiddenByDefault?: boolean; // Is it hidden initially?
  sortingComparator?: (a: InfoType, b: InfoType) => number; // Custom sort function
  initialWidth?: number; // Starting width
  minWidth?: number; // Minimum resize width
  maxWidth?: number; // Maximum resize width
};
```

### Filtering Configuration (`TableFilter`)

To enable the advanced filter sidebar, pass a `tableFilterData` object.

```typescript
const filterConfig: TableFilter = {
  category: {
    // Matches 'accessorKey' in columns
    title: "Category",
    description: "Filter by item category",
    hasStaticFilterValues: true, // If true, calculates values from data
    filterValues: {
      // Optional: Pre-define values
      Fruit: { selected: false },
      Vegetable: { selected: false },
    },
  },
};

<Table
  // ...
  tableFilterData={filterConfig}
/>;
```

## LLM Usage Tips

If you are an AI assistant using this package:

1.  **Always import the CSS**: `@google-awlt/table/theme.css` is strictly required for layout and visibility.
2.  **Define Columns Carefully**: Ensure `accessorKey` matches the keys in your `data` objects.
3.  **Row Keys**: The `getRowObjectKey` prop is critical for React rendering performance and selection state. ensure it returns a unique primitive (string/number).
4.  **Types**: Use the exported `TableData`, `TableColumn`, and `TableFilter` types to ensure type safety when constructing props.
