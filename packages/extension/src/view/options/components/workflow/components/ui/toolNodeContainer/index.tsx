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
  type,
  Icon,
  selected,
  status,
  onEdit,
  onRemove,
}: PropsWithChildren<ToolNodeContainerProps>) => {
  const getStatusClasses = () => {
    switch (status) {
      case 'running':
        return 'border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse scale-[1.02]';
      case 'success':
        return 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]';
      case 'error':
        return 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]';
      default:
        return selected ? 'border-indigo-500 shadow-lg' : 'border-slate-200';
    }
  };

  const getHeaderClasses = () => {
    switch (status) {
      case 'running':
        return 'bg-blue-50';
      case 'success':
        return 'bg-green-50';
      case 'error':
        return 'bg-red-50';
      default:
        return selected ? 'bg-indigo-50' : 'bg-slate-50';
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md border-2 w-[300px] transition-all duration-300 ${getStatusClasses()}`}
      onClick={onEdit}
    >
      <div
        className={`w-full flex items-center justify-between gap-2 p-2 rounded-t-md border-b border-slate-100 ${getHeaderClasses()}`}
      >
        <div className="flex items-center gap-2 text-slate-700">
          <div>
            <Icon
              size={16}
              className={
                status === 'success'
                  ? 'text-green-600'
                  : status === 'error'
                    ? 'text-red-600'
                    : 'text-indigo-600'
              }
            />
          </div>
          <p className="flex flex-col ml-1">
            <span className="font-semibold text-sm flex items-center gap-2">
              {title}
              {status === 'running' && (
                <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-ping"></span>
              )}
            </span>
            <span className="font-medium text-[10px] text-gray-400 italic">
              ({type})
            </span>
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onRemove}
            className="p-1 hover:bg-red-100 rounded text-slate-400 hover:text-red-500"
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
