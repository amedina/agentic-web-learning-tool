/**
 * External dependencies.
 */
import { useState, useMemo, useEffect } from 'react';
import { useMcpClient } from '@mcp-b/mcp-react-hooks';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  EventLoggerTable,
  type Column,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  SyntaxHighlighter,
  toast,
} from '@google-awlt/design-system';

/**
 * Internal dependencies.
 */
import { MESSAGE_TYPES } from '../../utils';
import { RunToolPanel } from './components/runToolPanel';

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
  script?: string;
}

const EventLogger = () => {
  const { tools: availableTools, client } = useMcpClient();
  const [showAvailableTools, setShowAvailableTools] = useState(false);
  const [logs, setLogs] = useState<ToolExecutionLog[]>([]);
  const [selectedToolToRun, setSelectedToolToRun] = useState<Tool | null>(null);
  const [highlightedLogId, setHighlightedLogId] = useState<string | null>(null);
  const [lastRunToolName, setLastRunToolName] = useState<string | null>(null);

  const handleRunTool = async (toolName: string, args: any) => {
    if (!client) {
      console.error('MCP Client not available');
      return;
    }

    setLastRunToolName(toolName);

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error('Tool execution timed out after 30s')),
          30000
        );
      });

      // Race the tool execution against the timeout
      await Promise.race([
        client.callTool({
          name: toolName,
          arguments: args,
        }),
        timeoutPromise,
      ]);

      toast.success('Tool execution completed');
      setShowAvailableTools(false);
    } catch (error) {
      console.error('Error running tool:', error);
      toast.error(
        error instanceof Error ? error.message : 'Tool execution failed'
      );
      setLastRunToolName(null); // Reset if failed
      throw error;
    }
  };

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
            // Check if this is the tool we just ran and want to highlight
            if (newLog.toolName === lastRunToolName) {
              setHighlightedLogId(newLog.id);
              setLastRunToolName(null);

              // Clear highlight after 2 seconds
              setTimeout(() => {
                setHighlightedLogId(null);
              }, 2000);
            }
            return [...prevLogs, newLog];
          }
        });
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [lastRunToolName]);

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
      width: 'w-[45%]',
      render: (t) => t.description || '-',
    },
    {
      header: 'Schema',
      width: 'w-[15%]',
      render: (t) => t.inputSchema?.type || 'object',
    },
    {
      header: 'Action',
      width: 'w-[10%]',
      render: (t) => (
        <button
          className="p-1 hover:bg-gray-200 rounded text-green-600 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedToolToRun(t);
          }}
          title="Run Tool"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </button>
      ),
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

  const renderLogDetail = (log: ToolExecutionLog) => {
    const showTabs = log.type === 'WebMCP' || !!log.script;

    if (!showTabs) {
      return (
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
    }

    return (
      <Tabs defaultValue="execution" className="flex flex-col h-full">
        <div className="px-2 pt-2 border-b border-[#f1f3f4]">
          <TabsList className="h-7 p-0 bg-transparent gap-2">
            <TabsTrigger
              value="execution"
              className="text-[11px] px-2 py-1 data-[state=active]:bg-[#e8f0fe] data-[state=active]:text-[#1967d2] rounded-none border-b-2 border-transparent data-[state=active]:border-[#1967d2]"
            >
              Execution
            </TabsTrigger>
            <TabsTrigger
              value="script"
              className="text-[11px] px-2 py-1 data-[state=active]:bg-[#e8f0fe] data-[state=active]:text-[#1967d2] rounded-none border-b-2 border-transparent data-[state=active]:border-[#1967d2]"
            >
              Script
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="execution"
          className="flex-1 flex flex-col min-h-0 mt-0 p-0 border-0 bg-transparent"
        >
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
        </TabsContent>

        <TabsContent
          value="script"
          className="flex-1 overflow-auto min-h-0 mt-0 p-0 border-0 bg-[#1e1e1e]"
        >
          {log.script ? (
            <SyntaxHighlighter
              language="javascript"
              code={log.script}
              components={{
                Pre: (props) => (
                  <pre
                    {...props}
                    className="m-0 p-4 text-[11px] font-mono leading-relaxed"
                  />
                ),
                Code: (props) => (
                  <code {...props} className="font-mono bg-transparent" />
                ),
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-[#9aa0a6] text-xs italic p-4 text-center">
              Source code not available for this tool.
              <br />
              (Only accessible for User Defined Tools)
            </div>
          )}
        </TabsContent>
      </Tabs>
    );
  };

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
        highlightedItemId={highlightedLogId}
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

      <RunToolPanel
        open={!!selectedToolToRun}
        onOpenChange={(open) => {
          if (!open) setSelectedToolToRun(null);
        }}
        tool={selectedToolToRun}
        onRun={handleRunTool}
      />
    </div>
  );
};

export default EventLogger;
