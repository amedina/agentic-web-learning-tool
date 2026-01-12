/**
 * External dependencies
 */
import { X } from 'lucide-react';
import type { JSX, PropsWithChildren } from 'react';

interface ToolNodeContainerProps {
  title: string;
  type: string;
  Icon: JSX.ElementType;
  selected: boolean;
  status?: 'running' | 'success' | 'error' | undefined;
  onEdit: () => void;
  onRemove: () => void;
}

const ToolNodeContainer = ({
  children,
  title,
  Icon,
  selected,
  status,
  onEdit,
  onRemove,
}: PropsWithChildren<ToolNodeContainerProps>) => {
  const getStatusClasses = () => {
    switch (status) {
      case 'running':
        return 'border-blue-400 dark:border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] dark:shadow-[0_0_20px_rgba(59,130,246,0.3)] animate-pulse scale-[1.02]';
      case 'success':
        return 'border-green-500 dark:border-green-600 shadow-[0_0_10px_rgba(34,197,94,0.3)]';
      case 'error':
        return 'border-red-500 dark:border-red-600 shadow-[0_0_10px_rgba(239,68,68,0.3)]';
      default:
        return selected
          ? 'border-indigo-500 dark:border-indigo-400 shadow-lg dark:shadow-indigo-500/20'
          : 'border-slate-200 dark:border-border';
    }
  };

  const getHeaderClasses = () => {
    switch (status) {
      case 'running':
        return 'bg-blue-50 dark:bg-blue-900/40';
      case 'success':
        return 'bg-green-50 dark:bg-green-900/40';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/40';
      default:
        return selected
          ? 'bg-indigo-50 dark:bg-indigo-900/40'
          : 'bg-slate-50 dark:bg-zinc-800/80';
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
  };

  return (
    <div
      className={`bg-white dark:bg-card rounded-lg shadow-md border-2 w-[300px] transition-all duration-300 ${getStatusClasses()}`}
      onClick={onEdit}
    >
      <div
        className={`flex items-center justify-between p-3 border-b-2 border-slate-100 dark:border-border rounded-t-lg ${getHeaderClasses()}`}
      >
        <div className="flex items-center gap-2">
          <Icon
            size={16}
            className={
              status === 'success'
                ? 'text-green-600 dark:text-green-500'
                : status === 'error'
                  ? 'text-red-600 dark:text-red-500'
                  : 'text-indigo-600 dark:text-indigo-400'
            }
          />
          <h4 className="text-sm font-bold text-slate-800 dark:text-foreground">
            {title}
          </h4>
          {status === 'running' && (
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-ping"></span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleRemove}
            className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full text-slate-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="w-full p-3">{children}</div>
    </div>
  );
};

export default ToolNodeContainer;
