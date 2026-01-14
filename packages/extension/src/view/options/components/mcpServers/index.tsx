/**
 * External dependencies
 */
import {
  Button,
  MCPServerDialog,
  OptionsPageTab,
  OptionsPageTabSection,
} from '@google-awlt/design-system';
import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import { useMcpProvider } from '../../providers';
import { MCPServerCard } from './mcpServerCard';

export default function MCPServersTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedServer, setSelectedServer] = useState<string>('');

  const {
    serverConfigs,
    addServer,
    validator,
    removeConfig,
    toolList,
    handleToggle,
  } = useMcpProvider(({ state, actions }) => ({
    serverConfigs: state.serverConfigs,
    toolList: state.toolList,
    addServer: actions.addConfig,
    validator: actions.validateConfig,
    removeConfig: actions.removeConfig,
    handleToggle: actions.handleToggle,
  }));

  return (
    <OptionsPageTab
      title="MCP Servers"
      description="Add MCP servers to use them in sidepanel."
    >
      <OptionsPageTabSection title="MCP Servers">
        <div className="flex justify-end">
          <Button
            className="shadow-sm hover:shadow-md transition-all gap-2 bg-gray-900 hover:bg-gray-800 text-white"
            onClick={() => {
              setIsDialogOpen(true);
              setDialogType('config');
            }}
          >
            <PlusIcon size={16} />
            New Server
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.keys(serverConfigs).map((server) => (
            <MCPServerCard
              onView={() => {
                setIsDialogOpen(true);
                setDialogType('tools');
                setSelectedServer(server);
              }}
              server={serverConfigs[server]}
              key={server}
              tools={toolList[server]}
              onEdit={() => {
                setIsDialogOpen(true);
                setDialogType('config');
                setSelectedServer(server);
              }}
              onToggle={(value) => handleToggle(server, value)}
            />
          ))}
        </div>
        {isDialogOpen && (
          <MCPServerDialog
            toolList={toolList[selectedServer].tools}
            open={isDialogOpen}
            defaultTab={dialogType}
            onDelete={selectedServer ? removeConfig : undefined}
            onSave={addServer}
            validator={validator}
            onOpenChange={(value) => {
              if (!value) {
                setIsDialogOpen(false);
                setDialogType('');
                setSelectedServer('');
              }
            }}
            serverId={selectedServer}
            server={serverConfigs?.[selectedServer]}
          />
        )}
      </OptionsPageTabSection>
    </OptionsPageTab>
  );
}
