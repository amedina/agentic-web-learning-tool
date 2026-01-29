/**
 * External dependencies
 */
import {
  Button,
  MCPServerDialog,
  OptionsPageTab,
  OptionsPageTabSection,
  useSidebar,
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

  const { setSelectedMenuItem } = useSidebar(({ actions }) => ({
    setSelectedMenuItem: actions.setSelectedMenuItem,
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
                setSelectedMenuItem('mcp-inspector');
              }}
              server={serverConfigs[server]}
              key={server}
              tools={toolList[server]}
              onEdit={() => {
                setIsDialogOpen(true);
                setSelectedServer(server);
              }}
              onToggle={(value) => handleToggle(server, value)}
            />
          ))}
        </div>
        {isDialogOpen && (
          <MCPServerDialog
            open={isDialogOpen}
            onDelete={selectedServer ? removeConfig : undefined}
            onSave={addServer}
            validator={validator}
            onOpenChange={(value) => {
              if (!value) {
                setIsDialogOpen(false);
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
