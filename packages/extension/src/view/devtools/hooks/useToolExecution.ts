/**
 * External dependencies
 */
import { useState, useCallback } from 'react';
import { useMcpClient } from '@mcp-b/mcp-react-hooks';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { toast } from '@google-awlt/design-system';

/**
 * Internal dependencies.
 */
import { getToolCategory } from '../../../utils';
import { TOOL_CATEGORIES } from '../../../view/devtools/constants';

export const useToolExecution = (
  setIsToolRunning: (isToolRunning: boolean) => void,
  onToolSuccess?: (toolName: string) => void
) => {
  const { client } = useMcpClient();
  const [isRunToolPanelOpen, setIsRunToolPanelOpen] = useState(false);
  const [selectedToolToRun, setSelectedToolToRun] = useState<Tool | null>(null);

  const openRunToolPanel = useCallback(
    (tool: Tool) => {
      setSelectedToolToRun(tool);
      setIsRunToolPanelOpen(true);
    },
    [setSelectedToolToRun, setIsRunToolPanelOpen]
  );

  const closeRunToolPanel = useCallback(() => {
    setIsRunToolPanelOpen(false);
    setSelectedToolToRun(null);
  }, [setIsRunToolPanelOpen, setSelectedToolToRun]);

  const handleRunTool = useCallback(
    async (toolName: string, args: any) => {
      if (!client) {
        return;
      }

      try {
        await client
          .callTool({
            name: toolName,
            arguments: args,
          })
          .then((result) => {
            const toolCategory = getToolCategory(toolName, null, null);
            const _isMcpb = toolCategory === TOOL_CATEGORIES.MCP_B;

            console.log(result);

            if (_isMcpb) {
              closeRunToolPanel();
              setIsToolRunning(false);
            }

            if (onToolSuccess) {
              onToolSuccess(toolName);
              setIsToolRunning(false);
            }

            toast.success('Tool execution completed');
          })
          .catch((error) => {
            toast.error(
              error instanceof Error ? error.message : 'Tool execution failed'
            );
            setIsToolRunning(false);
          });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Tool execution failed'
        );
        setIsToolRunning(false);
      }
    },
    [client, closeRunToolPanel, onToolSuccess, setIsToolRunning]
  );

  return {
    isRunToolPanelOpen,
    selectedToolToRun,
    openRunToolPanel,
    closeRunToolPanel,
    handleRunTool,
  };
};
