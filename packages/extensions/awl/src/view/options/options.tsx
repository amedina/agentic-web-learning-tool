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
  APIStatusTab,
  APIPlaygroundsTab,
} from '@google-awlt/chrome-ai-playground';
import {
  CpuIcon,
  CodeIcon,
  Settings2,
  MessageSquare,
  Server,
  WorkflowIcon,
  Activity,
  Play,
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
  Workflow,
  MCPInspectorTab,
} from './components';
import MCPServersTab from './components/mcpServers';
import { useSettings } from '../stateProviders';

export type ExtendedMenuItem = MenuItem & {
  component?: React.ReactNode;
  items?: ExtendedMenuItem[];
};

const Items: ExtendedMenuItem[] = [
  {
    title: 'Models',
    id: 'models',
    icon: () => <CpuIcon />,
    component: <ModelsTab />,
    isDisabled: false,
  },
  {
    title: 'MCP',
    id: 'mcp-group',
    icon: () => <Database />,
    isDisabled: false,
    items: [
      {
        title: 'MCP Servers',
        id: 'mcp-server',
        icon: () => <Server />,
        component: <MCPServersTab />,
        isDisabled: false,
      },
      {
        title: 'WebMCP Tools',
        id: 'webmcp-tools',
        icon: () => <CodeIcon />,
        component: <WebMCPToolsTab />,
        isDisabled: false,
      },
      {
        title: 'MCP Inspector',
        id: 'mcp-inspector',
        icon: () => <View />,
        component: <MCPInspectorTab />,
        isDisabled: true,
      },
    ],
  },
  {
    title: 'Built-in AI',
    id: 'builtin-ai-group',
    icon: () => <Sparkles />,
    isDisabled: false,
    items: [
      {
        title: 'API Status',
        id: 'api-status',
        icon: () => <Activity />,
        component: <APIStatusTab />,
        isDisabled: false,
      },
      {
        title: 'API Playgrounds',
        id: 'api-playgrounds',
        icon: () => <Play />,
        component: <APIPlaygroundsTab />,
        isDisabled: false,
      },
      {
        title: 'Workflow Composer',
        id: 'workflow-composer',
        icon: () => <WorkflowIcon />,
        component: <Workflow />,
        isDisabled: false,
      },
    ],
  },
  {
    title: 'Prompt Commands',
    id: 'prompt-commands',
    icon: () => <MessageSquare />,
    component: <PromptCommandsTab />,
    isDisabled: false,
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
    (async () => {
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
    })();
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
