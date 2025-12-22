/**
 * Internal dependencies.
 */
import { PlusIcon, CodeIcon } from 'lucide-react';
import { Button } from '../../button';
import type { WebMCPTool } from '../types';
import { ToolCard } from '../ToolCard';

interface ToolListProps {
    userTools: WebMCPTool[];
    builtInTools: WebMCPTool[];
    onToggleTool: (tool: WebMCPTool, enabled: boolean) => void;
    onEditTool: (tool: WebMCPTool) => void;
    onNewTool: () => void;
}

export function ToolList({ userTools, builtInTools, onToggleTool, onEditTool, onNewTool }: ToolListProps) {
    return (
        <div className="flex flex-col gap-8">
            {/* User Scripts Section */}
            <section>
                <h2 className="text-xl font-bold mb-4 text-gray-800">User Scripts</h2>
                {userTools.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-[var(--surface-color)]/50 rounded-xl border border-dashed border-gray-200 text-center">
                        <div className="bg-[var(--surface-active)] p-4 rounded-full mb-3">
                            <CodeIcon className="text-gray-300" size={32} />
                        </div>
                        <h3 className="text-gray-900 font-medium mb-1">No custom scripts yet</h3>
                        <p className="text-gray-500 text-sm max-w-sm mb-4">
                            Create your own WebMCP tools to automate tasks and extend functionality.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onNewTool}
                            className="gap-2"
                        >
                            <PlusIcon size={14} />
                            Create Script
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <h2 className="text-xl font-bold mb-4 text-gray-800">Built-in Tools</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
