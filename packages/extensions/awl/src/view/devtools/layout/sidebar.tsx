/**
 * External dependencies
 */
import { Sidebar as DevtoolsSidebar } from '@google-awlt/design-system';
import { Hammer, Settings, Activity } from 'lucide-react';
import { openOptionsPage } from '@google-awlt/chatbot';
/**
 * Internal dependencies
 */
import {} from '../../../utils';

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
      title: 'Options',
      id: 'options',
      icon: () => <Settings width="20" height="20" />,
      onClick: openOptionsPage,
    },
  ];

  return (
    <DevtoolsSidebar
      items={items}
      footerItems={footerItems}
      collapsible="icon"
    />
  );
};

export default Sidebar;
