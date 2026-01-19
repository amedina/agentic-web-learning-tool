/**
 * External dependencies.
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

interface ToolDetailProps {
  tool: Tool;
}

export function ToolDetail({ tool }: ToolDetailProps) {
  return (
    <>
      <div className="p-2 border-b border-[#f1f3f4]">
        <div className="text-[10px] font-bold text-[#5f6368] mb-1">
          DESCRIPTION
        </div>
        <div className="text-[#202124] select-text text-xs">
          {tool.description || 'No description provided.'}
        </div>
      </div>
      <div className="flex-1 p-2 bg-white max-h-full overflow-auto">
        <div className="text-[10px] font-bold text-[#5f6368] mb-1">
          INPUT SCHEMA
        </div>
        <pre className="font-mono text-[11px] text-[#db4437] whitespace-pre-wrap break-all select-text bg-[#f8f9fa] p-2 rounded border border-[#f1f3f4]">
          {JSON.stringify(tool.inputSchema, null, 2)}
        </pre>
      </div>
    </>
  );
}
