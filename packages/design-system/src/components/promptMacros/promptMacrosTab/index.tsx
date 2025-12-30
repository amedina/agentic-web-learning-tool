/**
 * External dependencies.
 */
import { useCallback, useState } from 'react';
import { PlusIcon } from 'lucide-react';

/**
 * Internal dependencies.
 */
import { Button } from '../../button';
import { MacroList } from '../macroList';
import { EditMacroDialog } from '../editMacroDialog';
import OptionsPageTab from '../../optionsPageTab';
import type { PromptMacro } from '../types';

interface PromptMacrosTabProps {
    macros: PromptMacro[];
    onSaveMacros: (macros: PromptMacro[]) => void;
}

export function PromptMacrosTab({ macros, onSaveMacros }: PromptMacrosTabProps) {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingMacro, setEditingMacro] = useState<PromptMacro | undefined>(undefined);

    const handleSaveMacro = useCallback((macro: PromptMacro) => {
        let newMacros = [...macros];

        if (editingMacro) {
            const index = newMacros.findIndex(m => m.name === editingMacro.name);
            if (index >= 0) {
                newMacros[index] = macro;
            } else {
                newMacros.push(macro);
            }
        } else {
            newMacros.push(macro);
        }

        onSaveMacros(newMacros);
        setIsEditDialogOpen(false);
    }, [editingMacro, macros, onSaveMacros]);

    const handleDeleteMacro = useCallback((macro: PromptMacro) => {
        const newMacros = macros.filter(m => m.name !== macro.name);
        onSaveMacros(newMacros);
        setIsEditDialogOpen(false);
    }, [macros, onSaveMacros]);

    const existingNames = macros.map(m => m.name);

    return (
        <OptionsPageTab title="Prompt Macros" description="Manage your frequent prompt templates and commands.">
            <MacroList
                macros={macros}
                onEditMacro={(macro) => {
                    setEditingMacro(macro);
                    setIsEditDialogOpen(true);
                }}
                onNewMacro={() => {
                    setEditingMacro(undefined);
                    setIsEditDialogOpen(true);
                }}
                newMacroButton={
                    <Button
                        className="shadow-sm hover:shadow-md transition-all gap-2 bg-gray-900 hover:bg-gray-800 text-white"
                        onClick={() => {
                            setEditingMacro(undefined);
                            setIsEditDialogOpen(true);
                        }}
                    >
                        <PlusIcon size={16} />
                        New Command
                    </Button>
                }
            />

            <EditMacroDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                macro={editingMacro}
                onSave={handleSaveMacro}
                onDelete={editingMacro ? handleDeleteMacro : undefined}
                existingNames={existingNames}
            />
        </OptionsPageTab>
    );
}
