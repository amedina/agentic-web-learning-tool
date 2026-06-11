/**
 * External dependencies.
 */
import { Play } from 'lucide-react';
interface ActionButtonProps<T> {
  onRunTool: (tool: T) => void;
  details: T;
}

export const ActionButton = <T,>({
  onRunTool,
  details,
}: ActionButtonProps<T>) => {
  return (
    <button
      className="p-1 hover:bg-gray-200 rounded text-green-600 transition-colors"
      onClick={(e) => {
        e.stopPropagation();
        onRunTool(details);
      }}
      title="Run Tool"
    >
      <Play width="16" height="16" />
    </button>
  );
};
