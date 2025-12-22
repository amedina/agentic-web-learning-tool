import {
    Button,
    ToggleSwitch
} from '@google-awlt/design-system';
import { EditIcon } from 'lucide-react';
import type { WebMCPTool } from './types';

interface ToolCardProps {
    tool: WebMCPTool;
    onToggle: (enabled: boolean) => void;
    onEdit?: () => void;
}

export function ToolCard({ tool, onToggle, onEdit }: ToolCardProps) {
    return (
        <div className="flex flex-col p-4 bg-[var(--surface-color)] rounded-lg border border-[var(--border-color)]">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="text-lg font-semibold text-[var(--text-color)]">{tool.name}</h3>
                    <div className="text-sm text-[var(--text-secondary-color)] mb-1">
                        {tool.namespace} • v{tool.version}
                    </div>
                </div>
                <ToggleSwitch
                    checked={tool.enabled}
                    onCheckedChange={onToggle}
                />
            </div>

            <p className="text-sm text-[var(--text-color)] mb-4 flex-grow">
                {tool.description}
            </p>

            <div className="flex justify-between items-center mt-auto pt-2 border-t border-[var(--border-color)]">
                <div className="flex gap-2">
                    {tool.matchPatterns.map((pattern, idx) => (
                        <span key={idx} className="bg-[var(--surface-active)] text-[var(--text-secondary-color)] px-2 py-1 rounded text-xs font-mono">
                            {pattern}
                        </span>
                    ))}
                </div>

                {!tool.isBuiltIn && onEdit && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onEdit}
                        className="text-[var(--primary-color)] hover:text-[var(--primary-hover)] items-center gap-2"
                    >
                        <EditIcon size={14} />
                        Edit
                    </Button>
                )}
            </div>
        </div>
    );
}
