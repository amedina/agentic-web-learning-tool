/**
 * External dependencies.
 */
import { CodeEditor } from '../codeEditor';

/**
 * Internal dependencies.
 */
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs';

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

const TAB_TRIGGER_CLASS =
  'text-[11px] px-2 py-1 data-[state=active]:bg-[#e8f0fe] data-[state=active]:text-[#1967d2] rounded-none border-b-2 border-transparent data-[state=active]:border-[#1967d2]';

function LogExecutionDetails({ log }: { log: LogDetailProps['log'] }) {
  return (
    <>
      <div className="p-2 border-b border-[#f1f3f4] overflow-auto min-h-0">
        <div className="text-[10px] font-bold text-[#5f6368] mb-1">
          ARGUMENTS
        </div>
        <pre className="font-mono text-[11px] text-[#202124] whitespace-pre-wrap break-all select-text bg-[#f8f9fa] p-2 rounded border border-[#f1f3f4]">
          {JSON.stringify(log.args, null, 2)}
        </pre>
      </div>
      <div className="p-2 overflow-auto min-h-0">
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
    </>
  );
}

export function LogDetail({ log }: LogDetailProps) {
  const showTabs = log.type === 'WebMCP' || !!log.script;

  if (!showTabs) {
    return (
      <div className="h-full">
        <LogExecutionDetails log={log} />
      </div>
    );
  }

  return (
    <Tabs defaultValue="execution" className="flex flex-col h-full">
      <div className="px-2 pt-2 border-b border-[#f1f3f4]">
        <TabsList className="h-7 p-0 bg-transparent gap-2">
          <TabsTrigger value="execution" className={TAB_TRIGGER_CLASS}>
            Execution
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
        <LogExecutionDetails log={log} />
      </TabsContent>

      <TabsContent
        value="script"
        className="overflow-auto min-h-0 mt-0 p-0 border-0"
      >
        {log.script ? (
          <CodeEditor
            code={log.script}
            onChange={() => {}}
            isDarkMode={false}
            styles={{ fontSize: '11px', lineHeight: '1.2', fontWeight: 300 }}
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
