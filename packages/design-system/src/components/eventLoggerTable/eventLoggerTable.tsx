import { useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  Search,
  RefreshCw,
  PanelBottom,
  ChevronDown,
  Download,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface Column<T> {
  header: string;
  width: string; // Tailwind width class or percentage
  render: (item: T) => ReactNode;
  className?: string; // Additional classes for the cell
}

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
  // Resize & User Preference State
  const [trayHeight, setTrayHeight] = useState(300);
  const [isTrayMinimized, setIsTrayMinimized] = useState(false);
  const isDragging = useRef(false);

  // --- Resize Handlers ---
  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newHeight = window.innerHeight - e.clientY;
      const minHeight = 32;
      const maxHeight = window.innerHeight * 0.8;

      if (newHeight >= minHeight && newHeight <= maxHeight) {
        setTrayHeight(newHeight);
        if (isTrayMinimized) setIsTrayMinimized(false);
      }
    },
    [isTrayMinimized]
  );

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const toggleMinimize = useCallback(() => {
    setIsTrayMinimized((prev) => !prev);
  }, []);

  const currentTrayHeight =
    selectedItem && isTrayMinimized ? 33 : selectedItem ? trayHeight : 0;

  return (
    <div className="flex flex-col h-screen w-full bg-white text-[11px] font-sans text-[#303942]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-[#cbcbcb] bg-[#f1f3f4] shrink-0 h-7">
        <div className="flex items-center gap-2">
          <div className="relative group">
            <input
              type="text"
              placeholder="Search"
              className="pl-7 pr-2 py-0.5 border border-[#dadce0] rounded-sm text-xs w-40 focus:outline-none focus:border-[#1a73e8] hover:border-[#80868b] transition-colors"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              disabled={!onSearchChange}
            />
            <Search className="w-3.5 h-3.5 absolute left-2 top-1 text-[#5f6368]" />
          </div>
          <div className="h-4 w-[1px] bg-[#dadce0] mx-1" />
          <button
            className="p-1 hover:bg-[#dfe1e5] rounded text-[#5f6368]"
            title="Refresh"
            onClick={onRefresh}
            disabled={!onRefresh}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-2 text-[#5f6368]">
          <span>Count: {items.length}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden relative">
        {/* Table Area */}
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
                  selectedItem &&
                  keyExtractor(selectedItem) === keyExtractor(item);
                return (
                  <tr
                    key={keyExtractor(item)}
                    onClick={() => {
                      onSelectItem(item);
                      if (!selectedItem) setIsTrayMinimized(false);
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

        {/* Bottom Detail Tray */}
        {selectedItem && (
          <div
            className="flex flex-col border-t border-[#cbcbcb] bg-white absolute bottom-0 w-full shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
            style={{
              height: currentTrayHeight,
              transition: isDragging.current ? 'none' : 'height 0.2s',
            }}
          >
            {/* Resizer Handle */}
            <div
              className={cn(
                'absolute top-0 left-0 w-full h-1 cursor-ns-resize hover:bg-[#1a73e8] z-20',
                isDragging.current ? 'bg-[#1a73e8]' : 'bg-transparent'
              )}
              onMouseDown={handleMouseDown}
            />

            {/* Tray Toolbar */}
            <div
              className="flex items-center px-2 py-1 bg-[#f1f3f4] border-b border-[#e0e0e0] gap-4 shrink-0 select-none cursor-pointer"
              onClick={toggleMinimize}
            >
              <div
                className={cn(
                  'transform transition-transform',
                  isTrayMinimized ? 'rotate-180' : 'rotate-0'
                )}
              >
                <ChevronDown className="w-3.5 h-3.5 text-[#5f6368]" />
              </div>
              <div className="font-bold text-[#202124]">Details</div>
              <div className="flex items-center gap-1 ml-auto">
                <button
                  className="p-1 hover:bg-[#dfe1e5] rounded text-[#5f6368]"
                  title="Copy JSON"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Generic copy handler could be added prop
                  }}
                >
                  <Download className="w-3 h-3" />
                </button>
                <button
                  className="p-1 hover:bg-[#dfe1e5] rounded text-[#5f6368]"
                  title={isTrayMinimized ? 'Restore' : 'Minimize'}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMinimize();
                  }}
                >
                  <PanelBottom className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Tray Content */}
            {!isTrayMinimized && (
              <div className="flex-1 overflow-auto p-0 flex">
                <div className="w-full h-full flex flex-col">
                  {renderDetail(selectedItem)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
