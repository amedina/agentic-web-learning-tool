/**
 * External dependencies.
 */
import { useState, useEffect } from 'react';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  toast,
  RunToolPanel as RunToolPanelView,
} from '@google-awlt/design-system';

interface RunToolPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tool: Tool | null;
  onRun: (toolName: string, args: any) => Promise<void>;
  afterRunTool: (tool: Tool | null) => void;
}

const RunToolPanel = ({
  isOpen,
  onClose,
  tool,
  onRun,
  afterRunTool,
}: RunToolPanelProps) => {
  const [args, setArgs] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);
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
    setIsRunning(true);

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
      onClose();
    } catch (error) {
      console.error('Failed to run tool:', error);
      setValidationError(
        error instanceof Error ? error.message : 'Invalid arguments'
      );
      toast.error('Failed to run tool');
    } finally {
      setIsRunning(false);
      afterRunTool(tool);
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
      isRunning={isRunning}
      validationError={validationError}
    />
  );
};

export default RunToolPanel;
