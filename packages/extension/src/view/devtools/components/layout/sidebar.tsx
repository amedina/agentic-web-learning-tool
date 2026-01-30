/**
 * External dependencies
 */
import { Sidebar as OptionsPageSidebar } from '@google-awlt/design-system';
import { Hammer, Settings, Activity } from 'lucide-react';

const Sidebar = () => {
  const items = [
    {
      title: 'Tools',
      id: 'tools',
      icon: () => <Hammer width="20" height="20" />,
    },
    {
      title: 'Inspector',
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
    />
  );
};

export default Sidebar;
