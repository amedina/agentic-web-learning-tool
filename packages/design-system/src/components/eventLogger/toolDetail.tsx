/**
 * External dependencies.
 */
import { useEffect, useState } from 'react';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
/**
 * Internal dependencies.
 */
import { SyntaxHighlighterJSON } from '../syntaxHighlighter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs';
import { CodeEditor } from '../codeEditor';
import type { WebMCPTool } from '../types';

interface ToolDetailProps {
  tool: Tool;
  getUserTool: (tool: Tool) => Promise<WebMCPTool | null>;
  onScriptChange?: (newCode: string) => Promise<void>;
  enableBreakpoints?: boolean;
  tabId: number;
}

const TAB_TRIGGER_CLASS =
  'text-[11px] px-2 py-1 data-[state=active]:bg-muted data-[state=active]:text-sidebar-accent-foreground rounded-none border-b-2 border-transparent data-[state=active]:border-muted-stone';

export function ToolDetail({
  tool,
  getUserTool,
  onScriptChange,
  tabId,
}: ToolDetailProps) {
  const [userTool, setUserTool] = useState<WebMCPTool | null>(null);
  const [script, setNewScript] = useState('');

  useEffect(() => {
    (async () => {
      if (!tool) {
        return;
      }
      const userTool = await getUserTool(tool);
      setUserTool(userTool);

      let scriptToUse = '';

      if (userTool) {
        if (
          userTool?.editedScript?.code &&
          userTool.editedScript.tabId.includes(tabId)
        ) {
          scriptToUse = userTool.editedScript.code;
        } else {
          scriptToUse = userTool.code as string;
        }
      }

      setNewScript(scriptToUse);
    })();
  }, [tool, getUserTool, tabId]);

  return (
    <Tabs defaultValue="execution" className="flex flex-col h-full">
      <div className="px-2 pt-2 border-b">
        <TabsList className="h-7 p-0 bg-transparent">
          <TabsTrigger value="execution" className={TAB_TRIGGER_CLASS}>
            DESCRIPTION
          </TabsTrigger>
          <TabsTrigger value="script" className={TAB_TRIGGER_CLASS}>
            Script
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent
        value="execution"
        className="min-h-0 mt-0 p-0 border-0 bg-transparent"
      >
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
      </TabsContent>
      <TabsContent
        value="script"
        className="min-h-0 mt-1 ml-1 p-0 border-0 bg-transparent h-full"
      >
        {userTool ? (
          <CodeEditor
            code={script}
            onChange={(value) => {
              setNewScript(value);
              onScriptChange?.(value);
            }}
            styles={{
              fontSize: '11px',
              lineHeight: '1.2',
              marginLeft: `calc(2.25rem - 11px)`,
              fontWeight: 300,
            }}
            enableBreakpoints={true}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-xs italic p-4 text-center min-h-[200px]">
            Source code not available for this tool.
            <br />
            (Only accessible for user defined tools)
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
