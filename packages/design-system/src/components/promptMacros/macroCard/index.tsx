/**
 * External dependencies.
 */
import { EditIcon } from 'lucide-react';

/**
 * Internal dependencies.
 */
import { Button } from '../../button';
import ToggleSwitch from '../../toggleSwitch';
import type { PromptMacro } from '../types';

interface MacroCardProps {
    macro: PromptMacro;
    onToggle: (enabled: boolean) => void;
    onEdit: () => void;
}

export function MacroCard({ macro, onToggle, onEdit }: MacroCardProps) {
    return (
        <div className="flex flex-col p-5 bg-[var(--surface-color)] rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 h-full">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">/{macro.name}</h3>
                </div>
                <ToggleSwitch
                    checked={macro.enabled}
                    onCheckedChange={onToggle}
                    className="data-[state=checked]:bg-gray-900"
                />
            </div>

            <p className="text-sm text-gray-600 mb-5 flex-grow leading-relaxed whitespace-pre-wrap line-clamp-3">
                {macro.description || macro.instructions}
            </p>

            <div className="flex justify-end items-center mt-auto pt-3 border-t border-gray-200 min-h-[53px]">
                {!macro.isBuiltIn && (
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
