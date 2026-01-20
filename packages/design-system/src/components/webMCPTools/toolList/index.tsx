/**
 * External dependencies.
 */
import { PlusIcon, CodeIcon } from 'lucide-react';

/**
 * Internal dependencies.
 */
import { Button } from '../../button';
import type { WebMCPTool } from '../types';
import { ToolCard } from '../../toolCard';
import OptionsPageTabSection from '../../optionsPageTab/optionsPageTabSection';

interface ToolListProps {
  userTools: WebMCPTool[];
  builtInTools: WebMCPTool[];
  onToggleTool: (tool: WebMCPTool, enabled: boolean) => void;
  onEditTool: (tool: WebMCPTool) => void;
  onNewTool: () => void;
  newScriptButton?: React.ReactNode;
}

export function ToolList({
  userTools,
  builtInTools,
  onToggleTool,
  onEditTool,
  onNewTool,
  newScriptButton,
}: ToolListProps) {
  return (
    <div className="flex flex-col gap-8">
      <OptionsPageTabSection title="Custom Tools">
        <div className="flex justify-end">{newScriptButton}</div>
        {userTools.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-[var(--surface-color)]/50 rounded-xl border border-dashed border-gray-200 text-center">
            <div className="bg-[var(--surface-active)] p-4 rounded-full mb-3">
              <CodeIcon className="text-gray-300" size={32} />
            </div>
            <h3 className="text-amethyst-haze font-medium mb-1">
              No custom scripts yet
            </h3>
            <p className="text-amethyst-haze text-sm max-w-sm mb-4">
              Create your own WebMCP tools to automate tasks and extend
              functionality.
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
      </OptionsPageTabSection>

      {/* Built-in Tools Section */}
      <OptionsPageTabSection title="Built-in Tools">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {builtInTools.map((tool) => (
            <ToolCard
              key={tool.name}
              tool={tool}
              onToggle={(enabled) => onToggleTool(tool, enabled)}
            />
          ))}
        </div>
      </OptionsPageTabSection>
    </div>
  );
}
