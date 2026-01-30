/**
 * External dependencies
 */
import { useEffect } from 'react';
import {
  Sidebar as OptionsPageSidebar,
  useSidebar,
} from '@google-awlt/design-system';
import { Hammer, Settings, Activity } from 'lucide-react';

interface SidebarProps {
  setActiveView: (view: string) => void;
}

const Sidebar = ({ setActiveView }: SidebarProps) => {
  const { actions, state } = useSidebar();
  const { selectedMenuItem } = state;

  useEffect(() => {
    if (!selectedMenuItem) {
      actions.setSelectedMenuItem('tools');
    } else {
      setActiveView(selectedMenuItem);
    }
  }, [selectedMenuItem, setActiveView, actions]);

  const items = [
    {
      title: 'WebMCP Tools',
      id: 'tools',
      icon: () => <Hammer width="20" height="20" />,
    },
    {
      title: 'WebMCP Inspector',
      id: 'inspector',
      icon: () => <Activity width="20" height="20" />,
    },
  ];

  const footerItems = [
    {
      title: 'Settings',
      id: 'settings',
      icon: () => <Settings width="20" height="20" />,
    },
  ];

  return (
    <OptionsPageSidebar
      items={items}
      footerItems={footerItems}
      collapsible="icon"
      placement="devtools"
    />
  );
};

export default Sidebar;
