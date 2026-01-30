/**
 * External dependencies.
 */
import { useState } from 'react';
import { SidebarProvider } from '@google-awlt/design-system';

/**
 * Internal dependencies.
 */
import Sidebar from './sidebar';
import { WebMCPTools } from '../eventLogger/webMCPTools';
import { WebMCPInspector } from '../eventLogger/webMCPInspector';
import { useEventLogs } from '../eventLogger/hooks/useEventLogs';

export const Layout = () => {
  const [activeView, setActiveView] = useState('tools');
  const { eventLoggerData, selectedKey, setSelectedKey, setLastRunToolName } =
    useEventLogs();

  const handleToolSuccess = (toolName: string) => {
    setLastRunToolName(toolName);
    setActiveView('inspector');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'tools':
        return <WebMCPTools onToolSuccess={handleToolSuccess} />;
      case 'inspector':
        return (
          <WebMCPInspector
            eventLoggerData={eventLoggerData}
            selectedKey={selectedKey}
            setSelectedKey={setSelectedKey}
          />
        );
      case 'settings':
        return (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Settings</h2>
            <p>Settings panel implementation pending.</p>
          </div>
        );
      default:
        return <WebMCPTools onToolSuccess={handleToolSuccess} />;
    }
  };

  return (
    <SidebarProvider placement="devtools">
      <div className="flex w-full h-screen">
        <Sidebar setActiveView={setActiveView} />
        <main className="flex-1 h-full overflow-hidden">{renderContent()}</main>
      </div>
    </SidebarProvider>
  );
};
