/**
 * External dependencies.
 */
import { useState } from 'react';
import { SidebarProvider } from '@google-awlt/design-system';

/**
 * Internal dependencies.
 */
import Sidebar from './sidebar';
import { EventLogger } from '../eventLogger';

export const Layout = () => {
  const [activeView, setActiveView] = useState('tools');

  const renderContent = () => {
    switch (activeView) {
      case 'tools':
        return <EventLogger showAllTools={true} />;
      case 'inspector':
        return <EventLogger showAllTools={false} />;
      case 'settings':
        return (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Settings</h2>
            <p>Settings panel implementation pending.</p>
          </div>
        );
      default:
        return <EventLogger showAllTools={true} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex w-full h-screen">
        <Sidebar setActiveView={setActiveView} />
        <main className="flex-1 h-full overflow-hidden">{renderContent()}</main>
      </div>
    </SidebarProvider>
  );
};
