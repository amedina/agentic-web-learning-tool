/**
 * External dependencies.
 */
import { PlusIcon, MessageSquareIcon } from 'lucide-react';

/**
 * Internal dependencies.
 */
import { Button } from '../../button';
import { CommandCard } from '../commandCard';
import type { PromptCommand } from '../types';
import OptionsPageTabSection from '../../optionsPageTab/optionsPageTabSection';

interface CommandListProps {
  userCommands: PromptCommand[];
  builtInCommands: PromptCommand[];
  onToggleCommand: (command: PromptCommand, enabled: boolean) => void;
  onEditCommand: (command: PromptCommand) => void;
  onNewCommand: () => void;
  newCommandButton?: React.ReactNode;
}

export function CommandList({
  userCommands,
  builtInCommands,
  onToggleCommand,
  onEditCommand,
  onNewCommand,
  newCommandButton,
}: CommandListProps) {
  return (
    <div className="flex flex-col gap-8">
      <OptionsPageTabSection title="Custom Commands">
        <div className="flex justify-end mb-4">{newCommandButton}</div>
        {userCommands.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-[var(--surface-color)]/50 rounded-xl border border-dashed border-gray-200 text-center">
            <div className="bg-[var(--surface-active)] p-4 rounded-full mb-3">
              <MessageSquareIcon className="text-gray-300" size={32} />
            </div>
            <h3 className="text-amethyst-haze font-medium mb-1">
              No custom commands
            </h3>
            <p className="text-amethyst-haze text-sm max-w-lg mb-4 text-balance">
              Create custom commands that expand into reusable prompt templates.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onNewCommand}
              className="gap-2"
            >
              <PlusIcon size={14} />
              Create Command
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userCommands.map((command) => (
              <CommandCard
                key={command.name}
                command={command}
                onToggle={(enabled) => onToggleCommand(command, enabled)}
                onEdit={() => onEditCommand(command)}
              />
            ))}
          </div>
        )}
      </OptionsPageTabSection>

      <OptionsPageTabSection title="Built-in Commands">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {builtInCommands.map((command) => (
            <CommandCard
              key={command.name}
              command={command}
              onToggle={(enabled) => onToggleCommand(command, enabled)}
              onEdit={() => {}}
            />
          ))}
        </div>
      </OptionsPageTabSection>
    </div>
  );
}
