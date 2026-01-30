import { useState, useCallback, useEffect } from 'react';
import { useMcpClient } from '@mcp-b/mcp-react-hooks';
import {
  Table,
  TableProvider,
  ToolDetail,
  LogDetail,
  ActionButton,
  Toaster,
  toast,
  type TableColumn,
  type TableData,
  type InfoType,
  type TableRow,
  type UserStoredTool,
} from '@google-awlt/design-system';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { noop } from '@google-awlt/common';

/**
 * Internal Dependencies
 */
import RunToolPanel from './runToolPanel';
import { MESSAGE_TYPES } from '../../../../utils';
import type { ToolExecutionLog } from './types';
import { isLocalTool, getRowKey } from './utils';
import { useSettings } from '../../../stateProviders';
import {
  TABLE_SEARCH_KEYS,
  ALL_TOOLS_FILTERS,
  EVENT_LOGGER_FILTERS,
  EVENT_LOGGER_COLUMNS,
} from './constants';

interface AllToolsRowData extends TableData, Tool {
  originalData: Tool;
}

export const EventLogger = () => {
  const { tools: availableTools, client } = useMcpClient();
  const { theme } = useSettings(({ state }) => ({ theme: state.theme }));

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [showAllTools, setShowAllTools] = useState(true);
  const [allToolsData, setAllToolsData] = useState<TableData[]>([]);
  const [isRunToolPanelOpen, setIsRunToolPanelOpen] = useState(false);
  const [selectedToolToRun, setSelectedToolToRun] = useState<Tool | null>(null);
  const [lastRunToolName, setLastRunToolName] = useState<string | null>(null);
  const [eventLoggerData, setEventLoggerData] = useState<TableData[]>([]);

  const tabId = chrome.devtools?.inspectedWindow?.tabId;

  // Removed useMemo for eventLoggerData

  useEffect(() => {
    if (availableTools) {
      const tools = availableTools
        .filter((tool) => isLocalTool(tool.name, tabId))
        .map((tool) => ({
          name: tool.name,
          type: 'MCP',
          originalData: tool,
          inputSchema: tool.inputSchema,
          description: tool.description,
        }));

      setAllToolsData(tools);
    }
  }, [availableTools, tabId]);

  useEffect(() => {
    // console.log('eventLoggerData useEffect', eventLoggerData);
  }, [eventLoggerData]);

  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === MESSAGE_TYPES.TOOL_LOG) {
        setEventLoggerData((prevData) => {
          const newLog = message.payload as ToolExecutionLog;

          // Filter out if not local tool
          if (!isLocalTool(newLog.toolName, tabId)) {
            return prevData;
          }

          const existingIndex = prevData.findIndex(
            (item) => item.originalData.id === newLog.id
          );

          const mappedLog: TableData = {
            name: newLog.toolName,
            time: new Date(newLog.startTime).toLocaleTimeString(),
            type: newLog.type,
            status: newLog.status,
            duration: newLog.duration ? `${newLog.duration}ms` : '-',
            originalData: newLog,
            description: newLog.result ? 'Success' : newLog.error || 'Pending',
          };

          if (existingIndex !== -1) {
            const updatedData = [...prevData];
            updatedData[existingIndex] = {
              ...updatedData[existingIndex],
              ...mappedLog,
            };
            return updatedData;
          } else {
            return [mappedLog, ...prevData];
          }
        });

        const newLog = message.payload as ToolExecutionLog;
        if (newLog.toolName === lastRunToolName) {
          setLastRunToolName(null);
          const key = getRowKey(
            newLog.toolName,
            new Date(newLog.startTime).toLocaleTimeString()
          );
          setSelectedKey(key);
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [lastRunToolName]);

  const handleRunTool = async (toolName: string, args: any) => {
    if (!client) {
      return;
    }

    setLastRunToolName(toolName);

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Tool execution timed out after 30s'));
          toast.error('Tool execution timed out after 30s');
        }, 30000);
      });

      await Promise.race([
        client.callTool({
          name: toolName,
          arguments: args,
        }),
        timeoutPromise,
      ]);

      toast.success('Tool execution completed');
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
    setIsRunToolPanelOpen(true);
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
      cell: (_info: InfoType, details: TableData) => (
        <ActionButton
          onRunTool={(tool) => openRunToolPanel(tool.originalData || tool)}
          details={details as AllToolsRowData}
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

  const getStoredUserTool = useCallback(async (tool: Tool) => {
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
        data = data.originalData;
      }

      if ('inputSchema' in data) {
        return (
          <ToolDetail tool={data as Tool} getUserTool={getStoredUserTool} />
        );
      }

      return <LogDetail log={data as any} />;
    },
    [getStoredUserTool]
  );

  const afterRunTool = useCallback(
    (tool: Tool | null) => {
      if (!tool) {
        return;
      }

      let toolName = tool.name;

      if (tabId && toolName.startsWith(`wt_tab${tabId}_`)) {
        toolName = toolName.replace(`wt_tab${tabId}_`, '');
      }

      setShowAllTools(false);
    },
    [tabId]
  );

  return (
    <TableProvider
      data={showAllTools ? allToolsData : eventLoggerData}
      tableColumns={showAllTools ? allToolsColumns : EVENT_LOGGER_COLUMNS}
      tableFilterData={showAllTools ? ALL_TOOLS_FILTERS : EVENT_LOGGER_FILTERS}
      tableSearchKeys={TABLE_SEARCH_KEYS}
      onRowClick={(row: TableData) => {
        if (showAllTools) {
          setSelectedKey(row?.name ?? null);
        } else {
          const rowKey = getRowKey(row?.name, row?.time);
          console.log('onRowClick selectedKey:', rowKey);
          setSelectedKey(rowKey);
        }
      }}
      onRowContextMenu={noop}
      getRowObjectKey={(row: any) => {
        const data = row.original || row;

        let rowKey =
          (data?.originalData?.name as string) || (data?.name as string);

        if (!showAllTools) {
          const name = data?.name as string;
          const time = data?.time as string;
          rowKey = getRowKey(name, time);
          console.log(
            'getRowObjectKey calculated key:',
            rowKey,
            'for row:',
            name,
            time
          );
        }

        return rowKey;
      }}
    >
      <Toaster
        position="top-center"
        theme={theme === 'auto' ? 'system' : theme}
        toastOptions={{
          duration: 1000,
        }}
      />
      <Table
        selectedKey={selectedKey}
        isFiltersSidebarOpen={true}
        extraInterfaceToTopBar={extraInterfaceToTopBar}
        renderDetailPanel={renderDetailPanel}
      />
      <RunToolPanel
        isOpen={isRunToolPanelOpen}
        onClose={() => {
          setIsRunToolPanelOpen(false);
          setSelectedToolToRun(null);
        }}
        tool={selectedToolToRun}
        onRun={handleRunTool}
        afterRunTool={afterRunTool}
      />
    </TableProvider>
  );
};
