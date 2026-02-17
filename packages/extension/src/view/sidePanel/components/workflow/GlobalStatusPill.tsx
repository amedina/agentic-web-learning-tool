/**
 * External dependencies
 */
import { useState } from 'react';
import { Loader2, Play, Square, XCircle } from 'lucide-react';

/**
 * Internal dependencies
 */
import { useWorkflowSync } from '../../hooks/useWorkflowSync';

const GlobalStatusPill = () => {
  const { workflowName, status, stopWorkflow } = useWorkflowSync();
  const [isExpanded, setIsExpanded] = useState(false);

  if (status === 'idle') {
    return null;
  }

  const isRunning = status === 'running';

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Expanded Status Popup */}
      {isExpanded && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl p-4 w-64 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold truncate flex-1 mr-2">
              {workflowName || 'Running Workflow'}
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <XCircle size={16} />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <div
                className={`w-2 h-2 rounded-full ${isRunning ? 'bg-blue-500 animate-pulse' : status === 'completed' ? 'bg-green-500' : 'bg-red-500'}`}
              />
              <span className="capitalize">{status}</span>
            </div>

            {isRunning && (
              <button
                onClick={stopWorkflow}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs font-medium transition-colors"
              >
                <Square size={12} fill="currentColor" />
                Stop Workflow
              </button>
            )}

            {!isRunning && (
              <button
                onClick={() => setIsExpanded(false)}
                className="w-full py-2 px-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md text-xs font-medium transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}

      {/* Circular Pill */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${
          isRunning
            ? 'bg-blue-500 text-white ring-4 ring-blue-500/20'
            : status === 'completed'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
        }`}
      >
        {isRunning ? (
          <Loader2 className="animate-spin" size={24} />
        ) : status === 'completed' ? (
          <Play size={20} fill="currentColor" />
        ) : (
          <XCircle size={24} />
        )}
      </button>
    </div>
  );
};

export default GlobalStatusPill;
