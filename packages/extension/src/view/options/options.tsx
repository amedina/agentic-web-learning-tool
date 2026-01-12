/**
 * External dependencies
 */

import {
  Sidebar,
  SidebarTrigger,
  Toaster,
  useSidebar,
  type MenuItem,
} from '@google-awlt/design-system';
import {
  CpuIcon,
  CodeIcon,
  Settings2,
  MessageSquare,
  Server,
  Activity,
  Play,
  Workflow,
  Sparkles,
  Database,
  View,
} from 'lucide-react';
import { useEffect, useMemo } from 'react';

/**
 * Internal dependencies
 */
import {
  ModelsTab,
  WebMCPToolsTab,
  SettingsTab,
  PromptCommandsTab,
} from './components';
import MCPServersTab from './components/mcpServers';
import { useSettings } from '../stateProviders';

type ExtendedMenuItem = MenuItem & {
  component?: React.ReactNode;
  items?: ExtendedMenuItem[];
};

const Items: ExtendedMenuItem[] = [
  {
    title: 'Models',
    id: 'models',
    icon: () => <CpuIcon />,
    component: <ModelsTab />,
  },
  {
    title: 'MCP',
    id: 'mcp-group',
    icon: () => <Database />,
    items: [
      {
        title: 'MCP Servers',
        id: 'mcp-server',
        icon: () => <Server />,
        component: <MCPServersTab />,
      },
      {
        title: 'WebMCP Tools',
        id: 'webmcp-tools',
        icon: () => <CodeIcon />,
        component: <WebMCPToolsTab />,
      },
      {
        title: 'MCP Inspector',
        id: 'mcp-inspector',
        icon: () => <View />,
        component: (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            MCP Inspector (Coming Soon)
          </div>
        ),
      },
    ],
  },
  {
    title: 'Built-in AI',
    id: 'builtin-ai-group',
    icon: () => <Sparkles />,
    items: [
      {
        title: 'API Status',
        id: 'api-status',
        icon: () => <Activity />,
        component: (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            API Status (Coming Soon)
          </div>
        ),
      },
      {
        title: 'API Playgrounds',
        id: 'api-playgrounds',
        icon: () => <Play />,
        component: (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            API Playgrounds (Coming Soon)
          </div>
        ),
      },
      {
        title: 'Workflow Composer',
        id: 'workflow-composer',
        icon: () => <Workflow />,
        component: (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Workflow Composer (Coming Soon)
          </div>
        ),
      },
    ],
  },
  {
    title: 'Prompt Commands',
    id: 'prompt-commands',
    icon: () => <MessageSquare />,
    component: <PromptCommandsTab />,
  },
];

const FooterItems: ExtendedMenuItem[] = [
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

  const flatItems = useMemo(() => {
    const flatten = (items: ExtendedMenuItem[]): ExtendedMenuItem[] => {
      return items.reduce((acc: ExtendedMenuItem[], item) => {
        acc.push(item);
        if (item.items) {
          acc.push(...flatten(item.items));
        }
        return acc;
      }, []);
    };
    return [...flatten(Items), ...flatten(FooterItems)];
  }, []);

  useEffect(() => {
    // If no item is selected, or the selected item is not in the list of available items (e.g. invalid URL param),
    // default to the first available item.
    const isValidSelection = flatItems.some(
      (item) => item.id === selectedMenuItem
    );

    if (!selectedMenuItem || !isValidSelection) {
      // Find the first item that has a component (is a leaf node or a clickable parent)
      const defaultItem = flatItems.find((item) => item.component);
      if (defaultItem) {
        setSelectedMenuItem(defaultItem.id);
      }
    }
  }, [selectedMenuItem, flatItems, setSelectedMenuItem]);

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
      <Sidebar items={Items} footerItems={FooterItems} collapsible="icon" />
      {flatItems.find((item) => item.id === selectedMenuItem)?.component}
    </>
  );
}

export default Options;
