/**
 * External dependencies.
 */
import { useState, useMemo, useEffect } from 'react';
import { useMcpClient } from '@mcp-b/mcp-react-hooks';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { EventLoggerTable, type Column } from '@google-awlt/design-system';

/**
 * Internal dependencies.
 */
import { MESSAGE_TYPES } from '../../utils';

interface ToolExecutionLog {
  id: string;
  type: 'MCP' | 'WebMCP';
  toolName: string;
  args: any;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'success' | 'error';
  result?: any;
  error?: string;
}

const EventLogger = () => {
  const { tools: availableTools } = useMcpClient();
  const [showAvailableTools, setShowAvailableTools] = useState(false);
  const [logs, setLogs] = useState<ToolExecutionLog[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === MESSAGE_TYPES.TOOL_LOG) {
        setLogs((prevLogs) => {
          const newLog = message.payload as ToolExecutionLog;
          const existingIndex = prevLogs.findIndex((l) => l.id === newLog.id);

          if (existingIndex !== -1) {
            const updatedLogs = [...prevLogs];
            updatedLogs[existingIndex] = {
              ...updatedLogs[existingIndex],
              ...newLog,
            };
            return updatedLogs;
          } else {
            return [...prevLogs, newLog];
          }
        });
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  const filteredTools = useMemo(() => {
    return availableTools.filter((tool) =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableTools, searchQuery]);

  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) =>
        log.toolName.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .reverse();
  }, [logs, searchQuery]);

  const selectedItem = useMemo(() => {
    if (showAvailableTools) {
      return availableTools.find((t) => t.name === selectedItemId) || null;
    }
    return logs.find((l) => l.id === selectedItemId) || null;
  }, [showAvailableTools, availableTools, logs, selectedItemId]);

  const toolColumns: Column<Tool>[] = [
    { header: 'Name', width: 'w-[30%]', render: (t) => t.name },
    {
      header: 'Description',
      width: 'w-[50%]',
      render: (t) => t.description || '-',
    },
    {
      header: 'Schema',
      width: 'w-[20%]',
      render: (t) => t.inputSchema?.type || 'object',
    },
  ];

  const logColumns: Column<ToolExecutionLog>[] = [
    {
      header: 'Time',
      width: 'w-[15%]',
      render: (l) =>
        new Date(l.startTime).toLocaleTimeString([], {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
    },
    { header: 'Type', width: 'w-[15%]', render: (l) => l.type },
    { header: 'Name', width: 'w-[30%]', render: (l) => l.toolName },
    {
      header: 'Duration',
      width: 'w-[15%]',
      render: (l) => (l.duration !== undefined ? `${l.duration}ms` : '...'),
    },
    {
      header: 'Status',
      width: 'w-[25%]',
      render: (l) => (
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
            l.status === 'success'
              ? 'bg-green-100 text-green-800'
              : l.status === 'error'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {l.status.toUpperCase()}
        </span>
      ),
    },
  ];

  const renderToolDetail = (tool: Tool) => (
    <>
      <div className="p-2 border-b border-[#f1f3f4]">
        <div className="text-[10px] font-bold text-[#5f6368] mb-1">
          DESCRIPTION
        </div>
        <div className="text-[#202124] select-text text-xs">
          {tool.description || 'No description provided.'}
        </div>
      </div>
      <div className="flex-1 p-2 bg-white max-h-full overflow-auto">
        <div className="text-[10px] font-bold text-[#5f6368] mb-1">
          INPUT SCHEMA
        </div>
        <pre className="font-mono text-[11px] text-[#db4437] whitespace-pre-wrap break-all select-text bg-[#f8f9fa] p-2 rounded border border-[#f1f3f4]">
          {JSON.stringify(tool.inputSchema, null, 2)}
        </pre>
      </div>
    </>
  );

  const renderLogDetail = (log: ToolExecutionLog) => (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-2 border-b border-[#f1f3f4] overflow-auto min-h-0">
        <div className="text-[10px] font-bold text-[#5f6368] mb-1">
          ARGUMENTS
        </div>
        <pre className="font-mono text-[11px] text-[#202124] whitespace-pre-wrap break-all select-text bg-[#f8f9fa] p-2 rounded border border-[#f1f3f4]">
          {JSON.stringify(log.args, null, 2)}
        </pre>
      </div>
      <div className="flex-1 p-2 overflow-auto min-h-0">
        <div className="text-[10px] font-bold text-[#5f6368] mb-1">
          {log.status === 'error' ? 'ERROR' : 'OUTPUT'}
        </div>
        <pre
          className={`font-mono text-[11px] whitespace-pre-wrap break-all select-text bg-[#f8f9fa] p-2 rounded border border-[#f1f3f4] ${log.status === 'error' ? 'text-red-600' : 'text-[#188038]'}`}
        >
          {log.status === 'error'
            ? log.error
            : JSON.stringify(log.result, null, 2)}
        </pre>
      </div>
    </div>
  );

  return (
    <div className="relative flex flex-col h-full w-full">
      <EventLoggerTable
        items={showAvailableTools ? filteredTools : filteredLogs}
        columns={
          showAvailableTools ? (toolColumns as any) : (logColumns as any)
        }
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedItem={selectedItem}
        onSelectItem={(item) =>
          setSelectedItemId(
            item
              ? showAvailableTools
                ? (item as Tool).name
                : (item as ToolExecutionLog).id
              : null
          )
        }
        renderDetail={(item) =>
          showAvailableTools
            ? renderToolDetail(item as Tool)
            : renderLogDetail(item as ToolExecutionLog)
        }
        keyExtractor={(item) =>
          showAvailableTools
            ? (item as Tool).name
            : (item as ToolExecutionLog).id
        }
        noItemsMessage={`No ${showAvailableTools ? 'tools' : 'logs'} found matching`}
        onRefresh={() => {
          if (!showAvailableTools) setLogs([]); // Clear logs
        }}
      />

      <div className="absolute top-1.5 right-40 z-50 flex items-center gap-2 bg-[#f1f3f4]">
        <label className="flex items-center gap-1.5 text-[11px] text-[#5f6368] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showAvailableTools}
            onChange={(e) => {
              setShowAvailableTools(e.target.checked);
              setSelectedItemId(null);
              setSearchQuery('');
            }}
            className="w-3 h-3 rounded-sm border-gray-300 text-[#1a73e8] focus:ring-[#1a73e8]"
          />
          Show Available Tools
        </label>
      </div>
    </div>
  );
};

export default EventLogger;
