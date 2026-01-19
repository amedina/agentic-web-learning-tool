/**
 * External dependencies.
 */
import React, { useState, useEffect } from 'react';
import {
  Button,
  Input,
  toast,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
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
  const requiredFields = inputSchema?.required || [];

  const handleRun = async () => {
    setValidationError(null);
    setIsRunning(true);

    try {
      // Construct args object with correct types
      const parsedArgs: Record<string, any> = {};

      for (const [key, value] of Object.entries(args)) {
        if (value === '') continue; // Skip empty strings

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

  const handleInputChange = (key: string, value: string) => {
    setArgs((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[400px] sm:w-[540px] flex flex-col h-full"
      >
        <SheetHeader>
          <SheetTitle className="break-all text-left">
            Run Tool: {tool.name}
          </SheetTitle>
          <SheetDescription className="text-left">
            {tool.description || 'Enter arguments to run this tool.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 py-6 flex-1 overflow-y-auto">
          {Object.entries(properties).length > 0 ? (
            Object.entries(properties).map(([key, schema]: [string, any]) => (
              <div key={key} className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  {key}
                  {requiredFields.includes(key) && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                <Input
                  value={args[key] || ''}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  placeholder={schema.description || `Enter ${key}`}
                  className="w-full"
                />
                {schema.description && (
                  <p className="text-xs text-gray-500">{schema.description}</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 italic">
              No arguments required.
            </p>
          )}

          {validationError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {validationError}
            </div>
          )}
        </div>

        <SheetFooter className="mt-auto pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleRun} disabled={isRunning}>
            {isRunning ? 'Running...' : 'Run Tool'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
