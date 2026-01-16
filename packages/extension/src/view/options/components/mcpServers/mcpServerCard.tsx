/**
 * External dependencies.
 */
import { EditIcon, ListMinus, Loader2, ZapOff } from 'lucide-react';
import {
  Button,
  ToggleSwitch,
  TooltipIconButton,
} from '@google-awlt/design-system';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { MCPServerConfig } from '@google-awlt/common';

interface MCPServerCardProps {
  server: MCPServerConfig;
  tools: { tools: Tool[]; isError: boolean };
  onToggle: (enabled: boolean) => void;
  onEdit: () => void;
  onView: () => void;
}

export function MCPServerCard({
  server,
  onToggle,
  tools,
  onEdit,
  onView,
}: MCPServerCardProps) {
  return (
    <div className="flex flex-col p-5 bg-[var(--surface-color)] rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-primary">{server.name}</h3>
        </div>
        <ToggleSwitch
          checked={server.enabled}
          onCheckedChange={onToggle}
          className="data-[state=checked]:bg-green-400"
        />
      </div>
      <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-200">
        <div className="flex gap-2 flex-wrap">
          Total Tools:{' '}
          {!server.enabled ? (
            <TooltipIconButton tooltip="Server is disabled">
              <ZapOff className="h-4 w-4" />
            </TooltipIconButton>
          ) : tools?.isError || !tools || !tools.tools ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            tools?.tools.length
          )}
        </div>
        <div className="flex flex-row gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onView}
            className="text-[var(--primary-color)] hover:text-[var(--primary-hover)] hover:bg-[var(--surface-active)]"
          >
            <ListMinus size={14} />
            View Tools
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="text-[var(--primary-color)] hover:text-[var(--primary-hover)] hover:bg-[var(--surface-active)]"
          >
            <EditIcon size={14} />
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
}
