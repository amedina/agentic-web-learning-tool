/**
 * Internal dependencies.
 */
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs';
import { SyntaxHighlighter } from '../syntaxHighlighter';

export interface LogDetailProps {
  log: {
    type: string;
    args: any;
    status: 'pending' | 'success' | 'error';
    result?: any;
    error?: string;
    script?: string;
  };
}

export function LogDetail({ log }: LogDetailProps) {
  const showTabs = log.type === 'WebMCP' || !!log.script;

  if (!showTabs) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 p-2 border-b border-[#f1f3f4] overflow-auto min-h-0">
          <div className="text-[10px] font-bold text-[#5f6368] mb-1">
            ARGUMENTS
          </div>
          <pre className="font-mono text-[11px] text-[#202124] whitespace-pre-wrap break-all select-text bg-[#f8f9fa] p-2 rounded border border-[#f1f3f4]">
            {JSON.stringify(log.args, null, 2)}
          </pre>
        </div>
        <div className="flex-1 p-2 overflow-auto min-h-0">
          <div className="text-[10px] font-bold text-[#5f6368] mb-1">
            {log.status === 'error' ? 'ERROR' : 'OUTPUT'}
          </div>
          <pre
            className={`font-mono text-[11px] whitespace-pre-wrap break-all select-text bg-[#f8f9fa] p-2 rounded border border-[#f1f3f4] ${log.status === 'error' ? 'text-red-600' : 'text-[#188038]'}`}
          >
            {log.status === 'error'
              ? log.error
              : JSON.stringify(log.result, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="execution" className="flex flex-col h-full">
      <div className="px-2 pt-2 border-b border-[#f1f3f4]">
        <TabsList className="h-7 p-0 bg-transparent gap-2">
          <TabsTrigger
            value="execution"
            className="text-[11px] px-2 py-1 data-[state=active]:bg-[#e8f0fe] data-[state=active]:text-[#1967d2] rounded-none border-b-2 border-transparent data-[state=active]:border-[#1967d2]"
          >
            Execution
          </TabsTrigger>
          <TabsTrigger
            value="script"
            className="text-[11px] px-2 py-1 data-[state=active]:bg-[#e8f0fe] data-[state=active]:text-[#1967d2] rounded-none border-b-2 border-transparent data-[state=active]:border-[#1967d2]"
          >
            Script
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent
        value="execution"
        className="flex-1 flex flex-col min-h-0 mt-0 p-0 border-0 bg-transparent"
      >
        <div className="flex-1 p-2 border-b border-[#f1f3f4] overflow-auto min-h-0">
          <div className="text-[10px] font-bold text-[#5f6368] mb-1">
            ARGUMENTS
          </div>
          <pre className="font-mono text-[11px] text-[#202124] whitespace-pre-wrap break-all select-text bg-[#f8f9fa] p-2 rounded border border-[#f1f3f4]">
            {JSON.stringify(log.args, null, 2)}
          </pre>
        </div>
        <div className="flex-1 p-2 overflow-auto min-h-0">
          <div className="text-[10px] font-bold text-[#5f6368] mb-1">
            {log.status === 'error' ? 'ERROR' : 'OUTPUT'}
          </div>
          <pre
            className={`font-mono text-[11px] whitespace-pre-wrap break-all select-text bg-[#f8f9fa] p-2 rounded border border-[#f1f3f4] ${log.status === 'error' ? 'text-red-600' : 'text-[#188038]'}`}
          >
            {log.status === 'error'
              ? log.error
              : JSON.stringify(log.result, null, 2)}
          </pre>
        </div>
      </TabsContent>

      <TabsContent
        value="script"
        className="flex-1 overflow-auto min-h-0 mt-0 p-0 border-0 bg-[#1e1e1e]"
      >
        {log.script ? (
          <SyntaxHighlighter
            language="javascript"
            code={log.script}
            components={{
              Pre: (props) => (
                <pre
                  {...props}
                  className="m-0 p-4 text-[11px] font-mono leading-relaxed"
                />
              ),
              Code: (props) => (
                <code {...props} className="font-mono bg-transparent" />
              ),
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-[#9aa0a6] text-xs italic p-4 text-center">
            Source code not available for this tool.
            <br />
            (Only accessible for User Defined Tools)
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
