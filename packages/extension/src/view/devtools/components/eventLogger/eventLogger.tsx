/**
 * External dependencies.
 */
import { useState, useCallback, useEffect } from 'react';
import { useMcpClient } from '@mcp-b/mcp-react-hooks';
import {
  Table,
  TableProvider,
  ToolDetail,
  LogDetail,
  ActionButton,
  type TableColumn,
  type TableData,
  type InfoType,
  type TableRow,
  type UserStoredTool,
} from '@google-awlt/design-system';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { toast } from '@google-awlt/design-system';

/**
 * Internal Dependencies
 */
import RunToolPanel from './runToolPanel';
import { MESSAGE_TYPES } from '../../../../utils';
import type { ToolExecutionLog } from './types';

const noop = () => {};

const TABLE_SEARCH_KEYS = ['name', 'type'];

const allToolsFilters = {
  type: {
    title: 'Type',
    hasStaticFilterValues: true,
    filterValues: {
      MCP: { selected: null },
      WebMCP: { selected: null },
    },
  },
};

const eventLoggerFilters = {
  type: {
    title: 'Type',
    hasStaticFilterValues: true,
    filterValues: {
      MCP: { selected: null },
      WebMCP: { selected: null },
    },
  },
  status: {
    title: 'Status',
    hasStaticFilterValues: true,
    filterValues: {
      success: { selected: null },
      error: { selected: null },
    },
  },
  duration: {
    title: 'Duration',
    hasStaticFilterValues: true,
    filterValues: {
      success: { selected: null },
      error: { selected: null },
    },
  },
};

const eventLoggerColumns: TableColumn[] = [
  {
    header: 'Name',
    accessorKey: 'name',
    cell: (info: InfoType) => info,
    enableHiding: false,
  },
  {
    header: 'Time',
    accessorKey: 'time',
    cell: (info: InfoType) => info,
    enableHiding: false,
  },
  {
    header: 'Type',
    accessorKey: 'type',
    cell: (info: InfoType) => info,
    enableHiding: false,
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: (info: InfoType) => info,
    enableHiding: false,
  },
  {
    header: 'Duration',
    accessorKey: 'duration',
    cell: (info: InfoType) => info,
    enableHiding: false,
  },
];

const EventLogger = () => {
  const { tools: availableTools, client } = useMcpClient();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [showAllTools, setShowAllTools] = useState(true);
  const [allToolsData, setAllToolsData] = useState<TableData[]>([]);
  const [isRunToolsSidePanelOpen, setIsRunToolsSidePanelOpen] = useState(false);
  const [selectedToolToRun, setSelectedToolToRun] = useState<Tool | null>(null);
  const [lastRunToolName, setLastRunToolName] = useState<string | null>(null);
  const [logs, setLogs] = useState<ToolExecutionLog[]>([]);
  const tabId = chrome.devtools?.inspectedWindow?.tabId;

  const isToolRelevant = useCallback(
    (toolName: string) => {
      // Show all tools if we can't determine the tab ID (e.g. running outside devtools)
      if (!tabId) return true;

      // MCP tools (not WebMCP) are global/server-side, so we show them.
      // WebMCP tools follow the naming convention: wt_tab<ID>_<name>
      // We want to hide WebMCP tools that belong to OTHER tabs.
      if (toolName.includes('wt_tab')) {
        return toolName.includes(`wt_tab${tabId}_`);
      }
      return true;
    },
    [tabId]
  );

  const eventLoggerData: TableData[] = logs
    .filter((log) => isToolRelevant(log.toolName))
    .map((log) => ({
      name: log.toolName,
      time: new Date(log.startTime).toLocaleTimeString(),
      type: log.type,
      status: log.status,
      duration: log.duration ? `${log.duration}ms` : '-',
      originalData: log,
      description: log.result ? 'Success' : log.error || 'Pending',
    }));

  useEffect(() => {
    if (availableTools) {
      const tools = availableTools
        .filter((tool) => isToolRelevant(tool.name))
        .map((tool) => ({
          name: tool.name,
          type: 'MCP', // Default to MCP for now as these are from useMcpClient
          originalData: tool,
          inputSchema: tool.inputSchema,
          description: tool.description,
        }));

      setAllToolsData(tools);
    }
  }, [availableTools, isToolRelevant]);

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
            if (newLog.toolName === lastRunToolName) {
              setLastRunToolName(null);
            }
            return [newLog, ...prevLogs];
          }
        });
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [lastRunToolName]);

  const handleRunTool = async (toolName: string, args: any) => {
    if (!client) return;

    setLastRunToolName(toolName);

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error('Tool execution timed out after 30s')),
          30000
        );
      });

      await Promise.race([
        client.callTool({
          name: toolName,
          arguments: args,
        }),
        timeoutPromise,
      ]);

      toast.success('Tool execution completed');
      setIsRunToolsSidePanelOpen(false);
    } catch (error) {
      console.error('Error running tool:', error);
      toast.error(
        error instanceof Error ? error.message : 'Tool execution failed'
      );
      throw error;
    }
  };

  const openRunToolPanel = (tool: Tool) => {
    setSelectedToolToRun(tool);
    setIsRunToolsSidePanelOpen(true);
  };

  const allToolsColumns: TableColumn[] = [
    {
      header: 'Name',
      accessorKey: 'name',
      cell: (info: InfoType) => info,
      enableHiding: false,
    },
    {
      header: 'Description',
      accessorKey: 'description',
      cell: (info: InfoType) => info,
      enableHiding: false,
    },
    {
      header: 'Action',
      accessorKey: 'action',
      cell: (_info: InfoType, details: any) => (
        <ActionButton
          onRunTool={(t: any) => openRunToolPanel(t.originalData || t)}
          t={details}
        />
      ),
    },
  ];
  const extraInterfaceToTopBar = useCallback(() => {
    return (
      <label className="flex items-center gap-2 w-[130px]">
        <input
          type="checkbox"
          checked={showAllTools}
          onChange={() => setShowAllTools(!showAllTools)}
        />
        <span className="text-xs select-none">Show all tools</span>
      </label>
    );
  }, [showAllTools]);

  const getUserTool = useCallback(async (tool: Tool) => {
    const storage = await chrome.storage.local.get('userWebMCPTools');
    const userStoredTools = (storage.userWebMCPTools ||
      []) as Array<UserStoredTool>;

    const found = userStoredTools.find((t) => t.name === tool.name);
    return found || null;
  }, []);

  const renderDetailPanel = useCallback(
    (row: TableRow) => {
      let data = row.originalData;

      if (data.originalData) {
        data = data.originalData; // Unwrap it to get the real log!
      }

      // Check if it's a Tool (has inputSchema)
      if ('inputSchema' in data) {
        return <ToolDetail tool={data as Tool} getUserTool={getUserTool} />;
      }

      // Otherwise assume it is a log
      return <LogDetail log={data as any} />;
    },
    [getUserTool]
  );

  return (
    <TableProvider
      data={showAllTools ? allToolsData : eventLoggerData}
      tableColumns={showAllTools ? allToolsColumns : eventLoggerColumns}
      tableFilterData={showAllTools ? allToolsFilters : eventLoggerFilters}
      tableSearchKeys={TABLE_SEARCH_KEYS}
      onRowClick={(row: TableData) => {
        setSelectedKey(row?.name ?? null);
      }}
      onRowContextMenu={noop}
      getRowObjectKey={(row: any) =>
        (row?.originalData?.name as string) || (row?.name as string)
      }
    >
      <Table
        selectedKey={selectedKey}
        isFiltersSidebarOpen={true}
        extraInterfaceToTopBar={extraInterfaceToTopBar}
        renderDetailPanel={renderDetailPanel}
      />
      <RunToolPanel
        isOpen={isRunToolsSidePanelOpen}
        onClose={() => {
          setIsRunToolsSidePanelOpen(false);
          setSelectedToolToRun(null);
        }}
        tool={selectedToolToRun}
        onRun={handleRunTool}
      />
    </TableProvider>
  );
};

export default EventLogger;
