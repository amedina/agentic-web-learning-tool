/**
 * External dependencies
 */
import {
  Sidebar,
  SidebarTrigger,
  Toaster,
  useSidebar,
} from '@google-awlt/design-system';
import {
  CpuIcon,
  CodeIcon,
  Settings2,
  MessageSquare,
  Server,
} from 'lucide-react';
import { useEffect } from 'react';

/**
 * Internal dependencies
 */
import {
  AgentStudioTab,
  WebMCPToolsTab,
  SettingsTab,
  PromptCommandsTab,
} from './components';
import MCPServersTab from './components/mcpServers';
import { useSettings } from '../stateProviders';

const Items = [
  {
    title: 'Agents',
    id: 'agents',
    icon: () => <CpuIcon />,
    component: <AgentStudioTab />,
  },
  {
    title: 'MCP Servers',
    id: 'mcp-server',
    icon: () => <Server />,
    component: <MCPServersTab />,
  },
  {
    title: 'Prompt Commands',
    id: 'prompt-commands',
    icon: () => <MessageSquare />,
    component: <PromptCommandsTab />,
  },
  {
    title: 'WebMCP Tools',
    id: 'webmcp-tools',
    icon: () => <CodeIcon />,
    component: <WebMCPToolsTab />,
  },
  {
    title: 'Settings',
    id: 'settings',
    icon: () => <Settings2 />,
    component: <SettingsTab />,
  },
];

function Options() {
  const { selectedMenuItem, setSelectedMenuItem } = useSidebar(
    ({ state, actions }) => ({
      selectedMenuItem: state.selectedMenuItem,
      setSelectedMenuItem: actions.setSelectedMenuItem,
    })
  );

  useEffect(() => {
    if (!selectedMenuItem) {
      setSelectedMenuItem(Items[0].id);
    } else if (!Items.map((item) => item.id).includes(selectedMenuItem)) {
      setSelectedMenuItem(Items[0].id);
    }
  }, [selectedMenuItem]);

  const { theme } = useSettings(({ state }) => ({ theme: state.theme }));

  return (
    <>
      <Toaster
        position="top-center"
        theme={theme === 'auto' ? 'system' : theme}
      />
      <div className="fixed top-0 left-0 z-20 md:hidden pl-4 shadow bg-sidebar rounded-md">
        <SidebarTrigger />
      </div>
      <Sidebar items={Items} collapsible="icon" />
      {Items.find((item) => item.id === selectedMenuItem)?.component}
    </>
  );
}

export default Options;
