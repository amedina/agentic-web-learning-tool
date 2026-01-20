/**
 * External dependencies.
 */
import { type ReactNode } from 'react';

/**
 * Internal dependencies.
 */
import { cn } from '../../lib/utils';

export interface Column<T> {
  header: string;
  width: string;
  render: (item: T) => ReactNode;
  className?: string;
}

export interface TableProps<T> {
  items: T[];
  columns: Column<T>[];
  selectedItem: T | null;
  onSelectItem: (item: T | null) => void;
  keyExtractor: (item: T) => string;
  highlightedItemId?: string | null;
  searchQuery?: string;
  noItemsMessage?: string;
  onRowClick?: (item: T) => void;
}

export function Table<T>({
  items,
  columns,
  selectedItem,
  onSelectItem,
  keyExtractor,
  highlightedItemId,
  searchQuery = '',
  noItemsMessage = 'No items found',
  onRowClick,
}: TableProps<T>) {
  return (
    <div className="flex-1 overflow-auto bg-white pb-0">
      <table className="w-full text-left border-collapse table-fixed">
        <thead className="sticky top-0 z-10 bg-[#f1f3f4] text-[#202124]">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={cn(
                  'font-medium px-4 py-1 border-r border-b border-[#cbcbcb] select-none',
                  col.width
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f1f3f4]">
          {items.map((item, index) => {
            const isSelected =
              selectedItem && keyExtractor(selectedItem) === keyExtractor(item);
            return (
              <tr
                key={keyExtractor(item)}
                onClick={() => {
                  if (onRowClick) {
                    onRowClick(item);
                  } else {
                    onSelectItem(item);
                  }
                }}
                className={cn(
                  'cursor-default transition-colors duration-1000',
                  isSelected
                    ? 'bg-[#1a73e8] text-white'
                    : highlightedItemId === keyExtractor(item)
                      ? 'bg-yellow-100 hover:bg-yellow-200'
                      : index % 2 === 0
                        ? 'bg-white hover:bg-[#f1f3f4]'
                        : 'bg-[#f8f9fa] hover:bg-[#f1f3f4]'
                )}
              >
                {columns.map((col, idx) => (
                  <td
                    key={idx}
                    className={cn(
                      'px-4 py-1 truncate border-r border-[#e0e0e0]',
                      isSelected ? 'border-transparent' : '',
                      col.className
                    )}
                  >
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="p-4 text-center text-[#5f6368] italic"
              >
                {noItemsMessage} "{searchQuery}"
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
