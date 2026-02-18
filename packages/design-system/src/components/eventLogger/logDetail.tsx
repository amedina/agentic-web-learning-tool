/**
 * Internal dependencies.
 */
import { SyntaxHighlighterJSON } from '../syntaxHighlighter';

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

function LogExecutionDetails({ log }: { log: LogDetailProps['log'] }) {
  return (
    <>
      <div className="p-2 border-b border-[#f1f3f4] overflow-auto min-h-0">
        <div className="text-[10px] font-bold text-[#5f6368] mb-1">
          ARGUMENTS
        </div>
        <SyntaxHighlighterJSON json={log.args} />
      </div>
      <div className="p-2 overflow-auto min-h-0">
        <div className="text-[10px] font-bold text-[#5f6368] mb-1">
          {log.status === 'error' ? 'ERROR' : 'OUTPUT'}
        </div>
        <SyntaxHighlighterJSON
          json={log.status === 'error' ? log.error : log.result}
        />
      </div>
    </>
  );
}

export function LogDetail({ log }: LogDetailProps) {
  return (
    <div className="flex flex-col h-full">
      <LogExecutionDetails log={log} />
    </div>
  );
}
