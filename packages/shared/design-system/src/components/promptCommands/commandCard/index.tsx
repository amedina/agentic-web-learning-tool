/**
 * External dependencies.
 */
import { EditIcon } from 'lucide-react';

/**
 * Internal dependencies.
 */
import { Button } from '../../button';
import ToggleSwitch from '../../toggleSwitch';
import type { PromptCommand } from '../types';

interface CommandCardProps {
  command: PromptCommand;
  onToggle: (enabled: boolean) => void;
  onEdit: () => void;
}

export function CommandCard({ command, onToggle, onEdit }: CommandCardProps) {
  return (
    <div className="flex flex-col p-5 bg-[var(--surface-color)] rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 h-full">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-primary">/{command.name}</h3>
        </div>
        <ToggleSwitch checked={command.enabled} onCheckedChange={onToggle} />
      </div>

      <p className="text-sm text-amethyst-haze mb-5 flex-grow leading-relaxed whitespace-pre-wrap line-clamp-3">
        {command.description || command.instructions}
      </p>

      <div className="flex justify-end items-center mt-auto pt-3 border-t border-gray-200 min-h-[53px]">
        {!command.isBuiltIn && (
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
