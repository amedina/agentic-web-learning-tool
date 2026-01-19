/**
 * External dependencies.
 */
import { useState, useMemo, useEffect } from 'react';
import { useMcpClient } from '@mcp-b/mcp-react-hooks';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  EventLoggerTable,
  ToolDetail,
  LogDetail,
  toast,
} from '@google-awlt/design-system';

/**
 * Internal dependencies.
 */
import { MESSAGE_TYPES } from '../../../utils';
import { RunToolPanel } from './runToolPanel';
import { type ToolExecutionLog, getToolColumns, getLogColumns } from '../utils';

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
      setLastRunToolName(null);
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

  const toolColumns = useMemo(() => getToolColumns(setSelectedToolToRun), []);

  const logColumns = useMemo(() => getLogColumns(), []);

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
          showAvailableTools ? (
            <ToolDetail tool={item as Tool} />
          ) : (
            <LogDetail log={item as ToolExecutionLog} />
          )
        }
        keyExtractor={(item) =>
          showAvailableTools
            ? (item as Tool).name
            : (item as ToolExecutionLog).id
        }
        noItemsMessage={`No ${showAvailableTools ? 'tools' : 'logs'} found matching`}
        onRefresh={() => {
          if (!showAvailableTools) setLogs([]);
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
