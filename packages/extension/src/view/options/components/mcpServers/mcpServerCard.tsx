/**
 * External dependencies.
 */
import {
  EditIcon,
  Loader2,
  OctagonAlert,
  ZapOff,
  View,
  RotateCcw,
  RefreshCwOff,
} from 'lucide-react';
import { Button, TooltipIconButton } from '@google-awlt/design-system';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { MCPServerConfig } from '@google-awlt/common';
import { useMemo } from 'react';

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
  const iconToDisplay = useMemo(() => {
    if (!server?.enabled) {
      return (
        <TooltipIconButton tooltip="Server is disabled">
          <ZapOff className="h-4 w-4" />
        </TooltipIconButton>
      );
    }

    if (tools && tools?.isError) {
      return (
        <TooltipIconButton tooltip="Error in fetching tools.">
          <OctagonAlert className="h-4 w-4" />
        </TooltipIconButton>
      );
    }

    if (!tools || !tools.tools) {
      return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
    }

    return tools?.tools.length;
  }, [server?.enabled, tools]);

  const buttonChildren = useMemo(() => {
    if (server.isReconnecting) {
      return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
    }

    if (server.enabled) {
      if (tools && tools.isError) {
        return (
          <>
            <RotateCcw className=" w-4 h-4" /> Reconnect
          </>
        );
      }
      return (
        <>
          <RefreshCwOff className=" w-4 h-4" /> Disconnect
        </>
      );
    }

    return (
      <>
        <RotateCcw className=" w-4 h-4" /> Reconnect
      </>
    );
  }, [server.enabled, server.isReconnecting, tools]);

  return (
    <div className="flex flex-col p-5 bg-[var(--surface-color)] rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-primary">{server.name}</h3>
        </div>
        <Button
          className="flex items-center"
          onClick={() => onToggle(!server.enabled)}
        >
          {buttonChildren}
        </Button>
      </div>
      <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-200">
        <div className="flex gap-2 flex-wrap items-center">
          Total Tools: {iconToDisplay}
        </div>
        <div className="flex flex-row gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onView}
            disabled={!server?.enabled || server.isReconnecting}
            className="text-[var(--primary-color)] hover:text-[var(--primary-hover)] hover:bg-[var(--surface-active)] gap-2"
          >
            <View size={14} />
            Inspect
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="text-[var(--primary-color)] hover:text-[var(--primary-hover)] hover:bg-[var(--surface-active)] gap-2"
          >
            <EditIcon size={14} />
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
}
