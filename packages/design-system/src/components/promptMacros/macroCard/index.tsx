/**
 * External dependencies.
 */
import { EditIcon } from 'lucide-react';

/**
 * Internal dependencies.
 */
import { Button } from '../../button';
import type { PromptMacro } from '../types';

interface MacroCardProps {
    macro: PromptMacro;
    onEdit: () => void;
}

export function MacroCard({ macro, onEdit }: MacroCardProps) {
    return (
        <div className="flex flex-col p-5 bg-[var(--surface-color)] rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 h-full">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <div className="px-2 py-1 bg-gray-100 rounded text-xs font-mono font-medium text-gray-600">
                        Macro
                    </div>
                </div>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-2">/{macro.name}</h3>

            <p className="text-sm text-gray-600 mb-5 flex-grow leading-relaxed whitespace-pre-wrap line-clamp-3 font-mono bg-gray-50 p-3 rounded-md border border-gray-100">
                {macro.description || macro.instructions}
            </p>

            <div className="flex justify-end items-center mt-auto pt-3 border-t border-gray-200">
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
