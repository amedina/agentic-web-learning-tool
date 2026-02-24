/**
 * External dependencies
 */
import { Button, cn } from '@google-awlt/design-system';
import type { WorkflowJSON } from '@google-awlt/engine-core';
import { PlayIcon, Square, Loader2 } from 'lucide-react';

interface WorkflowCardProps {
  workflow: WorkflowJSON;
  onRun: () => void;
  onStop?: () => void;
  isRunning?: boolean;
  isStopping?: boolean;
  isOtherRunning?: boolean;
}

const WorkflowCard = ({
  workflow,
  onRun,
  onStop,
  isRunning,
  isStopping,
  isOtherRunning,
}: WorkflowCardProps) => {
  return (
    <div
      className={cn(
        'group relative flex flex-col p-4 bg-(--surface-color) rounded-xl border border-gray-200 shadow-sm transition-all duration-300',
        isRunning && 'border-blue-400 bg-blue-50/10 shadow-md',
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
          <h3 className="text-sm font-bold text-accent-foreground truncate transition-colors flex items-center gap-2">
            {workflow.meta.name || 'Untitled Workflow'}
            {workflow.meta.sanitizedName && (
              <span className="text-[10px] bg-(--surface-active) px-1.5 py-0.5 rounded text-amethyst-haze font-mono border border-(--border-color)">
                {workflow.meta.sanitizedName}
              </span>
            )}
          </h3>
        </div>
      </div>

      <p className="text-xs text-amethyst-haze line-clamp-2 leading-relaxed h-8 mb-4 font-normal">
        {workflow.meta.description || 'No description provided.'}
      </p>

      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <div className="flex gap-1 flex-wrap h-4">
          {workflow.meta.allowedDomains?.slice(0, 2).map((domain, idx) => (
            <span
              key={idx}
              className="bg-(--surface-active) text-gray-500 px-1.5 py-0.5 rounded-md text-[9px] font-mono border border-(--border-color) truncate max-w-[100px]"
            >
              {domain}
            </span>
          ))}
          {workflow.meta.allowedDomains &&
            workflow.meta.allowedDomains.length > 2 && (
              <span className="text-[9px] text-amethyst-haze self-center whitespace-nowrap">
                +{workflow.meta.allowedDomains.length - 2}
              </span>
            )}
        </div>

        <Button
          onClick={(e) => {
            e.stopPropagation();
            if (isRunning) {
              onStop?.();
            } else {
              onRun();
            }
          }}
          disabled={isStopping}
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 w-8 p-0 rounded-full shadow-sm text-white border-none transition-all',
            'opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 hover:text-white',
            isRunning
              ? 'opacity-100 scale-100 bg-red-500 hover:bg-red-600'
              : 'bg-blue-600 hover:bg-blue-400 dark:hover:bg-blue-700',
            isStopping && 'cursor-wait bg-red-400'
          )}
          title={
            isStopping
              ? 'Stopping...'
              : isRunning
                ? 'Stop Workflow'
                : 'Run Workflow'
          }
        >
          {isStopping ? (
            <Loader2 size={14} className="animate-spin" />
          ) : isRunning ? (
            <Square size={12} fill="white" className="animate-pulse" />
          ) : (
            <PlayIcon size={14} fill="white" className="ml-0.5" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default WorkflowCard;
