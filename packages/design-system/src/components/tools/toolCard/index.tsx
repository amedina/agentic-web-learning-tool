/**
 * External dependencies.
 */
import { EditIcon } from 'lucide-react';

/**
 * Internal dependencies.
 */
import { Button } from '../../button';
import ToggleSwitch from '../../toggleSwitch';
import type { WebMCPTool } from '../../types';

interface ToolCardProps {
  tool: WebMCPTool;
  onToggle?: (enabled: boolean) => void;
  onEdit?: () => void;
}

export function ToolCard({ tool, onToggle, onEdit }: ToolCardProps) {
  return (
    <div className="flex flex-col p-5 bg-[var(--surface-color)] rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-accent-foreground">
            {tool.name}
          </h3>
          <div className="text-xs text-amethyst-haze font-mono opacity-80 mb-1">
            {tool.namespace}
          </div>
        </div>
        {onToggle && (
          <ToggleSwitch checked={tool.enabled} onCheckedChange={onToggle} />
        )}
      </div>

      <p className="text-sm text-amethyst-haze mb-5 flex-grow leading-relaxed">
        {tool.description}
      </p>

      <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-200">
        <div className="flex gap-2 flex-wrap">
          {tool.allowedDomains.map((domain, idx) => (
            <span
              key={idx}
              className="bg-[var(--surface-active)] text-gray-500 px-2 py-0.5 rounded-md text-[10px] font-mono border border-[var(--border-color)]"
            >
              {domain}
            </span>
          ))}
        </div>

        {!tool.isBuiltIn && onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="text-[var(--primary-color)] hover:text-[var(--primary-hover)] hover:bg-[var(--surface-active)]"
          >
            <EditIcon size={14} />
            Edit
          </Button>
        )}
      </div>
    </div>
  );
}
