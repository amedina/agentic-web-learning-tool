/**
 * External dependencies.
 */
import { PlusIcon, MessageSquareIcon } from 'lucide-react';

/**
 * Internal dependencies.
 */
import { Button } from '../../button';
import { MacroCard } from '../macroCard';
import type { PromptMacro } from '../types';
import OptionsPageTabSection from '../../optionsPageTab/optionsPageTabSection';

interface MacroListProps {
    userMacros: PromptMacro[];
    builtInMacros: PromptMacro[];
    onToggleMacro: (macro: PromptMacro, enabled: boolean) => void;
    onEditMacro: (macro: PromptMacro) => void;
    onNewMacro: () => void;
    newMacroButton?: React.ReactNode;
}

export function MacroList({ userMacros, builtInMacros, onToggleMacro, onEditMacro, onNewMacro, newMacroButton }: MacroListProps) {
    return (
        <div className="flex flex-col gap-8">
            <OptionsPageTabSection title="Custom Macros">
                <div className="flex justify-end mb-4">{newMacroButton}</div>
                {userMacros.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-[var(--surface-color)]/50 rounded-xl border border-dashed border-gray-200 text-center">
                        <div className="bg-[var(--surface-active)] p-4 rounded-full mb-3">
                            <MessageSquareIcon className="text-gray-300" size={32} />
                        </div>
                        <h3 className="text-gray-900 font-medium mb-1">No custom macros</h3>
                        <p className="text-gray-500 text-sm max-w-lg mb-4 text-balance">
                            Create custom macros that expand into reusable prompt templates.
                        </p>
                        <Button variant="outline" size="sm" onClick={onNewMacro} className="gap-2">
                            <PlusIcon size={14} />
                            Create Macro
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {userMacros.map((macro) => (
                            <MacroCard
                                key={macro.name}
                                macro={macro}
                                onToggle={(enabled) => onToggleMacro(macro, enabled)}
                                onEdit={() => onEditMacro(macro)}
                            />
                        ))}
                    </div>
                )}
            </OptionsPageTabSection>

            <OptionsPageTabSection title="Built-in Macros">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {builtInMacros.map((macro) => (
                        <MacroCard
                            key={macro.name}
                            macro={macro}
                            onToggle={(enabled) => onToggleMacro(macro, enabled)}
                            onEdit={() => { }}
                        />
                    ))}
                </div>
            </OptionsPageTabSection>
        </div>
    );
}
