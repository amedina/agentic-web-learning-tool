/**
 * External dependencies.
 */
import React, { type ChangeEvent } from 'react';

/**
 * Internal dependencies.
 */
import { Button } from '../button';
import Input from '../input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '../sheet';

export interface RunToolPanelTool {
  name: string;
  description?: string;
  inputSchema: {
    properties?: Record<string, any>;
    required?: string[];
    type?: string;
    [key: string]: any;
  };
}

export interface RunToolPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: RunToolPanelTool | null;
  args: Record<string, string>;
  onArgsChange: (key: string, value: string) => void;
  onRun: () => void;
  isRunning: boolean;
  validationError: string | null;
}

export const RunToolPanel: React.FC<RunToolPanelProps> = ({
  open,
  onOpenChange,
  tool,
  args,
  onArgsChange,
  onRun,
  isRunning,
  validationError,
}) => {
  if (!tool) return null;

  const properties = tool.inputSchema?.properties || {};
  const requiredFields = tool.inputSchema?.required || [];

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
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    onArgsChange(key, e.target.value)
                  }
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
          <Button onClick={onRun} disabled={isRunning}>
            {isRunning ? 'Running...' : 'Run Tool'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
