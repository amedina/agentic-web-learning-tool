/**
 * External dependencies.
 */
import React, { type ChangeEvent } from 'react';

/**
 * Internal dependencies.
 */
import { Button } from '../button';

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
    <div
      className={`fixed inset-0 z-150 flex justify-end ${
        open ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* Backdrop - Fades in/out */}
      <div
        className={`fixed inset-0 bg-raisin-black/50 transition-opacity duration-300 ease-in-out ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Side Panel - Slides in/out */}
      <div
        className={`relative h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out border-l-1 border-gray-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center ">
            <h2 className="text-sm font-semibold text-color-gray">Run Tool</h2>
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
            >
              {/* SVG Close Icon */}
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          {tool && (
            <span
              className="text-xs text-gray-900 break-words block mt-2"
              title={tool.name}
            >
              {tool.name}
            </span>
          )}
        </div>

        {/* Content Area */}
        <div className="p-4 overflow-y-auto h-[calc(100%-110px)]">
          {!tool ? (
            <div className="text-gray-500 text-sm text-center mt-10">
              No tool selected
            </div>
          ) : (
            <div className="space-y-6">
              {properties && Object.entries(properties).length > 0 ? (
                Object.entries(properties).map(
                  ([key, schema]: [string, any]) => (
                    <div key={key} className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700">
                        {key}
                        {requiredFields.includes(key) && (
                          <span className="text-red-500 ml-0.5">*</span>
                        )}
                      </label>
                      {schema.type === 'boolean' ? (
                        <select
                          className="block w-full rounded-sm border-gray-300 border p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                          value={args[key] || ''}
                          onChange={(e) => onArgsChange(key, e.target.value)}
                        >
                          <option value="">Select...</option>
                          <option value="true">True</option>
                          <option value="false">False</option>
                        </select>
                      ) : schema.type === 'object' ||
                        schema.type === 'array' ? (
                        <textarea
                          className="block w-full rounded-sm border-gray-300 border p-2 text-sm focus:border-blue-500 focus:ring-blue-500 font-mono"
                          rows={3}
                          value={args[key] || ''}
                          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                            onArgsChange(key, e.target.value)
                          }
                          placeholder={
                            schema.type === 'object'
                              ? '{"key": "value"}'
                              : '[1, 2]'
                          }
                        />
                      ) : (
                        <input
                          type={schema.type === 'number' ? 'number' : 'text'}
                          className="block w-full rounded-sm border-gray-300 border p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                          value={args[key] || ''}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            onArgsChange(key, e.target.value)
                          }
                          placeholder={schema.description}
                        />
                      )}
                      {schema.description && (
                        <p className="text-[10px] text-gray-500">
                          {schema.description}
                        </p>
                      )}
                    </div>
                  )
                )
              ) : (
                <div className="text-sm text-center mt-10 h-full w-full flex items-center justify-center py-10">
                  This tool does not require any arguments.
                </div>
              )}

              {validationError && (
                <div className="p-2 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                  {validationError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with Action Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
          <Button
            onClick={onRun}
            disabled={isRunning || !tool}
            className="w-full"
            variant="run"
          >
            {isRunning ? 'Running...' : 'Run Tool'}
          </Button>
        </div>
      </div>
    </div>
  );
};
