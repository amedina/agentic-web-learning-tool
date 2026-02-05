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
      <div className="p-2 py-4 border-b">
        <div className="text-xs font-bold mb-1">DESCRIPTION</div>
        <div className="select-text text-xs">
          {tool.description || 'No description provided.'}
        </div>
      </div>
      <div className="flex-1 p-2 py-4 bg-white max-h-full overflow-auto border-b">
        <div className="text-xs font-bold mb-1">INPUT SCHEMA</div>
        <SyntaxHighlighterJSON json={tool.inputSchema} />
      </div>
      {userTool && (
        <div className="p-2 py-4 border-b">
          <div className="text-xs font-bold mb-1">SCRIPT</div>
          <div>
            <SyntaxHighlighterWhite
              language="javascript"
              code={userTool.code as string}
              components={{
                Pre: (props: any) => (
                  <pre
                    {...props}
                    style={{ fontSize: '11px', lineHeight: '1.3' }}
                  />
                ),
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
