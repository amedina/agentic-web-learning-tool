/**
 * External dependencies
 */
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useMcpClient } from '@mcp-b/mcp-react-hooks';
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
  type UserStoredTool,
  getToolNameWithoutPrefix,
} from '@google-awlt/design-system';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { noop } from '@google-awlt/common';

/**
 * Internal Dependencies
 */
import RunToolPanel from './runToolPanel';
import { isLocalTool } from './utils';
import { useSettings } from '../../../stateProviders';
import { TABLE_SEARCH_KEYS, ALL_TOOLS_FILTERS } from './constants';
import { useToolExecution } from './hooks/useToolExecution';
import { useEventLogs } from './eventLogsProvider';

interface AllToolsRowData extends TableData, Tool {
  originalData: Tool;
}

export const WebMCPTools = ({
  setSelectedMenuItem,
}: {
  setSelectedMenuItem: (view: string) => void;
}) => {
  const { tools: availableTools } = useMcpClient();
  const { theme } = useSettings(({ state }) => ({ theme: state.theme }));
  const { setLastRunToolName, setSelectedKey, selectedKey } = useEventLogs(
    ({ actions, state }) => ({
      setLastRunToolName: actions.setLastRunToolName,
      setSelectedKey: actions.setSelectedKey,
      selectedKey: state.selectedKey,
    })
  );

  const onToolSuccess = (toolName: string) => {
    setLastRunToolName(toolName);
    setSelectedMenuItem('inspector');
  };

  const [allToolsData, setAllToolsData] = useState<TableData[]>([]);
  const tabId = chrome.devtools?.inspectedWindow?.tabId;

  const {
    isRunToolPanelOpen,
    selectedToolToRun,
    openRunToolPanel,
    closeRunToolPanel,
    handleRunTool,
  } = useToolExecution(onToolSuccess);

  useEffect(() => {
    if (availableTools) {
      const tools = availableTools
        .filter((tool) => isLocalTool(tool.name, tabId))
        .map((tool) => ({
          name: getToolNameWithoutPrefix(tool.name),
          type: 'MCP',
          originalData: tool,
          inputSchema: tool.inputSchema,
          description: tool.description,
        }));

      setAllToolsData(tools);
    }
  }, [availableTools, tabId]);

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

      return <ToolDetail tool={data as Tool} getUserTool={getStoredUserTool} />;
    },
    [getStoredUserTool]
  );

  return (
    <TableProvider
      data={allToolsData}
      tableColumns={allToolsColumns}
      tableFilterData={ALL_TOOLS_FILTERS}
      tableSearchKeys={TABLE_SEARCH_KEYS}
      onRowContextMenu={noop}
      onRowClick={(row: TableData) => {
        setSelectedKey(row?.name ?? null);
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
          duration: 1000,
        }}
      />
      <Table
        selectedKey={selectedKey}
        isFiltersSidebarOpen={false}
        hideFiltering={true}
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
