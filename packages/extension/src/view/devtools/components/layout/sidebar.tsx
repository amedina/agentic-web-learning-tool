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
      icon: () => <Hammer />,
    },
    {
      title: 'WebMCP Inspector',
      id: 'inspector',
      icon: () => <Activity />,
    },
  ];

  const footerItems = [
    {
      title: 'Settings',
      id: 'settings',
      icon: () => <Settings />,
    },
  ];

  return (
    <OptionsPageSidebar
      items={items}
      footerItems={footerItems}
      collapsible="icon"
    />
  );
};

export default Sidebar;
