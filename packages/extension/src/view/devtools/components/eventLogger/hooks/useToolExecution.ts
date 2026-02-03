/**
 * External dependencies
 */
import { useState, useRef } from 'react';
import { useMcpClient } from '@mcp-b/mcp-react-hooks';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { toast } from '@google-awlt/design-system';

export const useToolExecution = (
  onToolSuccess?: (toolName: string) => void
) => {
  const { client } = useMcpClient();
  const [isRunToolPanelOpen, setIsRunToolPanelOpen] = useState(false);
  const [selectedToolToRun, setSelectedToolToRun] = useState<Tool | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleRunTool = async (toolName: string, args: any) => {
    if (!client) {
      return;
    }

    try {
      const timeoutPromise = new Promise((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          reject(new Error('Tool execution timed out after 30s'));
          toast.error('Tool execution timed out after 30s');
        }, 30000);
      });

      const callToolPromise = new Promise((resolve, reject) => {
        client
          .callTool({
            name: toolName,
            arguments: args,
          })
          .then((result) => {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            resolve(result);
          })
          .catch((error) => {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }

            toast.error(
              error instanceof Error ? error.message : 'Tool execution failed'
            );

            reject(error);
          });
      });

      await Promise.race([callToolPromise, timeoutPromise]);

      toast.success('Tool execution completed');

      if (onToolSuccess) {
        onToolSuccess(toolName);
      }
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

  const closeRunToolPanel = () => {
    setIsRunToolPanelOpen(false);
    setSelectedToolToRun(null);
  };

  return {
    isRunToolPanelOpen,
    selectedToolToRun,
    openRunToolPanel,
    closeRunToolPanel,
    handleRunTool,
  };
};
