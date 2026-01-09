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
import { useMcpProvider } from '../../providers';
import { MCPServerCard } from './mcpServerCard';

export default function MCPServersTab() {
  const [isDialogOpen, setIsDialogOpen] = useState('');
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
  const [selectedServer, setSelectedServer] = useState<string>('');
  return (
    <OptionsPageTab
      title="MCPServers"
      description="Add MCP Servers and use them in sidepanel."
    >
      <OptionsPageTabSection title="MCP Servers">
        <div className="flex justify-end">
          <Button
            className="shadow-sm hover:shadow-md transition-all gap-2 bg-gray-900 hover:bg-gray-800 text-white"
            onClick={() => {
              setIsDialogOpen('config');
              setSelectedServer('');
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
                setIsDialogOpen('tools');
                setSelectedServer(server);
              }}
              server={serverConfigs[server]}
              key={server}
              tools={toolList[server] ?? []}
              onEdit={() => {
                setIsDialogOpen('config');
                setSelectedServer(server);
              }}
              onToggle={(value) => handleToggle(server, value)}
            />
          ))}
        </div>
        {isDialogOpen && (
          <MCPServerDialog
            toolList={toolList[selectedServer]}
            open={Boolean(isDialogOpen)}
            defaultTab={isDialogOpen}
            onDelete={selectedServer ? removeConfig : undefined}
            onSave={addServer}
            validator={validator}
            onOpenChange={(value) => {
              setIsDialogOpen('');
              if (!value) {
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
