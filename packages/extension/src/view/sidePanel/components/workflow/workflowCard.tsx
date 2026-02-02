/**
 * External dependencies
 */
import { Button, cn } from '@google-awlt/design-system';
import type { WorkflowJSON } from '@google-awlt/engine-core';
import { PlayIcon } from 'lucide-react';

interface WorkflowCardProps {
  workflow: WorkflowJSON;
  onRun: () => void;
  isRunning?: boolean;
  isOtherRunning?: boolean;
}

const WorkflowCard = ({
  workflow,
  onRun,
  isRunning,
  isOtherRunning,
}: WorkflowCardProps) => {
  return (
    <div
      className={cn(
        'group relative flex flex-col p-4 bg-(--surface-color) rounded-xl border border-gray-200 shadow-sm transition-all duration-300',
        isRunning &&
          'opacity-70 scale-[0.98] border-blue-400 bg-blue-50/10 pointer-events-none',
        isOtherRunning && 'opacity-40 pointer-events-none grayscale-[0.2]'
      )}
    >
      {isRunning && (
        <div className="absolute inset-x-0 -top-px flex justify-center">
          <div className="h-0.5 w-24 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
        </div>
      )}

      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-accent-foreground truncate transition-colors">
            {workflow.meta.name || 'Untitled Workflow'}
          </h3>
          <div className="text-[10px] text-amethyst-haze font-mono opacity-80">
            {workflow.meta.id.substring(0, 8)}
          </div>
        </div>
      </div>

      <p className="text-xs text-amethyst-haze line-clamp-2 leading-relaxed h-8 mb-4 font-normal">
        {workflow.meta.description || 'No description provided.'}
      </p>

      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <div className="flex gap-1 flex-wrap h-4">
          {workflow.meta.allowedDomains.slice(0, 2).map((domain, idx) => (
            <span
              key={idx}
              className="bg-(--surface-active) text-gray-500 px-1.5 py-0.5 rounded-md text-[9px] font-mono border border-(--border-color) truncate max-w-[100px]"
            >
              {domain}
            </span>
          ))}
          {workflow.meta.allowedDomains.length > 2 && (
            <span className="text-[9px] text-amethyst-haze self-center whitespace-nowrap">
              +{workflow.meta.allowedDomains.length - 2}
            </span>
          )}
        </div>

        <Button
          onClick={(e) => {
            e.stopPropagation();
            onRun();
          }}
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 w-8 p-0 rounded-full shadow-sm bg-blue-600 hover:bg-blue-700 text-white border-none transition-all',
            'opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100',
            isRunning && 'opacity-100 scale-100 bg-blue-400 cursor-default'
          )}
          title={isRunning ? 'Running...' : 'Run Workflow'}
        >
          {isRunning ? (
            <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <PlayIcon size={14} fill="currentColor" className="ml-0.5" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default WorkflowCard;
