/**
 * External dependencies
 */
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useMcpClient } from '@mcp-b/react-webmcp';
import {
  Table,
  TableProvider,
  ToolDetail,
  ActionButton,
  Toaster,
  type TableColumn,
  type TableData,
  type InfoType,
  type TableRow,
  getToolNameWithoutPrefix,
  type WebMCPTool,
} from '@google-awlt/design-system';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { noop } from '@google-awlt/common';

/**
 * Internal Dependencies
 */
import RunToolPanel from './runToolPanel';
import { useSettings } from '../../../stateProviders';
import { TABLE_SEARCH_KEYS, ALL_TOOLS_FILTERS } from '../../constants';
import { useToolExecution } from '../../hooks/useToolExecution';
import { useEventLogs } from '../../providers';
import useToolCategoryMapping from '../../hooks/useToolCategoryMapping';
import { TOOL_CATEGORIES } from '../../constants';
import { getToolCategory } from '../../../../utils';
import { RefreshCcw } from 'lucide-react';

interface AllToolsRowData extends TableData, Tool {
  originalData: Tool;
}

export const Tools = ({
  setSelectedMenuItem,
}: {
  setSelectedMenuItem: (view: string) => void;
}) => {
  const { client, tools: availableTools } = useMcpClient();
  const toolCategoryMapping = useToolCategoryMapping(availableTools);
  const { theme } = useSettings(({ state }) => ({ theme: state.theme }));
  const { setLastRunToolName, setSelectedKey, selectedKey, setIsToolRunning } =
    useEventLogs(({ actions, state }) => ({
      setLastRunToolName: actions.setLastRunToolName,
      setSelectedKey: actions.setSelectedKey,
      selectedKey: state.selectedKey,
      setIsToolRunning: actions.setIsToolRunning,
    }));
  const [selectedPanel, setSelectedPanel] = useState<string | null>(null);

  const onToolSuccess = (toolName: string) => {
    const isMcpbTool =
      getToolCategory(toolName, null, null) === TOOL_CATEGORIES.MCP_B;

    if (!isMcpbTool) {
      setLastRunToolName(toolName);
      setSelectedMenuItem('inspector');
    }
  };

  const [allToolsData, setAllToolsData] = useState<TableData[]>([]);
  const tabId = chrome.devtools?.inspectedWindow?.tabId;

  const {
    isRunToolPanelOpen,
    selectedToolToRun,
    openRunToolPanel,
    closeRunToolPanel,
    handleRunTool,
  } = useToolExecution(setIsToolRunning, onToolSuccess);

  useEffect(() => {
    if (availableTools) {
      const tools = availableTools
        .filter((tool) => tool.name !== 'dummyTool')
        .map((tool) => {
          const category = toolCategoryMapping[tool.name] || '';
          return {
            name: getToolNameWithoutPrefix(tool.name),
            type: category === TOOL_CATEGORIES.MCP_SERVER ? 'MCP' : 'WebMCP',
            category,
            originalData: tool,
            inputSchema: tool.inputSchema,
            description: tool.description,
          };
        });

      setAllToolsData(tools);
    }
  }, [availableTools, tabId, toolCategoryMapping]);

  const allToolsColumns: TableColumn[] = useMemo(
    () => [
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
        header: 'Type',
        accessorKey: 'type',
        cell: (info: InfoType) => info,
        enableHiding: false,
      },
      {
        header: 'Category',
        accessorKey: 'category',
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
    ],
    [openRunToolPanel]
  );

  const getStoredUserTool = useCallback(async (tool: Tool) => {
    const storage = await chrome.storage.local.get('userWebMCPTools');
    const userStoredTools = (storage.userWebMCPTools ||
      []) as Array<WebMCPTool>;

    const found = userStoredTools.find((t) => t.name === tool.name);
    return found || null;
  }, []);

  const renderDetailPanel = useCallback(
    (row: TableRow) => {
      let data = row.originalData;

      if (data.originalData) {
        data = data.originalData;
      }

      const onScriptChange = async (newCode: string) => {
        chrome.runtime.sendMessage({
          method: 'updateScript',
          jsonrpc: '2.0',
          payload: {
            newCode,
            toolName: data.name,
            tabId: chrome.devtools.inspectedWindow.tabId,
          },
        });
      };

      return (
        <ToolDetail
          tool={data as Tool}
          getUserTool={getStoredUserTool}
          onScriptChange={onScriptChange}
          tabId={chrome.devtools.inspectedWindow.tabId}
          selectedPanel={selectedPanel}
          setSelectedPanel={setSelectedPanel}
        />
      );
    },
    [getStoredUserTool, selectedPanel, setSelectedPanel]
  );

  const reloadTools = useCallback(async () => {
    await client.listTools();
  }, [client]);

  const extraInterfaceToTopBar = useCallback(() => {
    return (
      <button onClick={reloadTools} title="Reload tools">
        <RefreshCcw width={15} height={15} color="#404040" />
      </button>
    );
  }, [reloadTools]);

  return (
    <TableProvider
      data={allToolsData}
      tableColumns={allToolsColumns}
      tableFilterData={ALL_TOOLS_FILTERS}
      tableSearchKeys={TABLE_SEARCH_KEYS}
      tablePersistentSettingsKey="toolsTable"
      onRowContextMenu={noop}
      onRowClick={(row: TableData) => {
        if (row?.name) {
          setSelectedKey(row?.name);
        }
      }}
      getRowObjectKey={(row: any) => {
        const data = row.original || row;
        return (data?.originalData?.name as string) || (data?.name as string);
      }}
    >
      <Toaster
        position="top-center"
        theme={theme === 'auto' ? 'system' : theme}
        toastOptions={{
          duration: 2000,
        }}
      />
      <Table
        extraInterfaceToTopBar={extraInterfaceToTopBar}
        selectedKey={selectedKey}
        isFiltersSidebarOpen={true}
        renderDetailPanel={renderDetailPanel}
      />
      <RunToolPanel
        isOpen={isRunToolPanelOpen}
        onClose={closeRunToolPanel}
        tool={selectedToolToRun}
        onRun={handleRunTool}
        afterRunTool={(tool) => onToolSuccess(tool?.name || '')}
        activeTabId={tabId}
      />
    </TableProvider>
  );
};
