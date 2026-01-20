/**
 * External dependencies.
 */
import { Search, RefreshCw } from 'lucide-react';

interface ToolbarProps {
  searchQuery: string;
  onSearchChange?: (query: string) => void;
  onRefresh?: () => void;
  items: any[];
}

const Toolbar = ({
  searchQuery,
  onSearchChange,
  onRefresh,
  items,
}: ToolbarProps) => {
  return (
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
  );
};

export default Toolbar;
