/**
 * External dependencies.
 */
import { useState, useEffect } from 'react';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { RunToolPanel as RunToolPanelView } from '@google-awlt/design-system';

/**
 * Internal dependencies.
 */
import { useEventLogs } from './eventLogsProvider';

interface RunToolPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tool: Tool | null;
  onRun: (toolName: string, args: any) => Promise<void>;
  afterRunTool: (tool: Tool | null) => void;
  activeTabId?: number;
}

const RunToolPanel = ({
  isOpen,
  onClose,
  tool,
  onRun,
  afterRunTool,
  activeTabId,
}: RunToolPanelProps) => {
  const { state, actions } = useEventLogs();
  const [args, setArgs] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setArgs({});
      setValidationError(null);
    }
  }, [isOpen, tool]);

  const inputSchema = tool?.inputSchema as {
    properties?: Record<string, any>;
    required?: string[];
    type?: string;
  };
  const properties = inputSchema?.properties || {};

  const handleRun = async () => {
    if (!tool) {
      return;
    }

    setValidationError(null);
    actions.setIsToolRunning(true);

    try {
      const parsedArgs: Record<string, any> = {};

      for (const [key, value] of Object.entries(args)) {
        if (value === '') {
          continue;
        }

        const propType = properties[key]?.type;

        if (propType === 'number' || propType === 'integer') {
          parsedArgs[key] = Number(value);
        } else if (propType === 'boolean') {
          parsedArgs[key] = value === 'true';
        } else if (propType === 'object' || propType === 'array') {
          try {
            parsedArgs[key] = JSON.parse(value);
          } catch (e) {
            throw new Error(`Invalid JSON for field ${key}`);
          }
        } else {
          parsedArgs[key] = value;
        }
      }

      await onRun(tool.name, parsedArgs);
    } catch (error) {
      console.error('Failed to run tool:', error);
      setValidationError(
        error instanceof Error ? error.message : 'Invalid arguments'
      );
    } finally {
      setTimeout(() => {
        onClose();
        actions.setIsToolRunning(false);
        afterRunTool(tool);
      }, 1000);
    }
  };

  const handleArgsChange = (key: string, value: string) => {
    setArgs((prev) => ({ ...prev, [key]: value }));
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <RunToolPanelView
      open={isOpen}
      onOpenChange={handleOpenChange}
      tool={tool as any}
      args={args}
      onArgsChange={handleArgsChange}
      onRun={handleRun}
      isRunning={state.isToolRunning}
      validationError={validationError}
      activeTabId={activeTabId}
    />
  );
};

export default RunToolPanel;
