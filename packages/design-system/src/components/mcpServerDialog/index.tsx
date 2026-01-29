/**
 * External dependencies.
 */
import { useState, useCallback, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, TrashIcon, SaveIcon, Loader2, View } from 'lucide-react';
import type { MCPServerConfig } from '@google-awlt/common';
import { toast } from 'sonner';

/**
 * Internal dependencies.
 */
import { Button } from '../button';
import { ConfigInput } from './configInput';
import { useSidebar } from '../sidebar';

interface MCPServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  server: MCPServerConfig;
  onSave: (config: MCPServerConfig, serverName: string) => Promise<void>;
  onDelete?: (serverName: string) => void;
  validator: (
    config: MCPServerConfig,
    serverName: string,
    isEditing?: boolean
  ) => Promise<{ isValid: boolean; errors: string[] }>;
  serverId: string;
}

const initialState: MCPServerConfig = {
  transport: 'streamable-http',
  url: '',
  authToken: '',
  enabled: true,
  name: '',
  customHeaders: [],
};

export function MCPServerDialog({
  open,
  onOpenChange,
  server = initialState,
  serverId,
  onSave,
  onDelete,
  validator,
}: MCPServerDialogProps) {
  const [config, setConfig] = useState<MCPServerConfig>({ ...server });
  const [isValidConfig, setIsValidConfig] = useState<boolean>(false);
  const [isAddingConfig, setIsAddingConfig] = useState<boolean>(false);

  const { setSelectedMenuItem } = useSidebar(({ actions }) => ({
    setSelectedMenuItem: actions.setSelectedMenuItem,
  }));

  const handleSave = useCallback(async () => {
    setIsAddingConfig(true);
    const { errors } = await validator(
      config,
      config.name,
      serverId ? true : false
    );

    if (errors.length > 0) {
      errors.forEach((errorMessage) => {
        toast.error(errorMessage);
      });
      return;
    }

    await onSave(config, !server?.name ? Date.now().toString() : serverId);
    setIsAddingConfig(false);
    setTimeout(() => {
      onOpenChange(false);
    }, 500);
  }, [config, onOpenChange, onSave, server?.name, serverId, validator]);

  const handleDelete = useCallback(async () => {
    if (!onDelete) {
      return;
    }
    onOpenChange(false);
    onDelete(serverId);
  }, [onDelete, onOpenChange, serverId]);

  const handleInspect = useCallback(() => {
    onOpenChange(false);
    setSelectedMenuItem('mcp-inspector');
  }, [onOpenChange, setSelectedMenuItem]);

  const criticalFieldsChanged = useMemo(() => {
    if (!server || Object.keys(config).length === 0) {
      return;
    }

    return (
      config.name !== server.name ||
      config.authToken !== server.authToken ||
      config.url !== server.url ||
      config.transport !== server.transport
    );
  }, [config, server]);

  const updateEnabled = useMemo(() => {
    if (criticalFieldsChanged) {
      return isValidConfig;
    }

    // Only non-critical changes (enabled)
    return config.enabled !== server.enabled;
  }, [criticalFieldsChanged, isValidConfig, config, server]);

  const handleChange = useCallback((key: string, value: any) => {
    setConfig((prev) => {
      const updated = { ...prev, [key]: value };

      if (['name', 'authToken', 'url', 'transport'].includes(key)) {
        setIsValidConfig(false);
      }

      return updated;
    });
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[70vw] max-h-[90vh] bg-background text-foreground border border-gray-200 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
          <Dialog.Description className="hidden">
            This dialog adds/edits an MCP server.
          </Dialog.Description>
          <div className="flex items-center justify-between px-6 py-4 bg-background">
            <div className="flex items-center gap-3">
              <Dialog.Title className="text-lg font-bold">
                {serverId ? 'Edit MCP Server Config' : 'New MCP Server'}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost">
                <X size={20} />
              </Button>
            </Dialog.Close>
          </div>
          <div className="flex-grow flex flex-col p-5 overflow-hidden relative">
            <div className="flex-1 flex flex-col p-0 gap-2 relative bg-background overflow-auto">
              <ConfigInput config={config} setConfig={handleChange} />
            </div>

            <div className="py-6 max-md:flex-col max-md:items-start bg-background flex-none flex items-center justify-between gap-4">
              <div className="flex-1 flex gap-2">
                {server && onDelete && (
                  <Button variant="destructive" onClick={handleDelete}>
                    <TrashIcon size={16} /> Delete
                  </Button>
                )}
                <Button variant="outline" onClick={handleInspect}>
                  <View size={16} className="mr-2" /> Inspect
                </Button>
              </div>
              <div className="flex gap-3">
                <Dialog.Close asChild>
                  <Button variant="outline">Cancel</Button>
                </Dialog.Close>
                <Button
                  className={`bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed gap-2`}
                  onClick={handleSave}
                  disabled={!updateEnabled}
                >
                  {isAddingConfig ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <SaveIcon size={16} />
                  )}
                  {serverId ? 'Reconnect' : 'Connect'}
                </Button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
