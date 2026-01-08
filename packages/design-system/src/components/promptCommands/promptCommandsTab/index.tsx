/**
 * External dependencies.
 */
import { useCallback, useState } from 'react';
import { PlusIcon } from 'lucide-react';

/**
 * Internal dependencies.
 */
import { Button } from '../../button';
import { CommandList } from '../commandList';
import { EditCommandDialog } from '../editCommandDialog';
import OptionsPageTab from '../../optionsPageTab';
import type { PromptCommand } from '../types';

interface PromptCommandsTabProps {
  userCommands: PromptCommand[];
  builtInCommands?: PromptCommand[];
  onSaveCommands: (commands: PromptCommand[]) => void;
  onSaveBuiltInState?: (commands: PromptCommand[]) => void;
}

export function PromptCommandsTab({
  userCommands,
  builtInCommands = [],
  onSaveCommands,
  onSaveBuiltInState,
}: PromptCommandsTabProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<
    PromptCommand | undefined
  >(undefined);

  const handleSaveCommand = useCallback(
    (command: PromptCommand) => {
      let newCommands = [...userCommands];

      if (editingCommand) {
        const index = newCommands.findIndex(
          (m) => m.name === editingCommand.name
        );
        if (index >= 0) {
          newCommands[index] = command;
        } else {
          newCommands.push(command);
        }
      } else {
        newCommands.push(command);
      }

      onSaveCommands(newCommands);
      setIsEditDialogOpen(false);
    },
    [editingCommand, userCommands, onSaveCommands]
  );

  const handleToggleCommand = useCallback(
    (command: PromptCommand, enabled: boolean) => {
      if (command.isBuiltIn) {
        if (onSaveBuiltInState) {
          const newCommands = builtInCommands.map((m) =>
            m.name === command.name ? { ...m, enabled } : m
          );
          onSaveBuiltInState(newCommands);
        }
      } else {
        const newCommands = userCommands.map((m) =>
          m.name === command.name ? { ...m, enabled } : m
        );
        onSaveCommands(newCommands);
      }
    },
    [onSaveBuiltInState, onSaveCommands, builtInCommands, userCommands]
  );

  const handleDeleteCommand = useCallback(
    (command: PromptCommand) => {
      const newCommands = userCommands.filter((m) => m.name !== command.name);
      onSaveCommands(newCommands);
      setIsEditDialogOpen(false);
    },
    [userCommands, onSaveCommands]
  );

  const existingNames = userCommands.map((m) => m.name);

  return (
    <OptionsPageTab
      title="Prompt Commands"
      description="Manage your frequent prompt templates and commands."
    >
      <CommandList
        userCommands={userCommands}
        builtInCommands={builtInCommands}
        onToggleCommand={handleToggleCommand}
        onEditCommand={(command) => {
          setEditingCommand(command);
          setIsEditDialogOpen(true);
        }}
        onNewCommand={() => {
          setEditingCommand(undefined);
          setIsEditDialogOpen(true);
        }}
        newCommandButton={
          <Button
            className="shadow-sm hover:shadow-md transition-all gap-2 bg-gray-900 hover:bg-gray-800 text-white"
            onClick={() => {
              setEditingCommand(undefined);
              setIsEditDialogOpen(true);
            }}
          >
            <PlusIcon size={16} />
            New Command
          </Button>
        }
      />

      <EditCommandDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        command={editingCommand}
        onSave={handleSaveCommand}
        onDelete={editingCommand ? handleDeleteCommand : undefined}
        existingNames={existingNames}
      />
    </OptionsPageTab>
  );
}
