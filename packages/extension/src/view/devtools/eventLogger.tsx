/**
 * External dependencies.
 */
import { useMcpClient } from '@mcp-b/mcp-react-hooks';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Search, RefreshCw, PanelBottom, ChevronDown } from 'lucide-react';

const EventLogger = () => {
  const { tools } = useMcpClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToolName, setSelectedToolName] = useState<string | null>(null);

  const [trayHeight, setTrayHeight] = useState(300);
  const [isTrayMinimized, setIsTrayMinimized] = useState(false);
  const isDragging = useRef(false);

  const filteredTools = useMemo(() => {
    return tools.filter((tool) =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tools, searchQuery]);

  const selectedTool = useMemo(
    () => tools.find((t) => t.name === selectedToolName),
    [tools, selectedToolName]
  );

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
      // Calculate new height from bottom
      // window.innerHeight is approx full height; e.clientY is cursor Y.
      // So height = winHeight - e.clientY
      const newHeight = window.innerHeight - e.clientY;

      // Constrain height (min 30px for header, max 80% of screen)
      const minHeight = 32; // slightly more than header
      const maxHeight = window.innerHeight * 0.8;

      if (newHeight >= minHeight && newHeight <= maxHeight) {
        setTrayHeight(newHeight);
        // If user drags, assume they want it open
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

  // Toggle minimize
  const toggleMinimize = useCallback(() => {
    setIsTrayMinimized((prev) => !prev);
  }, []);

  const currentTrayHeight =
    selectedTool && isTrayMinimized ? 33 : selectedTool ? trayHeight : 0;

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
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="w-3.5 h-3.5 absolute left-2 top-1 text-[#5f6368]" />
          </div>
          <div className="h-4 w-[1px] bg-[#dadce0] mx-1" />
          <button
            className="p-1 hover:bg-[#dfe1e5] rounded text-[#5f6368]"
            title="Refresh"
            onClick={() => {
              /* Implement refresh logic if available */
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-2 text-[#5f6368]">
          <span>Count: {filteredTools.length}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden relative">
        {/* Table Area */}
        <div className="flex-1 overflow-auto bg-white pb-0">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 z-10 bg-[#f1f3f4] text-[#202124]">
              <tr>
                <th className="font-medium px-4 py-1 border-r border-b border-[#cbcbcb] w-[30%] select-none">
                  Name
                </th>
                <th className="font-medium px-4 py-1 border-r border-b border-[#cbcbcb] w-[50%] select-none">
                  Description
                </th>
                <th className="font-medium px-4 py-1 border-b border-[#cbcbcb] w-[20%] select-none">
                  Schema Type
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f3f4]">
              {filteredTools.map((tool, index) => {
                const isSelected = selectedToolName === tool.name;
                return (
                  <tr
                    key={tool.name}
                    onClick={() => {
                      setSelectedToolName(tool.name);
                      // Auto-open if it was closed effectively (height 0)
                      if (!selectedToolName) setIsTrayMinimized(false);
                    }}
                    className={`cursor-default ${
                      isSelected
                        ? 'bg-[#1a73e8] text-white'
                        : index % 2 === 0
                          ? 'bg-white hover:bg-[#f1f3f4]'
                          : 'bg-[#f8f9fa] hover:bg-[#f1f3f4]'
                    }`}
                  >
                    <td
                      className={`px-4 py-1 truncate border-r border-[#e0e0e0] ${isSelected ? 'border-transparent' : ''}`}
                    >
                      {tool.name}
                    </td>
                    <td
                      className={`px-4 py-1 truncate border-r border-[#e0e0e0] ${isSelected ? 'border-transparent' : ''}`}
                    >
                      {tool.description || '-'}
                    </td>
                    <td className="px-4 py-1 truncate">
                      {tool.inputSchema?.type || 'object'}
                    </td>
                  </tr>
                );
              })}
              {filteredTools.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="p-4 text-center text-[#5f6368] italic"
                  >
                    No tools found matching "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Detail Tray */}
        {selectedTool && (
          <div
            className="flex flex-col border-t border-[#cbcbcb] bg-white absolute bottom-0 w-full shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
            style={{
              height: currentTrayHeight,
              transition: isDragging.current ? 'none' : 'height 0.2s',
            }}
          >
            {/* Resizer Handle (Transparent overlay on top border) */}
            <div
              className={`absolute top-0 left-0 w-full h-1 cursor-ns-resize hover:bg-[#1a73e8] z-20 ${
                isDragging.current ? 'bg-[#1a73e8]' : 'bg-transparent'
              }`}
              onMouseDown={handleMouseDown}
            />

            {/* Tray Toolbar */}
            <div
              className="flex items-center px-2 py-1 bg-[#f1f3f4] border-b border-[#e0e0e0] gap-4 shrink-0 select-none cursor-pointer"
              onClick={toggleMinimize}
            >
              <div
                className={`transform transition-transform ${isTrayMinimized ? 'rotate-180' : 'rotate-0'}`}
              >
                <ChevronDown className="w-3.5 h-3.5 text-[#5f6368]" />
              </div>
              <div className="font-bold text-[#202124]">Tool Details</div>
              <div className="flex items-center gap-1 ml-auto">
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
                  <div className="p-2 border-b border-[#f1f3f4]">
                    <div className="text-[10px] font-bold text-[#5f6368] mb-1">
                      DESCRIPTION
                    </div>
                    <div className="text-[#202124] select-text text-xs">
                      {selectedTool.description || 'No description provided.'}
                    </div>
                  </div>
                  <div className="flex-1 p-2 bg-white max-h-full overflow-auto">
                    <div className="text-[10px] font-bold text-[#5f6368] mb-1">
                      INPUT SCHEMA
                    </div>
                    <pre className="font-mono text-[11px] text-[#db4437] whitespace-pre-wrap break-all select-text bg-[#f8f9fa] p-2 rounded border border-[#f1f3f4]">
                      {JSON.stringify(selectedTool.inputSchema, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventLogger;
