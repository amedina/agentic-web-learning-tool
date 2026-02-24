/**
 * External dependencies.
 */
import { useEffect, useState } from 'react';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  coldarkDark,
  coldarkCold,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
/**
 * Internal dependencies.
 */
import type { UserStoredTool } from './types';
import {
  SyntaxHighlighterJSON,
  SyntaxHighlighterWrapper,
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

  const isDarkMode = document.documentElement.classList.contains('dark');
  const activeStyle = isDarkMode ? coldarkDark : coldarkCold;
  const backgroundColor = isDarkMode ? '#282a36' : 'white';

  return (
    <>
      <div className="p-2 py-4 border-b">
        <div className="text-xs font-bold mb-1">DESCRIPTION</div>
        <div className="select-text text-xs">
          {tool.description || 'No description provided.'}
        </div>
      </div>
      <div className="flex-1 p-2 py-4 bg-background max-h-full overflow-auto border-b">
        <div className="text-xs font-bold mb-1">INPUT SCHEMA</div>
        <SyntaxHighlighterJSON json={tool.inputSchema} />
      </div>
      {userTool && (
        <div className="p-2 py-4 border-b">
          <div className="text-xs font-bold mb-1">SCRIPT</div>
          <div>
            <SyntaxHighlighterWrapper
              language="javascript"
              style={activeStyle}
              background={backgroundColor}
              code={userTool.code as string}
              isDarkMode={isDarkMode}
              showLineNumbers={true}
              preTag={(props: any) => (
                <pre
                  {...props}
                  style={{ fontSize: '11px', lineHeight: '1.3' }}
                />
              )}
              codeTag={(props: any) => (
                <code {...props} style={{ fontFamily: 'inherit' }} />
              )}
            />
          </div>
        </div>
      )}
    </>
  );
}
