/**
 * External dependencies
 */
import { useState } from 'react';

/**
 * Internal dependencies
 */
import { useToolSidebar } from '../../tools/toolSidebarContext';

interface ToolItemProps {
  label: string;
  onClick?: () => void;
  Icon: React.ComponentType<{ size: number; className?: string }>;

  disabled?: boolean;
  title?: string;
  collapsed?: boolean;
  onDragStart?: (event: React.DragEvent) => void;
}

const ToolItem = ({
  label,
  onClick,
  Icon,
  disabled,
  title,
  collapsed: collapsedProp,
  onDragStart,
}: ToolItemProps) => {
  const { collapsed: contextCollapsed } = useToolSidebar();
  const collapsed = collapsedProp ?? contextCollapsed;
  const [dragging, setDragging] = useState(false);

  return (
    <button
      disabled={disabled}
      draggable={!disabled}
      onDragStart={(event) => {
        setDragging(true);
        onDragStart?.(event);
      }}
      onDragEnd={() => {
        setDragging(false);
      }}
      title={title || (collapsed ? label : undefined)}
      className={`flex items-center transition-all ${
        collapsed
          ? 'w-12 h-12 justify-center p-0 mx-auto'
          : 'w-full gap-3 p-3 text-sm font-medium'
      } mb-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border rounded-lg ${
        disabled
          ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-zinc-950 grayscale'
          : 'cursor-grab hover:border-indigo-500 hover:shadow-md text-slate-700 dark:text-zinc-200'
      } ${dragging ? 'cursor-grabbing' : ''}`}
      onClick={onClick}
    >
      <Icon
        size={18}
        className={
          disabled
            ? 'text-slate-400 dark:text-zinc-600'
            : 'text-indigo-600 dark:text-indigo-400'
        }
      />
      {!collapsed && label}
    </button>
  );
};
export default ToolItem;
