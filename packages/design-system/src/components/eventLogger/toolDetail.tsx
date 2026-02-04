/**
 * External dependencies.
 */
import { useEffect, useState } from 'react';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Internal dependencies.
 */
import type { UserStoredTool } from './types';
import {
  SyntaxHighlighterJSON,
  SyntaxHighlighterWhite,
} from '../syntaxHighlighter';

interface ToolDetailProps {
  tool: Tool;
  getUserTool: (tool: Tool) => Promise<UserStoredTool | null>;
}

export function ToolDetail({ tool, getUserTool }: ToolDetailProps) {
  const [userTool, setUserTool] = useState<UserStoredTool | null>(null);

  useEffect(() => {
    (async () => {
      const userTool = await getUserTool(tool);
      setUserTool(userTool);
    })();
  }, [tool, getUserTool]);

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
        <SyntaxHighlighterJSON json={tool.inputSchema} />
      </div>
      {userTool && (
        <div className="p-2 border-b border-[#f1f3f4]">
          <div className="text-[10px] font-bold text-[#5f6368] mb-1">
            SCRIPT
          </div>
          <div>
            <SyntaxHighlighterWhite
              language="javascript"
              code={userTool.code as string}
              components={{
                Pre: (props: any) => <pre {...props} />,
                Code: (props: any) => (
                  <code {...props} style={{ fontFamily: 'inherit' }} />
                ),
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
