import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { PanelBottom, ChevronDown, Download } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BottomTrayProps<T> {
  selectedItem: T | null;
  renderDetail: (item: T) => ReactNode;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

export function BottomTray<T>({
  selectedItem,
  renderDetail,
  isMinimized,
  onToggleMinimize,
}: BottomTrayProps<T>) {
  const [trayHeight, setTrayHeight] = useState(300);
  const isDragging = useRef(false);

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
        if (isMinimized) onToggleMinimize();
      }
    },
    [isMinimized, onToggleMinimize]
  );

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  if (!selectedItem) return null;

  const currentTrayHeight = isMinimized ? 33 : trayHeight;

  return (
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
        onClick={onToggleMinimize}
      >
        <div
          className={cn(
            'transform transition-transform',
            isMinimized ? 'rotate-180' : 'rotate-0'
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
            title={isMinimized ? 'Restore' : 'Minimize'}
            onClick={(e) => {
              e.stopPropagation();
              onToggleMinimize();
            }}
          >
            <PanelBottom className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tray Content */}
      {!isMinimized && (
        <div className="flex-1 overflow-auto p-0 flex">
          <div className="w-full h-full flex flex-col">
            {renderDetail(selectedItem)}
          </div>
        </div>
      )}
    </div>
  );
}
