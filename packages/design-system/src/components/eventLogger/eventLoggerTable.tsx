/**
 * External dependencies.
 */
import { useState, useCallback, type ReactNode } from 'react';

/**
 * Internal dependencies.
 */
import Toolbar from './toolbar';
import { Table, type Column } from './table';
import { BottomTray } from './bottomTray';

export type { Column };
export interface EventLoggerTableProps<T> {
  items: T[];
  columns: Column<T>[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectedItem: T | null;
  onSelectItem: (item: T | null) => void;
  renderDetail: (item: T) => ReactNode;
  keyExtractor: (item: T) => string;
  noItemsMessage?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
  highlightedItemId?: string | null;
}

export function EventLoggerTable<T>({
  items,
  columns,
  searchQuery = '',
  onSearchChange,
  selectedItem,
  onSelectItem,
  renderDetail,
  keyExtractor,
  noItemsMessage = 'No items found',
  onRefresh,
  highlightedItemId,
}: EventLoggerTableProps<T>) {
  const [isTrayMinimized, setIsTrayMinimized] = useState(false);

  const toggleMinimize = useCallback(() => {
    setIsTrayMinimized((prev) => !prev);
  }, []);

  return (
    <div className="flex flex-col h-screen w-full bg-white text-[11px] font-sans text-[#303942]">
      <Toolbar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onRefresh={onRefresh}
        items={items}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden relative">
        {/* Table Area */}
        <Table
          items={items}
          columns={columns}
          selectedItem={selectedItem}
          onSelectItem={onSelectItem}
          keyExtractor={keyExtractor}
          highlightedItemId={highlightedItemId}
          searchQuery={searchQuery}
          noItemsMessage={noItemsMessage}
          onRowClick={(item) => {
            onSelectItem(item);
            if (!selectedItem) setIsTrayMinimized(false);
          }}
        />

        {/* Bottom Detail Tray */}
        <BottomTray
          selectedItem={selectedItem}
          renderDetail={renderDetail}
          isMinimized={isTrayMinimized}
          onToggleMinimize={toggleMinimize}
        />
      </div>
    </div>
  );
}
