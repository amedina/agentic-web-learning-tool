/**
 * External dependencies.
 */
import { useState, useCallback, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, TrashIcon, SaveIcon, FlaskConical, Loader2 } from 'lucide-react';
import type { MCPServerConfig } from '@google-awlt/common';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
/**
 * Internal dependencies.
 */
import { Button } from '../button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs';
import { ConfigInput } from './configInput';
import { ToolDisplay } from './toolDisplay';
import { toast } from 'sonner';

interface MCPServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  server: MCPServerConfig;
  toolList: Tool[];
  onSave: (config: MCPServerConfig, serverName: string) => Promise<void>;
  onDelete?: (serverName: string) => void;
  validator: (
    config: MCPServerConfig,
    serverName: string
  ) => Promise<{ isValid: boolean; errors: string[] }>;
  serverId: string;
  defaultTab: string;
}

const initialState: MCPServerConfig = {
  transport: 'http',
  url: '',
  authToken: '',
  enabled: true,
  name: '',
};

export function MCPServerDialog({
  open,
  onOpenChange,
  server = initialState,
  serverId,
  toolList = [],
  onSave,
  onDelete,
  validator,
  defaultTab = 'config',
}: MCPServerDialogProps) {
  const [config, setConfig] = useState({ ...server });
  const [isValidConfig, setIsValidConfig] = useState<boolean>(false);
  const [isAddingConfig, setIsAddingConfig] = useState<boolean>(false);
  const [isValidatingConfig, setIsValidatingConfig] = useState<boolean>(false);

  const handleValidate = useCallback(async () => {
    setIsValidatingConfig(true);
    const { isValid, errors } = await validator(config, config.name);
    if (errors.length > 0) {
      errors.forEach((errorMessage) => {
        toast.error(errorMessage);
      });
    }
    setIsValidatingConfig(false);
    setIsValidConfig(isValid);
  }, [config]);

  const handleSave = useCallback(async () => {
    setIsAddingConfig(true);
    await onSave(config, !server?.name ? Date.now().toString() : serverId);
    setIsAddingConfig(false);
    setTimeout(() => {
      onOpenChange(false);
    }, 500);
  }, [config, server]);

  const handleDelete = useCallback(async () => {
    if (!onDelete) {
      return;
    }
    onOpenChange(false);
    onDelete(serverId);
  }, [serverId, onDelete]);

  const criticalFieldsChanged = useMemo(() => {
    if (!server || Object.keys(config).length === 0) {
      return;
    }

    return (
      config.name !== server.name ||
      config.authToken !== server.authToken ||
      config.url !== server.url
    );
  }, [config, server]);

  const updateEnabled = useMemo(() => {
    if (criticalFieldsChanged) {
      return isValidConfig;
    }

    // Only non-critical changes (enabled / Transport)
    return config.enabled !== server.enabled;
  }, [criticalFieldsChanged, isValidConfig, config, server]);

  const handleChange = useCallback((key: string, value: string | boolean) => {
    setConfig((prev) => {
      const updated = { ...prev, [key]: value };

      if (['name', 'authToken', 'url'].includes(key)) {
        setIsValidConfig(false);
      }

      return updated;
    });
  }, []);

  const validateEnabled = criticalFieldsChanged && !isValidConfig;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[70vw] max-h-[90vh] bg-background text-foreground border border-gray-200 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
          <Dialog.Description className="hidden">
            This dialog adds/edits an MCP server and displays its tools.
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
              <Tabs defaultValue={defaultTab}>
                <TabsList>
                  <TabsTrigger value="config">Config</TabsTrigger>
                  <TabsTrigger
                    value="tools"
                    className={`${toolList.length === 0 ? 'opacity-50 cursor-default' : ''}`}
                    disabled={toolList.length === 0}
                  >
                    Tools
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="config">
                  <ConfigInput config={config} setConfig={handleChange} />
                </TabsContent>
                <TabsContent value="tools">
                  <ToolDisplay toolList={toolList} />
                </TabsContent>
              </Tabs>
            </div>

            <div className="py-6 max-md:flex-col max-md:items-start bg-background flex-none flex items-center justify-between gap-4">
              <div className="flex-1">
                {server && onDelete && (
                  <Button variant="destructive" onClick={handleDelete}>
                    <TrashIcon size={16} /> Delete
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Dialog.Close asChild>
                  <Button variant="outline">Cancel</Button>
                </Dialog.Close>
                <Button
                  className={`${validateEnabled ? 'bg-amber-600 hover:bg-amber-500' : 'bg-green-600 hover:bg-green-700'} gap-2`}
                  onClick={handleValidate}
                  disabled={!validateEnabled || isValidatingConfig}
                >
                  {isValidatingConfig ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FlaskConical size={16} />
                  )}
                  Validate
                </Button>
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
                  {serverId ? 'Update Server' : 'Add Server'}
                </Button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
