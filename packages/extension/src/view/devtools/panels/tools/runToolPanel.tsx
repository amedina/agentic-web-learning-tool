/**
 * External dependencies.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { RunToolPanel as RunToolPanelView } from '@google-awlt/design-system';

/**
 * Internal dependencies.
 */
import { useEventLogs } from '../../providers';

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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [prevToolName, setPrevToolName] = useState<string | null>(null);

  useEffect(() => {
    // Reset args when tool changes
    if (tool?.name !== prevToolName) {
      setArgs({});
      setValidationError(null);
      setPrevToolName(tool?.name || null);
    }
  }, [tool]);

  const inputSchema = tool?.inputSchema as {
    properties?: Record<string, any>;
    required?: string[];
    type?: string;
  };
  const properties = inputSchema?.properties || {};

  const handleRun = useCallback(async () => {
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
      timeoutRef.current = setTimeout(() => {
        onClose();
        actions.setIsToolRunning(false);
        afterRunTool(tool);
      }, 1000);
    }
  }, [setValidationError, actions, onClose, afterRunTool, onRun, args, tool]);

  const handleArgsChange = useCallback(
    (key: string, value: string) => {
      setArgs((prev) => ({ ...prev, [key]: value }));
    },
    [setArgs]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
      }
    },
    [onClose]
  );

  const onCancel = useCallback(() => {
    onClose();
    actions.setIsToolRunning(false);
    setArgs({});
    setValidationError(null);
    setPrevToolName(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [onClose]);

  return (
    <RunToolPanelView
      open={isOpen}
      onOpenChange={handleOpenChange}
      onCancel={onCancel}
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
