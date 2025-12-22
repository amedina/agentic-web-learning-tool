/**
 * Internal dependencies.
 */
import type { WebMCPTool } from '../types';
import { ToolCard } from '../ToolCard';

interface ToolListProps {
    userTools: WebMCPTool[];
    builtInTools: WebMCPTool[];
    onToggleTool: (tool: WebMCPTool, enabled: boolean) => void;
    onEditTool: (tool: WebMCPTool) => void;
}

export function ToolList({ userTools, builtInTools, onToggleTool, onEditTool }: ToolListProps) {
    return (
        <div className="flex flex-col gap-8">
            {/* User Scripts Section */}
            <section>
                <h2 className="text-xl font-bold mb-4 text-[var(--text-color)]">User Scripts</h2>
                {userTools.length === 0 ? (
                    <div className="text-[var(--text-secondary-color)] italic p-4 bg-[var(--surface-color)] rounded border border-[var(--border-color)]">
                        No user scripts added yet. Click "New Script" to get started.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userTools.map((tool) => (
                            <ToolCard
                                key={tool.name}
                                tool={tool}
                                onToggle={(enabled) => onToggleTool(tool, enabled)}
                                onEdit={() => onEditTool(tool)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Built-in Tools Section */}
            <section>
                <h2 className="text-xl font-bold mb-4 text-[var(--text-color)]">Built-in Tools</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {builtInTools.map((tool) => (
                        <ToolCard
                            key={tool.name}
                            tool={tool}
                            onToggle={(enabled) => onToggleTool(tool, enabled)}
                        // Built-in tools cannot be edited
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}
