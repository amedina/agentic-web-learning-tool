/**
 * External dependencies.
 */
import React, { useState, useEffect } from 'react';
import {
  toast,
  RunToolPanel as RunToolPanelUI,
} from '@google-awlt/design-system';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

interface RunToolPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: Tool | null;
  onRun: (toolName: string, args: any) => Promise<void>;
}

export const RunToolPanel: React.FC<RunToolPanelProps> = ({
  open,
  onOpenChange,
  tool,
  onRun,
}) => {
  const [args, setArgs] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setArgs({});
      setValidationError(null);
    }
  }, [open]);

  if (!tool) return null;

  const inputSchema = tool.inputSchema as {
    properties?: Record<string, any>;
    required?: string[];
    type?: string;
  };
  const properties = inputSchema?.properties || {};

  const handleRun = async () => {
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
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to run tool:', error);
      setValidationError(
        error instanceof Error ? error.message : 'Invalid arguments'
      );
      toast.error('Failed to run tool');
    } finally {
      setIsRunning(false);
    }
  };

  const handleArgsChange = (key: string, value: string) => {
    setArgs((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <RunToolPanelUI
      open={open}
      onOpenChange={onOpenChange}
      tool={tool as any}
      args={args}
      onArgsChange={handleArgsChange}
      onRun={() => {
        void handleRun();
      }}
      isRunning={isRunning}
      validationError={validationError}
    />
  );
};
